import { IsEmail, Matches, MinLength, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Matches(/^\d{6}$/, { message: 'OTP phải đúng 6 chữ số' })
  otp: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 chữ số',
  })
  newPassword: string;
}
