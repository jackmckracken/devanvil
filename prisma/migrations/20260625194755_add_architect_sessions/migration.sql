-- CreateEnum
CREATE TYPE "ArchitectSessionStatus" AS ENUM ('active', 'initiative_created', 'discarded', 'archived');

-- CreateTable
CREATE TABLE "architect_sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "ArchitectSessionStatus" NOT NULL DEFAULT 'active',
    "original_input" TEXT NOT NULL,
    "analysis_json" JSONB,
    "messages_json" JSONB NOT NULL DEFAULT '[]',
    "initiative_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "architect_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "architect_sessions_initiative_id_key" ON "architect_sessions"("initiative_id");

-- CreateIndex
CREATE INDEX "architect_sessions_project_id_idx" ON "architect_sessions"("project_id");

-- CreateIndex
CREATE INDEX "architect_sessions_status_idx" ON "architect_sessions"("status");

-- CreateIndex
CREATE INDEX "architect_sessions_created_at_idx" ON "architect_sessions"("created_at");

-- AddForeignKey
ALTER TABLE "architect_sessions" ADD CONSTRAINT "architect_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "architect_sessions" ADD CONSTRAINT "architect_sessions_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
