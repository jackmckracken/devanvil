-- CreateEnum
CREATE TYPE "ProtectionLevel" AS ENUM ('advisory', 'guarded', 'protected', 'locked');

-- CreateEnum
CREATE TYPE "ProtectedDomainStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "DomainArtifactKind" AS ENUM ('adr', 'runtime_contract', 'visual_contract', 'catalog', 'golden_master', 'runtime_inventory', 'test_suite', 'regression_log', 'decision_record');

-- CreateEnum
CREATE TYPE "ExtensionPointCategory" AS ENUM ('allowed', 'requires_adr');

-- CreateEnum
CREATE TYPE "DomainChangeStatus" AS ENUM ('open', 'in_review', 'merged', 'blocked');

-- CreateEnum
CREATE TYPE "DomainViolationSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "RegressionStatus" AS ENUM ('passing', 'failing', 'unknown', 'not_run');

-- CreateTable
CREATE TABLE "protected_domains" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT NOT NULL,
    "status" "ProtectedDomainStatus" NOT NULL DEFAULT 'active',
    "protection_level" "ProtectionLevel" NOT NULL DEFAULT 'advisory',
    "project_id" TEXT,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "path_patterns" JSONB NOT NULL DEFAULT '[]',
    "last_audit_at" TIMESTAMP(3),
    "last_golden_master_at" TIMESTAMP(3),
    "contract_version" TEXT,
    "inventory_version" TEXT,
    "regression_status" "RegressionStatus" NOT NULL DEFAULT 'unknown',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protected_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_domain_artifacts" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "kind" "DomainArtifactKind" NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT,
    "version" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protected_domain_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_domain_change_gates" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "protected_domain_change_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_domain_extension_points" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExtensionPointCategory" NOT NULL,

    CONSTRAINT "protected_domain_extension_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_domain_changes" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "dev_item_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "risk" TEXT,
    "status" "DomainChangeStatus" NOT NULL DEFAULT 'open',
    "gates_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protected_domain_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_domain_violations" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DomainViolationSeverity" NOT NULL DEFAULT 'medium',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protected_domain_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_domain_audits" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "auditor" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protected_domain_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "protected_domains_slug_key" ON "protected_domains"("slug");

-- CreateIndex
CREATE INDEX "protected_domains_project_id_idx" ON "protected_domains"("project_id");

-- CreateIndex
CREATE INDEX "protected_domains_protection_level_idx" ON "protected_domains"("protection_level");

-- CreateIndex
CREATE INDEX "protected_domains_status_idx" ON "protected_domains"("status");

-- CreateIndex
CREATE INDEX "protected_domain_artifacts_domain_id_idx" ON "protected_domain_artifacts"("domain_id");

-- CreateIndex
CREATE INDEX "protected_domain_artifacts_kind_idx" ON "protected_domain_artifacts"("kind");

-- CreateIndex
CREATE INDEX "protected_domain_change_gates_domain_id_idx" ON "protected_domain_change_gates"("domain_id");

-- CreateIndex
CREATE INDEX "protected_domain_extension_points_domain_id_idx" ON "protected_domain_extension_points"("domain_id");

-- CreateIndex
CREATE INDEX "protected_domain_changes_domain_id_idx" ON "protected_domain_changes"("domain_id");

-- CreateIndex
CREATE INDEX "protected_domain_changes_dev_item_id_idx" ON "protected_domain_changes"("dev_item_id");

-- CreateIndex
CREATE INDEX "protected_domain_changes_status_idx" ON "protected_domain_changes"("status");

-- CreateIndex
CREATE INDEX "protected_domain_violations_domain_id_idx" ON "protected_domain_violations"("domain_id");

-- CreateIndex
CREATE INDEX "protected_domain_audits_domain_id_idx" ON "protected_domain_audits"("domain_id");

-- AddForeignKey
ALTER TABLE "protected_domains" ADD CONSTRAINT "protected_domains_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_artifacts" ADD CONSTRAINT "protected_domain_artifacts_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "protected_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_change_gates" ADD CONSTRAINT "protected_domain_change_gates_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "protected_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_extension_points" ADD CONSTRAINT "protected_domain_extension_points_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "protected_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_changes" ADD CONSTRAINT "protected_domain_changes_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "protected_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_changes" ADD CONSTRAINT "protected_domain_changes_dev_item_id_fkey" FOREIGN KEY ("dev_item_id") REFERENCES "dev_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_violations" ADD CONSTRAINT "protected_domain_violations_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "protected_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_domain_audits" ADD CONSTRAINT "protected_domain_audits_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "protected_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
