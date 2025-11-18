-- CreateTable
CREATE TABLE "PendingConsumption" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "metricType" TEXT,
    "metricValue" DECIMAL(10,2),
    "description" TEXT,
    "conversationId" TEXT,
    "batchId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchProcessingConfig" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxAmount" DECIMAL(10,2) NOT NULL,
    "maxTransactions" INTEGER NOT NULL,
    "maxTimeSeconds" INTEGER NOT NULL,
    "lastProcessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchProcessingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingConsumption_walletId_idx" ON "PendingConsumption"("walletId");

-- CreateIndex
CREATE INDEX "PendingConsumption_processed_idx" ON "PendingConsumption"("processed");

-- CreateIndex
CREATE INDEX "PendingConsumption_batchId_idx" ON "PendingConsumption"("batchId");

-- CreateIndex
CREATE INDEX "PendingConsumption_createdAt_idx" ON "PendingConsumption"("createdAt");

-- CreateIndex
CREATE INDEX "PendingConsumption_walletId_processed_idx" ON "PendingConsumption"("walletId", "processed");

-- CreateIndex
CREATE UNIQUE INDEX "BatchProcessingConfig_walletId_key" ON "BatchProcessingConfig"("walletId");

-- CreateIndex
CREATE INDEX "BatchProcessingConfig_walletId_idx" ON "BatchProcessingConfig"("walletId");

-- CreateIndex
CREATE INDEX "BatchProcessingConfig_enabled_idx" ON "BatchProcessingConfig"("enabled");

-- AddForeignKey
ALTER TABLE "PendingConsumption" ADD CONSTRAINT "PendingConsumption_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchProcessingConfig" ADD CONSTRAINT "BatchProcessingConfig_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;



