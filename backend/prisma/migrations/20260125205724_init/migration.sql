-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LANDLORD', 'TENANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING', 'SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('ROOM', 'APARTMENT', 'HOUSE', 'HOTEL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "wallet_address" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TENANT',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL,
    "area" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "images" TEXT[],
    "amenities" TEXT[],
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "landlord_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "monthly_rent" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL,
    "payment_day" INTEGER NOT NULL,
    "terms" TEXT NOT NULL,
    "contract_pdf" TEXT,
    "contract_hash" TEXT NOT NULL,
    "blockchain_tx_hash" TEXT,
    "landlord_signature" TEXT,
    "tenant_signature" TEXT,
    "signed_at" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "contract_hash" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "block_number" INTEGER,
    "gas_used" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "properties_owner_id_idx" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "properties_city_district_idx" ON "properties"("city", "district");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_hash_key" ON "contracts"("contract_hash");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_blockchain_tx_hash_key" ON "contracts"("blockchain_tx_hash");

-- CreateIndex
CREATE INDEX "contracts_property_id_idx" ON "contracts"("property_id");

-- CreateIndex
CREATE INDEX "contracts_landlord_id_idx" ON "contracts"("landlord_id");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_idx" ON "contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "contracts_contract_hash_idx" ON "contracts"("contract_hash");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_tx_hash_key" ON "blockchain_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_transactions_tx_hash_idx" ON "blockchain_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_transactions_contract_hash_idx" ON "blockchain_transactions"("contract_hash");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
