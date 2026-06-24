-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('note', 'voice', 'text', 'link', 'manual');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('feature', 'bug', 'regression', 'decision', 'question', 'chore', 'opportunity');

-- CreateEnum
CREATE TYPE "DevItemStatus" AS ENUM ('captured', 'triaged', 'approved', 'in_build', 'shipped', 'duplicate', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('unset', 'low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('transcript', 'attachment', 'note', 'link');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "normalized_summary" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "status" "DevItemStatus" NOT NULL DEFAULT 'captured',
    "priority" "Priority" NOT NULL DEFAULT 'unset',
    "duplicate_of_id" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "suggested_branch_name" TEXT,
    "suggested_command" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_item_matches" (
    "id" TEXT NOT NULL,
    "dev_item_id" TEXT NOT NULL,
    "matched_item_id" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "match_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_item_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_artifacts" (
    "id" TEXT NOT NULL,
    "dev_item_id" TEXT NOT NULL,
    "artifact_type" "ArtifactType" NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_activity" (
    "id" TEXT NOT NULL,
    "dev_item_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "dev_items_project_id_idx" ON "dev_items"("project_id");

-- CreateIndex
CREATE INDEX "dev_items_status_idx" ON "dev_items"("status");

-- CreateIndex
CREATE INDEX "dev_items_item_type_idx" ON "dev_items"("item_type");

-- CreateIndex
CREATE INDEX "dev_items_priority_idx" ON "dev_items"("priority");

-- CreateIndex
CREATE INDEX "dev_items_created_at_idx" ON "dev_items"("created_at");

-- CreateIndex
CREATE INDEX "dev_item_matches_dev_item_id_idx" ON "dev_item_matches"("dev_item_id");

-- CreateIndex
CREATE INDEX "dev_item_matches_matched_item_id_idx" ON "dev_item_matches"("matched_item_id");

-- CreateIndex
CREATE INDEX "dev_artifacts_dev_item_id_idx" ON "dev_artifacts"("dev_item_id");

-- CreateIndex
CREATE INDEX "dev_activity_dev_item_id_idx" ON "dev_activity"("dev_item_id");

-- AddForeignKey
ALTER TABLE "dev_items" ADD CONSTRAINT "dev_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_items" ADD CONSTRAINT "dev_items_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "dev_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_item_matches" ADD CONSTRAINT "dev_item_matches_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_item_matches" ADD CONSTRAINT "dev_item_matches_matched_item_id_fkey" FOREIGN KEY ("matched_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_artifacts" ADD CONSTRAINT "dev_artifacts_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_activity" ADD CONSTRAINT "dev_activity_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
