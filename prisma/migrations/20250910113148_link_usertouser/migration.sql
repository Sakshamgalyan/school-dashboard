/*
  Warnings:

  - You are about to drop the column `username` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Student` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Parent_username_key";

-- DropIndex
DROP INDEX "Student_username_key";

-- AlterTable
ALTER TABLE "Parent" DROP COLUMN "username";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "username";

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
