export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type CommunityType = 'country' | 'city' | 'topic';
export type LocationVisibility = 'hidden' | 'country' | 'city';
export type CommunityMemberRole = 'member' | 'moderator' | 'admin';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

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

export interface LocationOption {
  country: string | null;
  city?: string | null;
  userCount: number;
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

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: Pick<PublicProfile, 'displayName' | 'username'> | null;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
