import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CommunitiesService } from './communities.service';
import { ListCommunitiesDto } from './dto/list-communities.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communities: CommunitiesService) {}

  @Get()
  listCommunities(@Query() query: ListCommunitiesDto) {
    return this.communities.listCommunities(query);
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

  @Get(':id/members')
  listMembers(@Param('id') id: string) {
    return this.communities.listMembers(id);
  }
}
