-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('active', 'merged', 'abandoned');

-- CreateTable
CREATE TABLE "dev_builds" (
    "id" TEXT NOT NULL,
    "dev_item_id" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "command_used" TEXT,
    "plan_doc_path" TEXT,
    "contract_report_path" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_builds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dev_builds_dev_item_id_idx" ON "dev_builds"("dev_item_id");

-- AddForeignKey
ALTER TABLE "dev_builds" ADD CONSTRAINT "dev_builds_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
