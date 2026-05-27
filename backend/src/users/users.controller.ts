import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, AVATAR_IMAGE_MAX_BYTES, type UploadableImageFile } from '../cloudinary/cloudinary.service';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // GET /api/users/:userId/profile
  @Get(':userId/profile')
  getPublicProfile(
    @Param(
      'userId',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('error'),
      }),
    )
    userId: string,
  ) {
    return this.usersService.getPublicProfile(userId);
  }

  // PUT /api/users/me/profile
  @UseGuards(JwtAuthGuard)

  // GET /api/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyUser(@CurrentUser() user: AuthUser) {
    return {
      message: 'OK',
      id: user?.sub ?? null,
      email: user?.email ?? null,
    }
  }

  // GET /api/users/me/dashboard
  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  getMyDashboard(@CurrentUser() user: AuthUser) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }

    return this.usersService.getMyDashboard(userId)
  }

  // POST /api/users/me/avatar
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_IMAGE_MAX_BYTES },
    }),
  )
  async uploadMyAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() avatar?: UploadableImageFile,
  ) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }
    if (!avatar) {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện')
    }

    const uploaded = await this.cloudinaryService.uploadUserAvatar(avatar)
    return {
      message: 'OK',
      secureUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  updateMyProfilePut(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }
    return this.usersService.updateMyProfile(userId, dto);
  }

  // PATCH /api/users/me/profile
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyProfilePatch(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }
    return this.usersService.updateMyProfile(userId, dto);
  }

  // PATCH /api/users/me/password
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changeMyPassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }
    return this.usersService.changeMyPassword(userId, dto)
  }
}
