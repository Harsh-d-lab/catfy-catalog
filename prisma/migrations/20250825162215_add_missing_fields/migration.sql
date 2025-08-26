-- AlterTable
ALTER TABLE "catalogues" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "exportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "trialEnd" TIMESTAMP(3);
