import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { Gender } from '@prisma/client';

import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Format: firstName.InitialsMSSVsuffix  VD: Huyen.DNK225726
const HUST_LOCAL_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+\d{6,7}$/;

@Injectable()
export class AuthService {
  private transporter?: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private getTransporter() {
    if (this.transporter) return this.transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
      throw new InternalServerErrorException('Missing SMTP config (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)');
    }
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  // ----------------------------------------------------------------
  // Bước 1: Gửi OTP về email HUST
  // ----------------------------------------------------------------
  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.toLowerCase();

    if (!email.endsWith('@sis.hust.edu.vn')) {
      throw new BadRequestException('Chỉ chấp nhận email @sis.hust.edu.vn');
    }

    const localPart = email.split('@')[0];
    if (!HUST_LOCAL_REGEX.test(localPart)) {
      throw new BadRequestException('Định dạng email HUST không hợp lệ (VD: Ten.ABC225726@sis.hust.edu.vn)');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email này đã được đăng ký');
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Vô hiệu hóa OTP cũ và tạo OTP mới trong 1 transaction
    const [, record] = await this.prisma.$transaction([
      this.prisma.emailVerificationCode.updateMany({
        where: { email, purpose: 'REGISTER', usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationCode.create({
        data: { email, code: otp, purpose: 'REGISTER', expiresAt },
      }),
    ]);

    try {
      await this.sendOtpEmail(email, otp);
    } catch {
      // Rollback nếu gửi mail thất bại
      await this.prisma.emailVerificationCode.delete({ where: { id: record.id } });
      throw new InternalServerErrorException('Không thể gửi email, vui lòng thử lại');
    }

    return { message: 'OK' };
  }

  // ----------------------------------------------------------------
  // Bước 2: Xác minh OTP → trả về thông tin trích từ email + tempToken
  // ----------------------------------------------------------------
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase();

    const now = new Date();

    // Atomic: chỉ update được nếu OTP đúng, chưa dùng, chưa hết hạn
    const consumed = await this.prisma.emailVerificationCode.updateMany({
      where: { email, code: dto.otp, purpose: 'REGISTER', usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (consumed.count === 0) {
      // Phân biệt "sai OTP" vs "hết hạn"
      const exists = await this.prisma.emailVerificationCode.findFirst({
        where: { email, code: dto.otp, purpose: 'REGISTER' },
        orderBy: { createdAt: 'desc' },
      });
      if (exists && exists.expiresAt < now) throw new BadRequestException('OTP đã hết hạn');
      throw new BadRequestException('OTP không hợp lệ');
    }

    const { firstName, studentId, schoolYear } = this.parseHustEmail(email);

    const tempToken = this.jwt.sign(
      { email, type: 'temp_registration' },
      { expiresIn: '10m' },
    );

    return { message: 'OK', tempToken, prefill: { firstName, studentId, schoolYear } };
  }

  // ----------------------------------------------------------------
  // Bước 3: Hoàn tất đăng ký → tạo user, trả access token
  // ----------------------------------------------------------------
  async register(dto: RegisterDto) {
    let payload: { email: string; type: string };
    try {
      payload = this.jwt.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('Phiên xác thực hết hạn');
    }

    if (payload.type !== 'temp_registration') {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const email = payload.email;

    if (!email.endsWith('@sis.hust.edu.vn')) {
      throw new BadRequestException('Email không hợp lệ');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email này đã được đăng ký');
    }

    const { studentId, schoolYear } = this.parseHustEmail(email);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const normalizedGender = dto.gender.toLowerCase();
    const gender = normalizedGender === 'male' ? Gender.MALE : Gender.FEMALE;

    const user = await this.prisma.user.create({
      data: { email, studentId, passwordHash, name: dto.name, schoolYear, gender, isVerified: true },
    });

    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });

    return { message: 'OK', accessToken };
  }

  // ----------------------------------------------------------------
  // Đăng nhập
  // ----------------------------------------------------------------
  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    if (!email.endsWith('@sis.hust.edu.vn')) {
      throw new BadRequestException('Chỉ chấp nhận email @sis.hust.edu.vn');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực email');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });

    return { message: 'OK', accessToken };
  }

  // ----------------------------------------------------------------
  // Quên mật khẩu — gửi OTP về email
  // ----------------------------------------------------------------
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();

    if (!email.endsWith('@sis.hust.edu.vn')) {
      throw new BadRequestException('Chỉ chấp nhận email @sis.hust.edu.vn');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email này chưa được đăng ký');
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const [, record] = await this.prisma.$transaction([
      this.prisma.emailVerificationCode.updateMany({
        where: { email, purpose: 'RESET_PASSWORD', usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationCode.create({
        data: { email, userId: user.id, code: otp, purpose: 'RESET_PASSWORD', expiresAt },
      }),
    ]);

    try {
      await this.sendOtpEmail(email, otp);
    } catch {
      await this.prisma.emailVerificationCode.delete({ where: { id: record.id } });
      throw new InternalServerErrorException('Không thể gửi email, vui lòng thử lại');
    }

    return { message: 'OK' };
  }

  // ----------------------------------------------------------------
  // Đặt lại mật khẩu — xác minh OTP và cập nhật password
  // ----------------------------------------------------------------
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();

    const now = new Date();

    const consumed = await this.prisma.emailVerificationCode.updateMany({
      where: { email, code: dto.otp, purpose: 'RESET_PASSWORD', usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (consumed.count === 0) {
      const exists = await this.prisma.emailVerificationCode.findFirst({
        where: { email, code: dto.otp, purpose: 'RESET_PASSWORD' },
        orderBy: { createdAt: 'desc' },
      });
      if (exists && exists.expiresAt < now) throw new BadRequestException('OTP đã hết hạn');
      throw new BadRequestException('OTP không hợp lệ');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    return { message: 'OK' };
  }

  // ----------------------------------------------------------------
  // Trích xuất thông tin từ email HUST
  // VD: huyen.dnk225726@sis.hust.edu.vn
  //   → firstName: "Huyen", studentId: "20225726", schoolYear: 4
  // ----------------------------------------------------------------
  private parseHustEmail(email: string) {
    const localPart = email.split('@')[0];

    if (!HUST_LOCAL_REGEX.test(localPart)) {
      throw new BadRequestException('Định dạng email HUST không hợp lệ');
    }

    const parts = localPart.split('.');
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

    const suffix = parts[1];
    const digits = suffix.match(/\d+$/)?.[0] ?? '';
    const studentId = `20${digits}`;

    const enrollmentYear = 2000 + parseInt(digits.substring(0, 2), 10);
    const now = new Date();
    const currentAcademicYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const schoolYear = currentAcademicYear - enrollmentYear + 1;

    return { firstName, studentId, schoolYear };
  }

  // ----------------------------------------------------------------
  // Gửi email chứa OTP
  // ----------------------------------------------------------------
  private async sendOtpEmail(to: string, otp: string) {
    await this.getTransporter().sendMail({
      from: `"BuddyHub" <${process.env.SMTP_FROM}>`,
      to,
      subject: 'Mã xác thực BuddyHub',
      html: `
        <p>Xin chào!</p>
        <p>Mã xác thực của bạn là: <strong style="font-size:24px">${otp}</strong></p>
        <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
      `,
    });
  }
}
