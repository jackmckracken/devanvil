-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('proposed', 'active', 'next', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "InitiativePriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "StrategicValue" AS ENUM ('beta_critical', 'launch_critical', 'growth', 'delight', 'infrastructure', 'research', 'future_vision');

-- CreateTable
CREATE TABLE "initiatives" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "InitiativeStatus" NOT NULL DEFAULT 'proposed',
    "priority" "InitiativePriority" NOT NULL DEFAULT 'medium',
    "strategic_value" "StrategicValue" NOT NULL DEFAULT 'infrastructure',
    "target_release" TEXT,
    "score_override" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "initiatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiative_items" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "dev_item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "initiative_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "initiatives_project_id_idx" ON "initiatives"("project_id");

-- CreateIndex
CREATE INDEX "initiatives_status_idx" ON "initiatives"("status");

-- CreateIndex
CREATE INDEX "initiatives_priority_idx" ON "initiatives"("priority");

-- CreateIndex
CREATE INDEX "initiatives_strategic_value_idx" ON "initiatives"("strategic_value");

-- CreateIndex
CREATE INDEX "initiative_items_initiative_id_idx" ON "initiative_items"("initiative_id");

-- CreateIndex
CREATE INDEX "initiative_items_dev_item_id_idx" ON "initiative_items"("dev_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "initiative_items_initiative_id_dev_item_id_key" ON "initiative_items"("initiative_id", "dev_item_id");

-- AddForeignKey
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
