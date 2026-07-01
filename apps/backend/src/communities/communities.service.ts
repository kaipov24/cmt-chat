import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
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
}
