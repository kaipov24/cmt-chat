export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type CommunityType = 'country' | 'city' | 'topic';
export type LocationVisibility = 'hidden' | 'country' | 'city';

export interface GlobeMarker {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  userCount: number;
  onlineCount: number;
}

export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  type: CommunityType;
  country: string | null;
  city: string | null;
  memberCount: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  country: string | null;
  city: string | null;
  showOnlineStatus: boolean;
}
