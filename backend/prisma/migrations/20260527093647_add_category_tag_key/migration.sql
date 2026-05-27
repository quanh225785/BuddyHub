/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `ActivityCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `InterestTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `ActivityCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `InterestTag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivityCategory" ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InterestTag" ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_key_key" ON "ActivityCategory"("key");

-- CreateIndex
CREATE UNIQUE INDEX "InterestTag_key_key" ON "InterestTag"("key");
