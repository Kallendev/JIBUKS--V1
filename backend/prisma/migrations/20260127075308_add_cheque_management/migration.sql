-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('PENDING', 'CLEARED', 'BOUNCED', 'VOIDED');

-- CreateTable
CREATE TABLE "cheques" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "cheque_number" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "bank_account_id" INTEGER NOT NULL,
    "account_number" TEXT,
    "purpose" TEXT NOT NULL,
    "status" "ChequeStatus" NOT NULL DEFAULT 'PENDING',
    "date_cleared" TIMESTAMP(3),
    "cleared_by_id" INTEGER,
    "write_journal_id" INTEGER,
    "clear_journal_id" INTEGER,
    "notes" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cheques_tenant_id_idx" ON "cheques"("tenant_id");

-- CreateIndex
CREATE INDEX "cheques_status_idx" ON "cheques"("status");

-- CreateIndex
CREATE INDEX "cheques_due_date_idx" ON "cheques"("due_date");

-- CreateIndex
CREATE INDEX "cheques_bank_account_id_idx" ON "cheques"("bank_account_id");

-- AddForeignKey
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
