-- DropIndex
DROP INDEX "profiles_email_key";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "priceDisplay" TEXT NOT NULL DEFAULT 'show';
