/*
  Warnings:

  - You are about to drop the column `accumulated_depreciation` on the `fixed_assets` table. All the data in the column will be lost.
  - You are about to drop the column `asset_number` on the `fixed_assets` table. All the data in the column will be lost.
  - You are about to drop the column `depreciation_account_id` on the `fixed_assets` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `fixed_assets` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `fixed_assets` table. All the data in the column will be lost.
  - You are about to drop the column `useful_life` on the `fixed_assets` table. All the data in the column will be lost.
  - The `depreciation_method` column on the `fixed_assets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `depreciation_entries` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `fixed_assets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DISPOSED', 'SOLD', 'WRITTEN_OFF');

-- DropForeignKey
ALTER TABLE "depreciation_entries" DROP CONSTRAINT "depreciation_entries_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "depreciation_entries" DROP CONSTRAINT "depreciation_entries_journal_id_fkey";

-- AlterTable
ALTER TABLE "fixed_assets" DROP COLUMN "accumulated_depreciation",
DROP COLUMN "asset_number",
DROP COLUMN "depreciation_account_id",
DROP COLUMN "description",
DROP COLUMN "is_active",
DROP COLUMN "useful_life",
ADD COLUMN     "accum_dep_account_id" INTEGER,
ADD COLUMN     "cash_portion" DECIMAL(65,30),
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "created_by_id" INTEGER,
ADD COLUMN     "depreciation_exp_acc_id" INTEGER,
ADD COLUMN     "disposal_account_id" INTEGER,
ADD COLUMN     "disposal_date" TIMESTAMP(3),
ADD COLUMN     "disposal_price" DECIMAL(65,30),
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "family_owner_id" INTEGER,
ADD COLUMN     "finance_account_id" INTEGER,
ADD COLUMN     "finance_portion" DECIMAL(65,30),
ADD COLUMN     "is_depreciating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lifespan_years" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paid_from_account_id" INTEGER,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "purchase_journal_id" INTEGER,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "total_depreciation" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "track_warranty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendor" TEXT,
ADD COLUMN     "warranty_expiry" TIMESTAMP(3),
ADD COLUMN     "warranty_notified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "salvage_value" DROP NOT NULL,
ALTER COLUMN "salvage_value" DROP DEFAULT,
DROP COLUMN "depreciation_method",
ADD COLUMN     "depreciation_method" TEXT;

-- DropTable
DROP TABLE "depreciation_entries";

-- DropEnum
DROP TYPE "DepreciationMethod";

-- CreateTable
CREATE TABLE "asset_depreciations" (
    "id" SERIAL NOT NULL,
    "fixed_asset_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_value" DECIMAL(65,30) NOT NULL,
    "new_value" DECIMAL(65,30) NOT NULL,
    "depreciation_amount" DECIMAL(65,30) NOT NULL,
    "journal_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_depreciations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_depreciations_fixed_asset_id_idx" ON "asset_depreciations"("fixed_asset_id");

-- CreateIndex
CREATE INDEX "fixed_assets_asset_account_id_idx" ON "fixed_assets"("asset_account_id");

-- CreateIndex
CREATE INDEX "fixed_assets_status_idx" ON "fixed_assets"("status");

-- CreateIndex
CREATE INDEX "fixed_assets_purchase_date_idx" ON "fixed_assets"("purchase_date");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_asset_account_id_fkey" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_paid_from_account_id_fkey" FOREIGN KEY ("paid_from_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_finance_account_id_fkey" FOREIGN KEY ("finance_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_accum_dep_account_id_fkey" FOREIGN KEY ("accum_dep_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_depreciation_exp_acc_id_fkey" FOREIGN KEY ("depreciation_exp_acc_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_disposal_account_id_fkey" FOREIGN KEY ("disposal_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_family_owner_id_fkey" FOREIGN KEY ("family_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_fixed_asset_id_fkey" FOREIGN KEY ("fixed_asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
