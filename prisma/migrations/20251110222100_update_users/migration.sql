-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LOCATION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'LOCATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ghlLocationId" TEXT,
    "ghlCompanyId" TEXT,
    "ghlLocationName" TEXT,
    "ghlLocationAddress" TEXT,
    "ghlLocationCity" TEXT,
    "ghlLocationState" TEXT,
    "ghlLocationPhone" TEXT,
    "ghlLocationEmail" TEXT,
    "ghlLocationWebsite" TEXT,
    "ghlLocationTimezone" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "prompt" TEXT,
    "llmId" TEXT DEFAULT 'gpt-4o',
    "llmType" TEXT NOT NULL DEFAULT 'custom-llm',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retellAgentId" TEXT,
    "enableBackchannel" BOOLEAN NOT NULL DEFAULT true,
    "responsiveness" DOUBLE PRECISION DEFAULT 0.7,
    "maxCallTime" INTEGER,
    "silenceTimeout" INTEGER,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voicemailDetection" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberPretty" TEXT,
    "phoneNumberType" TEXT NOT NULL DEFAULT 'retell-twilio',
    "nickname" TEXT,
    "areaCode" INTEGER,
    "inboundAgentId" TEXT,
    "outboundAgentId" TEXT,
    "inboundAgentVersion" INTEGER,
    "outboundAgentVersion" INTEGER,
    "inboundWebhookUrl" TEXT,
    "outboundWebhookUrl" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "gender" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTag" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "contactId" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_ghlLocationId_key" ON "User"("ghlLocationId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_ghlLocationId_idx" ON "User"("ghlLocationId");

-- CreateIndex
CREATE INDEX "User_ghlCompanyId_idx" ON "User"("ghlCompanyId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_retellAgentId_key" ON "Agent"("retellAgentId");

-- CreateIndex
CREATE INDEX "Agent_retellAgentId_idx" ON "Agent"("retellAgentId");

-- CreateIndex
CREATE INDEX "Agent_userId_idx" ON "Agent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_phoneNumber_key" ON "PhoneNumber"("phoneNumber");

-- CreateIndex
CREATE INDEX "PhoneNumber_phoneNumber_idx" ON "PhoneNumber"("phoneNumber");

-- CreateIndex
CREATE INDEX "PhoneNumber_inboundAgentId_idx" ON "PhoneNumber"("inboundAgentId");

-- CreateIndex
CREATE INDEX "PhoneNumber_outboundAgentId_idx" ON "PhoneNumber"("outboundAgentId");

-- CreateIndex
CREATE INDEX "PhoneNumber_userId_idx" ON "PhoneNumber"("userId");

-- CreateIndex
CREATE INDEX "Voice_language_idx" ON "Voice"("language");

-- CreateIndex
CREATE INDEX "Voice_isActive_idx" ON "Voice"("isActive");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "AgentTag_agentId_idx" ON "AgentTag"("agentId");

-- CreateIndex
CREATE INDEX "AgentTag_tagId_idx" ON "AgentTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTag_agentId_tagId_key" ON "AgentTag"("agentId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_conversationId_key" ON "Conversation"("conversationId");

-- CreateIndex
CREATE INDEX "Conversation_conversationId_idx" ON "Conversation"("conversationId");

-- CreateIndex
CREATE INDEX "Conversation_agentId_idx" ON "Conversation"("agentId");

-- CreateIndex
CREATE INDEX "Conversation_contactId_idx" ON "Conversation"("contactId");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_inboundAgentId_fkey" FOREIGN KEY ("inboundAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_outboundAgentId_fkey" FOREIGN KEY ("outboundAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTag" ADD CONSTRAINT "AgentTag_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTag" ADD CONSTRAINT "AgentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
