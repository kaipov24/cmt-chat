import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const knownCityCenters = new Map<string, { latitude: number; longitude: number }>([
  ['Kyrgyzstan|Bishkek', { latitude: 42.87, longitude: 74.59 }],
  ['United Kingdom|London', { latitude: 51.51, longitude: -0.13 }],
  ['United States|New York', { latitude: 40.71, longitude: -74.01 }],
  ['Germany|Berlin', { latitude: 52.52, longitude: 13.405 }],
  ['Japan|Tokyo', { latitude: 35.68, longitude: 139.76 }],
]);

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listGlobeMarkers() {
    const onlineSince = new Date(Date.now() - 15 * 60 * 1000);
    const groupedProfiles = await this.prisma.profile.groupBy({
      _count: {
        _all: true,
      },
      by: ['country', 'city'],
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
      where: {
        city: { not: null },
        country: { not: null },
        locationVisibility: 'city',
        user: {
          status: 'active',
        },
      },
    });

    return Promise.all(
      groupedProfiles.map(async (location) => {
        const country = location.country ?? '';
        const city = location.city ?? '';
        const coordinates = await this.getCityCoordinates(country, city);
        const onlineCount = await this.prisma.profile.count({
          where: {
            city,
            country,
            locationVisibility: 'city',
            showOnlineStatus: true,
            user: {
              lastSeenAt: {
                gte: onlineSince,
              },
              status: 'active',
            },
          },
        });

        return {
          city,
          country,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          onlineCount,
          userCount: location._count._all,
        };
      }),
    );
  }

  async listCountries() {
    const countries = await this.prisma.profile.groupBy({
      _count: {
        _all: true,
      },
      by: ['country'],
      orderBy: {
        country: 'asc',
      },
      where: {
        country: { not: null },
        locationVisibility: { in: ['country', 'city'] },
        user: {
          status: 'active',
        },
      },
    });

    return countries.map((country) => ({
      country: country.country,
      userCount: country._count._all,
    }));
  }

  async listCities(country?: string) {
    const cities = await this.prisma.profile.groupBy({
      _count: {
        _all: true,
      },
      by: ['country', 'city'],
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
      where: {
        city: { not: null },
        country: country?.trim() || { not: null },
        locationVisibility: 'city',
        user: {
          status: 'active',
        },
      },
    });

    return cities.map((city) => ({
      city: city.city,
      country: city.country,
      userCount: city._count._all,
    }));
  }

  private async getCityCoordinates(country: string, city: string) {
    const knownCoordinates = knownCityCenters.get(`${country}|${city}`);

    if (knownCoordinates) {
      return knownCoordinates;
    }

    const profile = await this.prisma.profile.findFirst({
      select: {
        latitude: true,
        longitude: true,
      },
      where: {
        city,
        country,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    return {
      latitude: Number(profile?.latitude ?? 0),
      longitude: Number(profile?.longitude ?? 0),
    };
  }
}
