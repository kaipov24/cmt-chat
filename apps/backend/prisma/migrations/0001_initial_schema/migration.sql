CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE "LocationVisibility" AS ENUM ('hidden', 'country', 'city');
CREATE TYPE "CommunityType" AS ENUM ('country', 'city', 'topic');
CREATE TYPE "CommunityMemberRole" AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewed', 'dismissed', 'action_taken');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "status" "UserStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "country" TEXT,
  "city" TEXT,
  "latitude" DECIMAL(8,5),
  "longitude" DECIMAL(8,5),
  "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'city',
  "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Community" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "CommunityType" NOT NULL,
  "country" TEXT,
  "city" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityMember" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "communityId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "CommunityMemberRole" NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "senderId" UUID NOT NULL,
  "communityId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reporterId" UUID NOT NULL,
  "reportedUserId" UUID NOT NULL,
  "messageId" UUID,
  "reason" TEXT NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),

  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_lastSeenAt_idx" ON "User"("lastSeenAt");

CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
CREATE INDEX "Profile_country_idx" ON "Profile"("country");
CREATE INDEX "Profile_country_city_idx" ON "Profile"("country", "city");

CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");
CREATE INDEX "Community_type_idx" ON "Community"("type");
CREATE INDEX "Community_country_idx" ON "Community"("country");
CREATE INDEX "Community_country_city_idx" ON "Community"("country", "city");

CREATE UNIQUE INDEX "CommunityMember_communityId_userId_key" ON "CommunityMember"("communityId", "userId");
CREATE INDEX "CommunityMember_userId_idx" ON "CommunityMember"("userId");

CREATE INDEX "Message_communityId_createdAt_idx" ON "Message"("communityId", "createdAt");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_deletedAt_idx" ON "Message"("deletedAt");

CREATE INDEX "Report_status_idx" ON "Report"("status");
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");
CREATE INDEX "Report_messageId_idx" ON "Report"("messageId");

ALTER TABLE "Profile"
  ADD CONSTRAINT "Profile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityMember"
  ADD CONSTRAINT "CommunityMember_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityMember"
  ADD CONSTRAINT "CommunityMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_reportedUserId_fkey"
  FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
