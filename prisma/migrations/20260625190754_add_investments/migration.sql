-- CreateEnum
CREATE TYPE "InvestmentCategory" AS ENUM ('learning', 'experimentation', 'environment', 'infrastructure', 'relationships', 'business', 'health');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('captured', 'scheduled', 'in_progress', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "InvestmentLeverage" AS ENUM ('low', 'medium', 'high', 'compound');

-- AlterEnum
ALTER TYPE "WorkflowCommand" ADD VALUE 'investment';

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "raw_input" TEXT,
    "category" "InvestmentCategory" NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'captured',
    "capability_target" TEXT,
    "intent_connection" TEXT,
    "leverage" "InvestmentLeverage" NOT NULL DEFAULT 'medium',
    "estimated_hours" DOUBLE PRECISION,
    "compounding_value" TEXT,
    "reflection" TEXT,
    "capability_added" TEXT,
    "scheduled_for" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "intake_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiative_investments" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "initiative_investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_work_items" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "dev_item_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'enables',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investments_project_id_idx" ON "investments"("project_id");

-- CreateIndex
CREATE INDEX "investments_category_idx" ON "investments"("category");

-- CreateIndex
CREATE INDEX "investments_status_idx" ON "investments"("status");

-- CreateIndex
CREATE INDEX "investments_created_at_idx" ON "investments"("created_at");

-- CreateIndex
CREATE INDEX "initiative_investments_initiative_id_idx" ON "initiative_investments"("initiative_id");

-- CreateIndex
CREATE INDEX "initiative_investments_investment_id_idx" ON "initiative_investments"("investment_id");

-- CreateIndex
CREATE UNIQUE INDEX "initiative_investments_initiative_id_investment_id_key" ON "initiative_investments"("initiative_id", "investment_id");

-- CreateIndex
CREATE INDEX "investment_work_items_investment_id_idx" ON "investment_work_items"("investment_id");

-- CreateIndex
CREATE INDEX "investment_work_items_dev_item_id_idx" ON "investment_work_items"("dev_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "investment_work_items_investment_id_dev_item_id_key" ON "investment_work_items"("investment_id", "dev_item_id");

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_investments" ADD CONSTRAINT "initiative_investments_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_investments" ADD CONSTRAINT "initiative_investments_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_work_items" ADD CONSTRAINT "investment_work_items_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_work_items" ADD CONSTRAINT "investment_work_items_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
