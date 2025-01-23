/*
  Warnings:

  - Made the column `aiScore` on table `DateAnalysisResult` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `DateAnalysisResult` MODIFY `aiScore` VARCHAR(191) NOT NULL;
