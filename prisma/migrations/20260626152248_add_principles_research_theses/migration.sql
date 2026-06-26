-- CreateEnum
CREATE TYPE "ResearchQuestionStatus" AS ENUM ('open', 'converging', 'answered', 'archived');

-- CreateEnum
CREATE TYPE "ThesisStatus" AS ENUM ('competing', 'leading', 'weakened', 'disproven', 'archived');

-- CreateEnum
CREATE TYPE "EvidenceSource" AS ENUM ('product_analytics', 'user_interview', 'artist_feedback', 'founder_observation', 'conference_notes', 'customer_conversation', 'research', 'experiment');

-- CreateEnum
CREATE TYPE "EvidenceEffect" AS ENUM ('supports', 'weakens', 'neutral');

-- CreateEnum
CREATE TYPE "ResearchNoteKind" AS ENUM ('article', 'book', 'paper', 'podcast', 'conference', 'interview', 'competitor', 'founder_observation', 'other');

-- AlterTable
ALTER TABLE "initiatives" ADD COLUMN     "thesis_id" TEXT;

-- CreateTable
CREATE TABLE "principles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "origin_story" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "principles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_questions" (
    "id" TEXT NOT NULL,
    "principle_id" TEXT,
    "question" TEXT NOT NULL,
    "why_it_matters" TEXT,
    "current_understanding" TEXT,
    "unknowns" JSONB NOT NULL DEFAULT '[]',
    "status" "ResearchQuestionStatus" NOT NULL DEFAULT 'open',
    "next_experiment" TEXT,
    "brainstorm_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theses" (
    "id" TEXT NOT NULL,
    "research_question_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "status" "ThesisStatus" NOT NULL DEFAULT 'competing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" "EvidenceSource" NOT NULL,
    "effect" "EvidenceEffect" NOT NULL DEFAULT 'supports',
    "strength" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_notes" (
    "id" TEXT NOT NULL,
    "research_question_id" TEXT NOT NULL,
    "kind" "ResearchNoteKind" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "excerpt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confidence_snapshots" (
    "id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confidence_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_reviews" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "summary_json" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thesis_principles" (
    "id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "principle_id" TEXT NOT NULL,

    CONSTRAINT "thesis_principles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_principles" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "principle_id" TEXT NOT NULL,

    CONSTRAINT "project_principles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_theses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,

    CONSTRAINT "project_theses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "principles_slug_key" ON "principles"("slug");

-- CreateIndex
CREATE INDEX "research_questions_principle_id_idx" ON "research_questions"("principle_id");

-- CreateIndex
CREATE INDEX "research_questions_status_idx" ON "research_questions"("status");

-- CreateIndex
CREATE INDEX "theses_research_question_id_idx" ON "theses"("research_question_id");

-- CreateIndex
CREATE INDEX "theses_status_idx" ON "theses"("status");

-- CreateIndex
CREATE INDEX "evidence_thesis_id_idx" ON "evidence"("thesis_id");

-- CreateIndex
CREATE INDEX "research_notes_research_question_id_idx" ON "research_notes"("research_question_id");

-- CreateIndex
CREATE INDEX "confidence_snapshots_thesis_id_idx" ON "confidence_snapshots"("thesis_id");

-- CreateIndex
CREATE INDEX "executive_reviews_project_id_idx" ON "executive_reviews"("project_id");

-- CreateIndex
CREATE INDEX "executive_reviews_period_end_idx" ON "executive_reviews"("period_end");

-- CreateIndex
CREATE UNIQUE INDEX "thesis_principles_thesis_id_principle_id_key" ON "thesis_principles"("thesis_id", "principle_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_principles_project_id_principle_id_key" ON "project_principles"("project_id", "principle_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_theses_project_id_thesis_id_key" ON "project_theses"("project_id", "thesis_id");

-- CreateIndex
CREATE INDEX "initiatives_thesis_id_idx" ON "initiatives"("thesis_id");

-- AddForeignKey
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_questions" ADD CONSTRAINT "research_questions_principle_id_fkey" FOREIGN KEY ("principle_id") REFERENCES "principles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_research_question_id_fkey" FOREIGN KEY ("research_question_id") REFERENCES "research_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_research_question_id_fkey" FOREIGN KEY ("research_question_id") REFERENCES "research_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confidence_snapshots" ADD CONSTRAINT "confidence_snapshots_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_reviews" ADD CONSTRAINT "executive_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_principles" ADD CONSTRAINT "thesis_principles_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_principles" ADD CONSTRAINT "thesis_principles_principle_id_fkey" FOREIGN KEY ("principle_id") REFERENCES "principles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_principles" ADD CONSTRAINT "project_principles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_principles" ADD CONSTRAINT "project_principles_principle_id_fkey" FOREIGN KEY ("principle_id") REFERENCES "principles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_theses" ADD CONSTRAINT "project_theses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_theses" ADD CONSTRAINT "project_theses_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
