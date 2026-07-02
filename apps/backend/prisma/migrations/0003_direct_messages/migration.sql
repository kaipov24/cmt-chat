CREATE TABLE "DirectConversation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "participantAId" UUID NOT NULL,
  "participantBId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectMessage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL,
  "senderId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DirectConversation_participantAId_participantBId_key"
  ON "DirectConversation"("participantAId", "participantBId");

CREATE INDEX "DirectConversation_participantAId_idx"
  ON "DirectConversation"("participantAId");

CREATE INDEX "DirectConversation_participantBId_idx"
  ON "DirectConversation"("participantBId");

CREATE INDEX "DirectConversation_updatedAt_idx"
  ON "DirectConversation"("updatedAt");

CREATE INDEX "DirectMessage_conversationId_createdAt_idx"
  ON "DirectMessage"("conversationId", "createdAt");

CREATE INDEX "DirectMessage_senderId_idx"
  ON "DirectMessage"("senderId");

CREATE INDEX "DirectMessage_deletedAt_idx"
  ON "DirectMessage"("deletedAt");

ALTER TABLE "DirectConversation"
  ADD CONSTRAINT "DirectConversation_participantAId_fkey"
  FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DirectConversation"
  ADD CONSTRAINT "DirectConversation_participantBId_fkey"
  FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DirectMessage"
  ADD CONSTRAINT "DirectMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "DirectConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DirectMessage"
  ADD CONSTRAINT "DirectMessage_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
