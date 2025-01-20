/*
  Warnings:

  - The primary key for the `Lover` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Lover` table. All the data in the column will be lost.
  - The primary key for the `Messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Messages` table. All the data in the column will be lost.
  - You are about to alter the column `sender` on the `Messages` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Result` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user1Id,user2Id]` on the table `Lover` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `loveTableId` to the `Lover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user1Id` to the `Lover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2Id` to the `Lover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageId` to the `Messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Lover` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `loveTableId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `user1Id` INTEGER NOT NULL,
    ADD COLUMN `user2Id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`loveTableId`);

-- AlterTable
ALTER TABLE `Messages` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `messageId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `userId` INTEGER NOT NULL,
    MODIFY `sender` ENUM('SOLO', 'COUPLE', 'AI', 'ME') NULL,
    ADD PRIMARY KEY (`messageId`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `status` ENUM('SOLO', 'COUPLE', 'AI', 'ME') NOT NULL DEFAULT 'SOLO',
    ADD COLUMN `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `image_url` VARCHAR(191) NULL,
    MODIFY `trust` INTEGER NULL,
    MODIFY `skinship` INTEGER NULL,
    MODIFY `admit` INTEGER NULL,
    MODIFY `present` INTEGER NULL,
    MODIFY `together_time` INTEGER NULL,
    MODIFY `feature` VARCHAR(191) NULL,
    MODIFY `toRemember` VARCHAR(191) NULL,
    MODIFY `location` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`user_id`);

-- DropTable
DROP TABLE `Result`;

-- CreateTable
CREATE TABLE `Message_Result` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_type` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `mood` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Lover_user1Id_user2Id_key` ON `Lover`(`user1Id`, `user2Id`);

-- AddForeignKey
ALTER TABLE `Lover` ADD CONSTRAINT `Lover_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lover` ADD CONSTRAINT `Lover_user2Id_fkey` FOREIGN KEY (`user2Id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Messages` ADD CONSTRAINT `Messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
