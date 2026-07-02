import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DirectMessagesService } from './direct-messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';

@Controller('direct-messages')
@UseGuards(JwtAuthGuard)
export class DirectMessagesController {
  constructor(private readonly directMessages: DirectMessagesService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.directMessages.listConversations(user);
  }

  @Post('conversations')
  findOrCreateConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.directMessages.findOrCreateConversation(dto, user);
  }

  @Get('conversations/:id/messages')
  listMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.directMessages.listMessages(id, user);
  }

  @Post('conversations/:id/messages')
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateDirectMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.directMessages.createMessage(id, dto, user);
  }
}
