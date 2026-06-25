-- CreateEnum
CREATE TYPE "WorkflowCommand" AS ENUM ('architectural_intake', 'change_classify', 'investigate', 'ship');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('processing', 'complete', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "architectural_intakes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "command" "WorkflowCommand" NOT NULL,
    "raw_input" TEXT NOT NULL,
    "intent" TEXT,
    "brief_markdown" TEXT,
    "result_json" JSONB,
    "status" "IntakeStatus" NOT NULL DEFAULT 'complete',
    "accepted_item_ids" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "architectural_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "architectural_intakes_project_id_idx" ON "architectural_intakes"("project_id");

-- CreateIndex
CREATE INDEX "architectural_intakes_command_idx" ON "architectural_intakes"("command");

-- CreateIndex
CREATE INDEX "architectural_intakes_status_idx" ON "architectural_intakes"("status");

-- CreateIndex
CREATE INDEX "architectural_intakes_created_at_idx" ON "architectural_intakes"("created_at");

-- AddForeignKey
ALTER TABLE "architectural_intakes" ADD CONSTRAINT "architectural_intakes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
