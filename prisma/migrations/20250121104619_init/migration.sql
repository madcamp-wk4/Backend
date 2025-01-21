/*
  Warnings:

  - The primary key for the `Lover` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `loveTableId` on the `Lover` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `Messages` table. All the data in the column will be lost.
  - You are about to drop the column `toRemember` on the `User` table. All the data in the column will be lost.
  - The values [AI,ME] on the enum `LoverProfile_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `DateWithLover` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message_Result` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lover_id` to the `Lover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Lover` DROP FOREIGN KEY `Lover_user1Id_fkey`;

-- AlterTable
ALTER TABLE `Lover` DROP PRIMARY KEY,
    DROP COLUMN `loveTableId`,
    ADD COLUMN `accepted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lover_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `recievedAt` DATETIME(3) NULL,
    ADD PRIMARY KEY (`lover_id`);

-- AlterTable
ALTER TABLE `Messages` DROP COLUMN `sender`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `dateRecordId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `toRemember`,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `summarize` VARCHAR(191) NULL,
    MODIFY `status` ENUM('SOLO', 'COUPLE') NOT NULL DEFAULT 'SOLO';

-- DropTable
DROP TABLE `DateWithLover`;

-- DropTable
DROP TABLE `Message_Result`;

-- CreateTable
CREATE TABLE `DateRecords` (
    `recordId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `summarize` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `activity` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`recordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageAnalysis` (
    `analysisId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `messageId` INTEGER NOT NULL,
    `category` ENUM('LOCATION', 'ACTIVITY', 'EMOTION_ME', 'EMOTION_YOU', 'UPDATE', 'NOTHING') NOT NULL,
    `extractedData` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`analysisId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NextQuestions` (
    `questionId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `category` ENUM('LOCATION', 'ACTIVITY', 'EMOTION_ME', 'EMOTION_YOU', 'UPDATE', 'NOTHING') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`questionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DateAnalysisRequest` (
    `requestId` INTEGER NOT NULL AUTO_INCREMENT,
    `recordId` INTEGER NOT NULL,
    `message_total` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`requestId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DateAnalysisResult` (
    `resultId` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `mainCategory1` VARCHAR(191) NOT NULL,
    `mainCategory2` VARCHAR(191) NOT NULL,
    `subCategory1` VARCHAR(191) NOT NULL,
    `subCategory2` VARCHAR(191) NOT NULL,
    `aiScore` DOUBLE NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`resultId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoverAnalysisRequest` (
    `requestId` INTEGER NOT NULL AUTO_INCREMENT,
    `recordId` INTEGER NOT NULL,
    `messageTotal` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`requestId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoverProfile` (
    `loverProfileId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('SOLO', 'COUPLE') NOT NULL DEFAULT 'SOLO',
    `trust` INTEGER NULL,
    `skinship` INTEGER NULL,
    `admit` INTEGER NULL,
    `present` INTEGER NULL,
    `togetherTime` INTEGER NULL,
    `feature` VARCHAR(191) NULL,
    `memorize` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `lastAnalyzedRecordId` INTEGER NULL,
    `lastAnalyzedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`loverProfileId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lover` ADD CONSTRAINT `Lover_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DateRecords` ADD CONSTRAINT `DateRecords_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Messages` ADD CONSTRAINT `Messages_dateRecordId_fkey` FOREIGN KEY (`dateRecordId`) REFERENCES `DateRecords`(`recordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageAnalysis` ADD CONSTRAINT `MessageAnalysis_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageAnalysis` ADD CONSTRAINT `MessageAnalysis_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Messages`(`messageId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NextQuestions` ADD CONSTRAINT `NextQuestions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DateAnalysisRequest` ADD CONSTRAINT `DateAnalysisRequest_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `DateRecords`(`recordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DateAnalysisResult` ADD CONSTRAINT `DateAnalysisResult_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `DateAnalysisRequest`(`requestId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoverAnalysisRequest` ADD CONSTRAINT `LoverAnalysisRequest_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `DateRecords`(`recordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoverProfile` ADD CONSTRAINT `LoverProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
