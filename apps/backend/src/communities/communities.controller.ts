import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListCommunitiesDto } from './dto/list-communities.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communities: CommunitiesService) {}

  @Get()
  listCommunities(@Query() query: ListCommunitiesDto) {
    return this.communities.listCommunities(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createCommunity(@Body() dto: CreateCommunityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communities.createCommunity(dto, user);
  }

  @Get(':id')
  getCommunity(@Param('id') id: string) {
    return this.communities.getCommunity(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  joinCommunity(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.communities.joinCommunity(id, user);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveCommunity(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.communities.leaveCommunity(id, user);
  }

  @Get(':id/membership')
  @UseGuards(JwtAuthGuard)
  getMyMembership(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.communities.getMyMembership(id, user);
  }

  @Get(':id/members')
  listMembers(@Param('id') id: string) {
    return this.communities.listMembers(id);
  }

  @Get(':id/messages')
  listMessages(@Param('id') id: string) {
    return this.communities.listMessages(id);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communities.createMessage(id, dto, user);
  }
}
