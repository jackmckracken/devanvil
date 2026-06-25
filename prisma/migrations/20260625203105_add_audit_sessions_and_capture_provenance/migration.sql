-- CreateEnum
CREATE TYPE "AuditSessionStatus" AS ENUM ('active', 'polish_initiative_created', 'discarded', 'archived');

-- AlterTable
ALTER TABLE "dev_items" ADD COLUMN     "source_capture_id" TEXT;

-- CreateTable
CREATE TABLE "audit_sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "capture_id" TEXT NOT NULL,
    "status" "AuditSessionStatus" NOT NULL DEFAULT 'active',
    "original_input" TEXT NOT NULL,
    "scope_json" JSONB,
    "initiative_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_sessions_initiative_id_key" ON "audit_sessions"("initiative_id");

-- CreateIndex
CREATE INDEX "audit_sessions_project_id_idx" ON "audit_sessions"("project_id");

-- CreateIndex
CREATE INDEX "audit_sessions_capture_id_idx" ON "audit_sessions"("capture_id");

-- CreateIndex
CREATE INDEX "audit_sessions_status_idx" ON "audit_sessions"("status");

-- CreateIndex
CREATE INDEX "audit_sessions_created_at_idx" ON "audit_sessions"("created_at");

-- CreateIndex
CREATE INDEX "dev_items_source_capture_id_idx" ON "dev_items"("source_capture_id");

-- AddForeignKey
ALTER TABLE "audit_sessions" ADD CONSTRAINT "audit_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_sessions" ADD CONSTRAINT "audit_sessions_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_sessions" ADD CONSTRAINT "audit_sessions_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_items" ADD CONSTRAINT "dev_items_source_capture_id_fkey" FOREIGN KEY ("source_capture_id") REFERENCES "dev_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
