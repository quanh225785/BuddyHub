import { IsEmail, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Matches(/^\d{6}$/, { message: 'OTP phải đúng 6 chữ số' })
  otp: string;
}
