-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'ALL');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'ALL';
