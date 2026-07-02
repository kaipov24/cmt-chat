import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { CreateCommunityDto } from './dto/create-community.dto';
import type { CreateMessageDto } from './dto/create-message.dto';
import type { ListCommunitiesDto } from './dto/list-communities.dto';

const communitySelect = {
  city: true,
  country: true,
  createdAt: true,
  description: true,
  id: true,
  name: true,
  slug: true,
  type: true,
  _count: {
    select: {
      members: true,
    },
  },
} as const satisfies Prisma.CommunitySelect;

type SelectedCommunity = Prisma.CommunityGetPayload<{
  select: typeof communitySelect;
}>;

const messageSelect = {
  content: true,
  createdAt: true,
  id: true,
  sender: {
    select: {
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
    },
  },
} as const satisfies Prisma.MessageSelect;

type SelectedMessage = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function trimmedOrNull(value: string | undefined) {
  return value?.trim() || null;
}

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCommunities(query: ListCommunitiesDto) {
    const communities = await this.prisma.community.findMany({
      orderBy: [{ type: 'asc' }, { country: 'asc' }, { city: 'asc' }, { name: 'asc' }],
      select: communitySelect,
      where: {
        type: query.type,
        country: query.country?.trim() || undefined,
        city: query.city?.trim() || undefined,
      },
    });

    return communities.map((community) => this.toCommunityResponse(community));
  }

  async getCommunity(identifier: string) {
    const community = await this.findCommunity(identifier);

    return this.toCommunityResponse(community);
  }

  async createCommunity(dto: CreateCommunityDto, user: AuthenticatedUser) {
    const country = dto.type === 'topic' ? null : trimmedOrNull(dto.country);
    const city = dto.type === 'city' ? trimmedOrNull(dto.city) : null;
    const baseSlug =
      dto.type === 'city' && country && city
        ? slugify(`${country}-${city}-${dto.name}`)
        : slugify(dto.name);

    if (!baseSlug) {
      throw new ConflictException('Community name cannot create a valid URL');
    }

    const existingCommunity = await this.prisma.community.findUnique({
      select: { id: true },
      where: { slug: baseSlug },
    });

    if (existingCommunity) {
      throw new ConflictException('A community with this name already exists');
    }

    const community = await this.prisma.community.create({
      data: {
        city,
        country,
        description: trimmedOrNull(dto.description),
        members: {
          create: {
            role: 'admin',
            userId: user.id,
          },
        },
        name: dto.name.trim(),
        slug: baseSlug,
        type: dto.type,
      },
      select: communitySelect,
    });

    return this.toCommunityResponse(community);
  }

  async joinCommunity(identifier: string, user: AuthenticatedUser) {
    const community = await this.findCommunity(identifier);
    const existingMembership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a community member');
    }

    await this.prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: user.id,
      },
    });

    return this.toCommunityResponse(await this.findCommunity(identifier));
  }

  async leaveCommunity(identifier: string, user: AuthenticatedUser) {
    const community = await this.findCommunity(identifier);

    await this.prisma.communityMember.deleteMany({
      where: {
        communityId: community.id,
        userId: user.id,
      },
    });

    return { left: true };
  }

  async getMyMembership(identifier: string, user: AuthenticatedUser) {
    const community = await this.findCommunity(identifier);

    return this.prisma.communityMember.findUnique({
      select: {
        joinedAt: true,
        role: true,
      },
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: user.id,
        },
      },
    });
  }

  async listMembers(identifier: string) {
    const community = await this.findCommunity(identifier);

    const members = await this.prisma.communityMember.findMany({
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        joinedAt: true,
        role: true,
        user: {
          select: {
            id: true,
            role: true,
            status: true,
            profile: {
              select: {
                avatarUrl: true,
                city: true,
                country: true,
                displayName: true,
                locationVisibility: true,
                showOnlineStatus: true,
                username: true,
              },
            },
          },
        },
      },
      where: {
        communityId: community.id,
        user: {
          status: 'active',
        },
      },
    });

    return members.map((member) => ({
      ...member,
      user: {
        ...member.user,
        profile: member.user.profile
          ? {
              ...member.user.profile,
              city: member.user.profile.locationVisibility === 'city' ? member.user.profile.city : null,
              country:
                member.user.profile.locationVisibility === 'city' ||
                member.user.profile.locationVisibility === 'country'
                  ? member.user.profile.country
                  : null,
            }
          : null,
      },
    }));
  }

  async listMessages(identifier: string) {
    const community = await this.findCommunity(identifier);
    const messages = await this.prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      select: messageSelect,
      take: 50,
      where: {
        communityId: community.id,
        deletedAt: null,
        sender: {
          status: 'active',
        },
      },
    });

    return messages.map((message) => this.toMessageResponse(message));
  }

  async createMessage(identifier: string, dto: CreateMessageDto, user: AuthenticatedUser) {
    const community = await this.findCommunity(identifier);
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Join the community before posting messages');
    }

    const message = await this.prisma.message.create({
      data: {
        communityId: community.id,
        content: dto.content.trim(),
        senderId: user.id,
      },
      select: messageSelect,
    });

    return this.toMessageResponse(message);
  }

  private async findCommunity(identifier: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const community = await this.prisma.community.findFirst({
      select: communitySelect,
      where: {
        OR: [...(isUuid ? [{ id: identifier }] : []), { slug: identifier }],
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return community;
  }

  private toCommunityResponse(community: SelectedCommunity) {
    const { _count, ...rest } = community;

    return {
      ...rest,
      memberCount: _count.members,
    };
  }

  private toMessageResponse(message: SelectedMessage) {
    const profile = message.sender.profile;

    return {
      content: message.content,
      createdAt: message.createdAt,
      id: message.id,
      sender: profile
        ? {
            avatarUrl: profile.avatarUrl,
            city: profile.locationVisibility === 'city' ? profile.city : null,
            country:
              profile.locationVisibility === 'city' || profile.locationVisibility === 'country'
                ? profile.country
                : null,
            displayName: profile.displayName,
            id: message.sender.id,
            username: profile.username,
          }
        : null,
    };
  }
}
