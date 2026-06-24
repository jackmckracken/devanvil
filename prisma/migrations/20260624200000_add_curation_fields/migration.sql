-- CreateEnum
CREATE TYPE "CurationState" AS ENUM ('unreviewed', 'keep', 'archive_junk', 'duplicate', 'merge_candidate', 'canonical');

-- AlterTable
ALTER TABLE "dev_items" ADD COLUMN "curation_state" "CurationState" NOT NULL DEFAULT 'unreviewed';
ALTER TABLE "dev_items" ADD COLUMN "canonical_item_id" TEXT;
ALTER TABLE "dev_items" ADD COLUMN "curation_reason" TEXT;
ALTER TABLE "dev_items" ADD COLUMN "quality_score" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "dev_items_curation_state_idx" ON "dev_items"("curation_state");

-- AddForeignKey
ALTER TABLE "dev_items" ADD CONSTRAINT "dev_items_canonical_item_id_fkey" FOREIGN KEY ("canonical_item_id") REFERENCES "dev_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
