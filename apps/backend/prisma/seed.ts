import { PrismaClient, type Community, type Profile, type User } from '@prisma/client';

const prisma = new PrismaClient();

type SeedLocation = {
  country: string;
  city: string;
  latitude: string;
  longitude: string;
  users: Array<{
    email: string;
    username: string;
    displayName: string;
    online: boolean;
  }>;
};

const seedLocations: SeedLocation[] = [
  {
    country: 'Kyrgyzstan',
    city: 'Bishkek',
    latitude: '42.87000',
    longitude: '74.59000',
    users: [
      { email: 'aida@example.test', username: 'aida_bishkek', displayName: 'Aida', online: true },
      { email: 'timur@example.test', username: 'timur_kg', displayName: 'Timur', online: false },
    ],
  },
  {
    country: 'United Kingdom',
    city: 'London',
    latitude: '51.51000',
    longitude: '-0.13000',
    users: [
      { email: 'maya@example.test', username: 'maya_london', displayName: 'Maya', online: true },
      { email: 'oliver@example.test', username: 'oliver_uk', displayName: 'Oliver', online: false },
    ],
  },
  {
    country: 'United States',
    city: 'New York',
    latitude: '40.71000',
    longitude: '-74.01000',
    users: [
      { email: 'nora@example.test', username: 'nora_nyc', displayName: 'Nora', online: true },
      { email: 'sam@example.test', username: 'sam_nyc', displayName: 'Sam', online: true },
    ],
  },
  {
    country: 'Germany',
    city: 'Berlin',
    latitude: '52.52000',
    longitude: '13.40500',
    users: [
      { email: 'lena@example.test', username: 'lena_berlin', displayName: 'Lena', online: false },
      { email: 'jonas@example.test', username: 'jonas_de', displayName: 'Jonas', online: true },
    ],
  },
  {
    country: 'Japan',
    city: 'Tokyo',
    latitude: '35.68000',
    longitude: '139.76000',
    users: [
      { email: 'hana@example.test', username: 'hana_tokyo', displayName: 'Hana', online: true },
      { email: 'ren@example.test', username: 'ren_jp', displayName: 'Ren', online: false },
    ],
  },
];

const countrySlug = (country: string) => country.toLowerCase().replaceAll(' ', '-');
const citySlug = (country: string, city: string) =>
  `${countrySlug(country)}-${city.toLowerCase().replaceAll(' ', '-')}`;

async function upsertCommunity(location: SeedLocation): Promise<Community> {
  return prisma.community.upsert({
    where: { slug: citySlug(location.country, location.city) },
    update: {
      country: location.country,
      city: location.city,
      description: `City community for people affected by CMT in ${location.city}.`,
      name: `${location.city} CMT Community`,
      type: 'city',
    },
    create: {
      country: location.country,
      city: location.city,
      description: `City community for people affected by CMT in ${location.city}.`,
      name: `${location.city} CMT Community`,
      slug: citySlug(location.country, location.city),
      type: 'city',
    },
  });
}

async function upsertCountryCommunity(location: SeedLocation): Promise<Community> {
  return prisma.community.upsert({
    where: { slug: countrySlug(location.country) },
    update: {
      country: location.country,
      city: null,
      description: `Country community for people affected by CMT in ${location.country}.`,
      name: `${location.country} CMT Community`,
      type: 'country',
    },
    create: {
      country: location.country,
      city: null,
      description: `Country community for people affected by CMT in ${location.country}.`,
      name: `${location.country} CMT Community`,
      slug: countrySlug(location.country),
      type: 'country',
    },
  });
}

async function upsertUserWithProfile(
  location: SeedLocation,
  userSeed: SeedLocation['users'][number],
): Promise<User & { profile: Profile | null }> {
  return prisma.user.upsert({
    where: { email: userSeed.email },
    update: {
      lastSeenAt: userSeed.online ? new Date() : null,
      profile: {
        upsert: {
          update: {
            city: location.city,
            country: location.country,
            displayName: userSeed.displayName,
            latitude: location.latitude,
            longitude: location.longitude,
            locationVisibility: 'city',
            showOnlineStatus: true,
            username: userSeed.username,
          },
          create: {
            city: location.city,
            country: location.country,
            displayName: userSeed.displayName,
            latitude: location.latitude,
            longitude: location.longitude,
            locationVisibility: 'city',
            showOnlineStatus: true,
            username: userSeed.username,
          },
        },
      },
    },
    create: {
      email: userSeed.email,
      lastSeenAt: userSeed.online ? new Date() : null,
      passwordHash: 'phase-2-seed-placeholder-not-for-login',
      profile: {
        create: {
          city: location.city,
          country: location.country,
          displayName: userSeed.displayName,
          latitude: location.latitude,
          longitude: location.longitude,
          locationVisibility: 'city',
          showOnlineStatus: true,
          username: userSeed.username,
        },
      },
    },
    include: {
      profile: true,
    },
  });
}

async function ensureMembership(communityId: string, userId: string) {
  await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId,
        userId,
      },
    },
    update: {},
    create: {
      communityId,
      userId,
    },
  });
}

async function main() {
  for (const location of seedLocations) {
    const countryCommunity = await upsertCountryCommunity(location);
    const cityCommunity = await upsertCommunity(location);

    for (const userSeed of location.users) {
      const user = await upsertUserWithProfile(location, userSeed);
      await ensureMembership(countryCommunity.id, user.id);
      await ensureMembership(cityCommunity.id, user.id);
    }
  }

  await prisma.community.upsert({
    where: { slug: 'newly-diagnosed' },
    update: {
      description: 'A topic community for people who are newly diagnosed or supporting someone newly diagnosed.',
      name: 'Newly Diagnosed',
      type: 'topic',
    },
    create: {
      description: 'A topic community for people who are newly diagnosed or supporting someone newly diagnosed.',
      name: 'Newly Diagnosed',
      slug: 'newly-diagnosed',
      type: 'topic',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
