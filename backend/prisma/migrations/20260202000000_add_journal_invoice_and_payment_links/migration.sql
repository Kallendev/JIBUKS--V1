-- AlterTable
ALTER TABLE "journals" ADD COLUMN "invoice_id" INTEGER,
ADD COLUMN "invoice_payment_id" INTEGER;

-- CreateIndex
CREATE INDEX "journals_invoice_id_idx" ON "journals"("invoice_id");

-- CreateIndex
CREATE INDEX "journals_invoice_payment_id_idx" ON "journals"("invoice_payment_id");

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_invoice_payment_id_fkey" FOREIGN KEY ("invoice_payment_id") REFERENCES "invoice_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
