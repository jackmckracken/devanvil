-- CreateEnum
CREATE TYPE "CapturePromotion" AS ENUM ('architect', 'bug', 'audit', 'research');

-- AlterEnum
ALTER TYPE "WorkflowCommand" ADD VALUE 'capture';

-- AlterTable
ALTER TABLE "architect_sessions" ADD COLUMN     "capture_id" TEXT;

-- AlterTable
ALTER TABLE "dev_items" ADD COLUMN     "is_capture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoted_to" "CapturePromotion";

-- CreateIndex
CREATE INDEX "architect_sessions_capture_id_idx" ON "architect_sessions"("capture_id");

-- CreateIndex
CREATE INDEX "dev_items_is_capture_idx" ON "dev_items"("is_capture");

-- AddForeignKey
ALTER TABLE "architect_sessions" ADD CONSTRAINT "architect_sessions_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "dev_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
