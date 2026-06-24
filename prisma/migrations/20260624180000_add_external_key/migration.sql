-- AlterTable
ALTER TABLE "dev_items" ADD COLUMN "external_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "dev_items_external_key_key" ON "dev_items"("external_key");
