/*
  Warnings:

  - A unique constraint covering the columns `[segment,slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Segment" AS ENUM ('HARDWARE', 'GROCERY', 'PHARMACY');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categorySlug_fkey";

-- DropIndex
DROP INDEX "Category_slug_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "segment" "Segment" NOT NULL DEFAULT 'HARDWARE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "activeIngredient" TEXT,
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "costPrice" INTEGER,
ADD COLUMN     "dosageStrength" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "formulation" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "manufacturingDate" TIMESTAMP(3),
ADD COLUMN     "prescriptionRequired" BOOLEAN DEFAULT false,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "segment" "Segment" NOT NULL DEFAULT 'HARDWARE',
ADD COLUMN     "storageConditions" TEXT,
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "wholesalePrice" INTEGER;

-- CreateIndex
CREATE INDEX "Category_segment_idx" ON "Category"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "Category_segment_slug_key" ON "Category"("segment", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_segment_idx" ON "Product"("segment");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_segment_categorySlug_fkey" FOREIGN KEY ("segment", "categorySlug") REFERENCES "Category"("segment", "slug") ON DELETE RESTRICT ON UPDATE CASCADE;
