import { IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  faculty?: string | null;

  @IsOptional()
  schoolYear?: number | null;

  @IsOptional()
  interests?: string[];

  @IsOptional()
  avatarUrl?: string | null;

  @IsOptional()
  bio?: string | null;
}

export class ChangePasswordDto {
  @IsOptional()
  currentPassword?: string;

  @IsOptional()
  newPassword?: string;
}
