-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "aiUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modelUsed" TEXT;
