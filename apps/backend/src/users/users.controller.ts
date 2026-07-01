import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

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

  @Get(':id/profile')
  getUserProfile(@Param('id') id: string) {
    return this.users.getProfileByUserId(id);
  }
}
