import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateDirectMessageDto } from './dto/create-direct-message.dto';

const participantSelect = {
  id: true,
  profile: {
    select: {
      avatarUrl: true,
      city: true,
      country: true,
      displayName: true,
      locationVisibility: true,
      username: true,
    },
  },
} as const satisfies Prisma.UserSelect;

const conversationSelect = {
  createdAt: true,
  id: true,
  participantA: {
    select: participantSelect,
  },
  participantB: {
    select: participantSelect,
  },
  updatedAt: true,
  messages: {
    orderBy: { createdAt: 'desc' },
    select: {
      content: true,
      createdAt: true,
      id: true,
      senderId: true,
    },
    take: 1,
    where: {
      deletedAt: null,
    },
  },
} as const satisfies Prisma.DirectConversationSelect;

const messageSelect = {
  content: true,
  createdAt: true,
  id: true,
  readAt: true,
  sender: {
    select: participantSelect,
  },
} as const satisfies Prisma.DirectMessageSelect;

type SelectedConversation = Prisma.DirectConversationGetPayload<{
  select: typeof conversationSelect;
}>;

type SelectedDirectMessage = Prisma.DirectMessageGetPayload<{
  select: typeof messageSelect;
}>;

function orderedParticipantIds(userAId: string, userBId: string) {
  return userAId < userBId
    ? { participantAId: userAId, participantBId: userBId }
    : { participantAId: userBId, participantBId: userAId };
}

@Injectable()
export class DirectMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(user: AuthenticatedUser) {
    const conversations = await this.prisma.directConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      select: conversationSelect,
      where: {
        OR: [{ participantAId: user.id }, { participantBId: user.id }],
      },
    });

    return conversations.map((conversation) => this.toConversationResponse(conversation, user.id));
  }

  async findOrCreateConversation(dto: CreateConversationDto, user: AuthenticatedUser) {
    if (dto.recipientUserId === user.id) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      select: { id: true, status: true },
      where: { id: dto.recipientUserId },
    });

    if (!recipient || recipient.status !== 'active') {
      throw new NotFoundException('Recipient not found');
    }

    const participants = orderedParticipantIds(user.id, recipient.id);
    let conversation: SelectedConversation | null = null;

    try {
      conversation = await this.prisma.directConversation.upsert({
        create: participants,
        update: {},
        select: conversationSelect,
        where: {
          participantAId_participantBId: participants,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }

      conversation = await this.prisma.directConversation.findUnique({
        select: conversationSelect,
        where: {
          participantAId_participantBId: participants,
        },
      });
    }

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.toConversationResponse(conversation, user.id);
  }

  async listMessages(conversationId: string, user: AuthenticatedUser) {
    await this.assertParticipant(conversationId, user.id);

    const messages = await this.prisma.directMessage.findMany({
      orderBy: { createdAt: 'asc' },
      select: messageSelect,
      take: 100,
      where: {
        conversationId,
        deletedAt: null,
      },
    });

    return messages.map((message) => this.toMessageResponse(message));
  }

  async createMessage(conversationId: string, dto: CreateDirectMessageDto, user: AuthenticatedUser) {
    await this.assertParticipant(conversationId, user.id);

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.directMessage.create({
        data: {
          content: dto.content.trim(),
          conversationId,
          senderId: user.id,
        },
        select: messageSelect,
      });

      await tx.directConversation.update({
        data: { updatedAt: new Date() },
        where: { id: conversationId },
      });

      return createdMessage;
    });

    return this.toMessageResponse(message);
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.directConversation.findFirst({
      select: { id: true },
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Conversation access is denied');
    }
  }

  private toConversationResponse(conversation: SelectedConversation, currentUserId: string) {
    const otherParticipant =
      conversation.participantA.id === currentUserId
        ? conversation.participantB
        : conversation.participantA;
    const latestMessage = conversation.messages[0] ?? null;

    return {
      createdAt: conversation.createdAt,
      id: conversation.id,
      latestMessage,
      otherParticipant: this.toParticipantResponse(otherParticipant),
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessageResponse(message: SelectedDirectMessage) {
    return {
      content: message.content,
      createdAt: message.createdAt,
      id: message.id,
      readAt: message.readAt,
      sender: this.toParticipantResponse(message.sender),
    };
  }

  private toParticipantResponse(participant: Prisma.UserGetPayload<{ select: typeof participantSelect }>) {
    const profile = participant.profile;

    return {
      id: participant.id,
      profile: profile
        ? {
            avatarUrl: profile.avatarUrl,
            city: profile.locationVisibility === 'city' ? profile.city : null,
            country:
              profile.locationVisibility === 'city' || profile.locationVisibility === 'country'
                ? profile.country
                : null,
            displayName: profile.displayName,
            username: profile.username,
          }
        : null,
    };
  }
}
