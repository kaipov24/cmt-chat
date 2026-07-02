import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { avatarUploadDirectory, ensureAvatarUploadDirectory } from './avatar-storage';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

const avatarMimeExtensions = new Map([
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

interface UploadedAvatarFile {
  buffer: Buffer;
  mimetype: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  searchUsers(@Query() query: SearchUsersDto) {
    return this.users.searchUsers(query);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getMyProfile(user);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateMyProfile(user, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (_request, file, callback) => {
        if (!avatarMimeExtensions.has(file.mimetype)) {
          callback(new BadRequestException('Avatar must be a PNG, JPG, WEBP, or GIF image.'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async uploadMyAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedAvatarFile | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar image is required.');
    }

    const extension = avatarMimeExtensions.get(file.mimetype);

    if (!extension) {
      throw new BadRequestException('Avatar must be a PNG, JPG, WEBP, or GIF image.');
    }

    ensureAvatarUploadDirectory();

    const filename = `${user.id}-${randomUUID()}${extension}`;
    const publicUrl = `/uploads/avatars/${filename}`;

    await writeFile(join(avatarUploadDirectory, filename), file.buffer);

    return this.users.updateMyAvatar(user, publicUrl);
  }

  @Get('by-username/:username/profile')
  getUserProfileByUsername(@Param('username') username: string) {
    return this.users.getProfileByUsername(username);
  }

  @Get(':id/profile')
  getUserProfile(@Param('id') id: string) {
    return this.users.getProfileByUserId(id);
  }
}
