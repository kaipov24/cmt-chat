import type { GlobeMarker } from '@cmt/shared-types';

export interface CommunitySummaryDto {
  id: string;
  name: string;
  slug: string;
  type: 'country' | 'city' | 'topic';
  country: string | null;
  city: string | null;
  description: string | null;
  memberCount: number;
}

export interface PublicProfileDto {
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  displayName: string;
  id: string;
  locationVisibility: 'city' | 'country' | 'hidden';
  showOnlineStatus: boolean;
  username: string;
  user: {
    id: string;
    lastSeenAt: string | null;
    role: string;
    status: string;
  };
}

const fallbackMarkers: GlobeMarker[] = [
  {
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    latitude: 42.87,
    longitude: 74.59,
    onlineCount: 0,
    userCount: 2,
  },
  {
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.51,
    longitude: -0.13,
    onlineCount: 0,
    userCount: 2,
  },
  {
    city: 'New York',
    country: 'United States',
    latitude: 40.71,
    longitude: -74.01,
    onlineCount: 0,
    userCount: 2,
  },
  {
    city: 'Berlin',
    country: 'Germany',
    latitude: 52.52,
    longitude: 13.405,
    onlineCount: 0,
    userCount: 2,
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.68,
    longitude: 139.76,
    onlineCount: 0,
    userCount: 2,
  },
];

const fallbackCommunities: CommunitySummaryDto[] = [
  {
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    description: 'City community for people affected by CMT in Bishkek.',
    id: 'fallback-bishkek',
    memberCount: 2,
    name: 'Bishkek CMT Community',
    slug: 'kyrgyzstan-bishkek',
    type: 'city',
  },
  {
    city: null,
    country: null,
    description: 'A topic community for people who are newly diagnosed.',
    id: 'fallback-newly-diagnosed',
    memberCount: 0,
    name: 'Newly Diagnosed',
    slug: 'newly-diagnosed',
    type: 'topic',
  },
];

const fallbackPeople: PublicProfileDto[] = [
  {
    avatarUrl: null,
    bio: 'Looking to connect with other people living with CMT nearby.',
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    displayName: 'Aida',
    id: 'fallback-aida',
    locationVisibility: 'city',
    showOnlineStatus: true,
    username: 'aida',
    user: {
      id: 'fallback-user-aida',
      lastSeenAt: null,
      role: 'member',
      status: 'active',
    },
  },
  {
    avatarUrl: null,
    bio: 'Open to practical tips, local resources, and a quick chat.',
    city: 'London',
    country: 'United Kingdom',
    displayName: 'Sam',
    id: 'fallback-sam',
    locationVisibility: 'city',
    showOnlineStatus: true,
    username: 'sam',
    user: {
      id: 'fallback-user-sam',
      lastSeenAt: null,
      role: 'member',
      status: 'active',
    },
  },
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getGlobeMarkers() {
  return fetchJson<GlobeMarker[]>('/api/locations/globe', fallbackMarkers);
}

export async function getActiveCommunities() {
  return fetchJson<CommunitySummaryDto[]>('/api/communities', fallbackCommunities);
}

export async function getPublicPeople() {
  return fetchJson<PublicProfileDto[]>('/api/users', fallbackPeople);
}
