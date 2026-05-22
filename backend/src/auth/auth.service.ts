import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ----------------------------------------------------------------
  // Bước 1: Gửi OTP về email HUST
  // ----------------------------------------------------------------
  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.toLowerCase();

    if (!email.endsWith('@sis.hust.edu.vn')) {
      throw new BadRequestException('Chỉ chấp nhận email @sis.hust.edu.vn');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email này đã được đăng ký');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await this.prisma.emailVerificationCode.create({
      data: { email, code: otp, purpose: 'REGISTER', expiresAt },
    });

    await this.sendOtpEmail(email, otp);

    return { message: 'OK' };
  }

  // ----------------------------------------------------------------
  // Bước 2: Xác minh OTP → trả về thông tin trích từ email + tempToken
  // ----------------------------------------------------------------
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase();

    const record = await this.prisma.emailVerificationCode.findFirst({
      where: { email, code: dto.otp, purpose: 'REGISTER', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('OTP không hợp lệ');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP đã hết hạn');
    }

    await this.prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const prefill = this.parseHustEmail(email);

    // Temp token tồn tại 10 phút, chứng minh email đã được verify
    const tempToken = this.jwt.sign(
      { email, type: 'temp_registration' },
      { expiresIn: '10m' },
    );

    return { message: 'OK', tempToken, prefill };
  }

  // ----------------------------------------------------------------
  // Bước 3: Hoàn tất đăng ký → tạo user, trả access token
  // ----------------------------------------------------------------
  async register(dto: RegisterDto) {
    let payload: { email: string; type: string };
    try {
      payload = this.jwt.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('Phiên xác thực hết hạn, vui lòng thử lại');
    }

    if (payload.type !== 'temp_registration') {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const email = payload.email;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email này đã được đăng ký');
    }

    const { studentId, schoolYear } = this.parseHustEmail(email);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        studentId,
        passwordHash,
        name: dto.name,
        schoolYear,
        isVerified: true,
      },
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
  // Trích xuất thông tin từ email HUST
  // VD: huyen.dnk225726@sis.hust.edu.vn
  //   → firstName: "Huyen", studentId: "20225726", schoolYear: 4
  // ----------------------------------------------------------------
  private parseHustEmail(email: string) {
    const localPart = email.split('@')[0]; // "huyen.dnk225726"
    const parts = localPart.split('.');    // ["huyen", "dnk225726"]
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

    const suffix = parts[1] ?? '';
    const digits = suffix.match(/\d+$/)?.[0] ?? '';
    const studentId = `20${digits}`;       // "20225726"

    const enrollmentYear = 2000 + parseInt(digits.substring(0, 2), 10); // 2022
    const now = new Date();
    // Năm học mới bắt đầu từ tháng 9
    const currentAcademicYear =
      now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const schoolYear = currentAcademicYear - enrollmentYear + 1;

    return { firstName, studentId, enrollmentYear, schoolYear };
  }

  // ----------------------------------------------------------------
  // Gửi email chứa OTP qua nodemailer
  // ----------------------------------------------------------------
  private async sendOtpEmail(to: string, otp: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
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
