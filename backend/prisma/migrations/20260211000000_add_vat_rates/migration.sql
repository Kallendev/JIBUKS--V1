-- CreateTable
CREATE TABLE "vat_rates" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vat_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vat_rates_tenant_id_idx" ON "vat_rates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vat_rates_tenant_id_code_key" ON "vat_rates"("tenant_id", "code");

-- AddForeignKey
ALTER TABLE "vat_rates" ADD CONSTRAINT "vat_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
