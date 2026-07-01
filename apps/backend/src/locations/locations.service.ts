import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
