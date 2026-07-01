import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { SearchUsersDto } from './dto/search-users.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const profileSelect = {
  avatarUrl: true,
  bio: true,
  city: true,
  country: true,
  displayName: true,
  id: true,
  locationVisibility: true,
  showOnlineStatus: true,
  username: true,
  user: {
    select: {
      id: true,
      lastSeenAt: true,
      role: true,
      status: true,
    },
  },
} as const satisfies Prisma.ProfileSelect;

type SelectedProfile = Prisma.ProfileGetPayload<{
  select: typeof profileSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(query: SearchUsersDto) {
    const search = query.search?.trim();

    const profiles = await this.prisma.profile.findMany({
      orderBy: [{ country: 'asc' }, { city: 'asc' }, { username: 'asc' }],
      select: profileSelect,
      take: 50,
      where: {
        country: query.country?.trim() || undefined,
        city: query.city?.trim() || undefined,
        user: {
          status: 'active',
        },
        ...(search
          ? {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });

    return profiles.map((profile) => this.toPublicProfile(profile));
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      select: profileSelect,
      where: { userId },
    });

    if (!profile || profile.user.status !== 'active') {
      throw new NotFoundException('Profile not found');
    }

    return this.toPublicProfile(profile);
  }

  async getMyProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      select: profileSelect,
      where: { userId: user.id },
    });

    if (!profile || profile.user.status !== 'active') {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateMyProfile(user: AuthenticatedUser, dto: UpdateProfileDto) {
    const data: Prisma.ProfileUpdateInput = {};

    if (dto.displayName !== undefined) data.displayName = dto.displayName.trim();
    if (dto.bio !== undefined) data.bio = dto.bio.trim() || null;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl.trim() || null;
    if (dto.country !== undefined) data.country = dto.country.trim() || null;
    if (dto.city !== undefined) data.city = dto.city.trim() || null;
    if (dto.locationVisibility !== undefined) data.locationVisibility = dto.locationVisibility;
    if (dto.showOnlineStatus !== undefined) data.showOnlineStatus = dto.showOnlineStatus;

    return this.prisma.profile.update({
      data,
      select: profileSelect,
      where: { userId: user.id },
    });
  }

  private toPublicProfile(profile: SelectedProfile) {
    return {
      ...profile,
      city: profile.locationVisibility === 'city' ? profile.city : null,
      country:
        profile.locationVisibility === 'city' || profile.locationVisibility === 'country'
          ? profile.country
          : null,
    };
  }
}
