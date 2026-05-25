import { IsIn, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  name: string;

  // Mật khẩu: ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 chữ số',
  })
  password: string;

  // Temp token nhận được sau khi verify OTP thành công
  @IsString()
  tempToken: string;

  @IsString()
  @IsIn(['male', 'female'], { message: 'Giới tính không hợp lệ' })
  gender: string;
}
