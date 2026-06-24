-- CreateTable
CREATE TABLE "ingest_keys" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'DevAnvil Ingest Key',
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "ingest_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingest_keys_key_hash_key" ON "ingest_keys"("key_hash");

-- CreateIndex
CREATE INDEX "ingest_keys_key_prefix_idx" ON "ingest_keys"("key_prefix");
