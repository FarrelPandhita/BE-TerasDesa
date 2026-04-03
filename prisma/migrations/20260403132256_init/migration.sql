-- AlterTable
ALTER TABLE `project_timeline` MODIFY `status` ENUM('belum', 'diproses', 'selesai') NOT NULL DEFAULT 'belum';

-- AlterTable
ALTER TABLE `projects` ADD COLUMN `rw` VARCHAR(10) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `profile_picture_url` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `project_images` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_images` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_images` ADD CONSTRAINT `report_images_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
