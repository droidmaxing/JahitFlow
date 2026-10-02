-- Add booking status access tokens and reserve each service slot atomically.
ALTER TABLE `AccessToken`
    ADD COLUMN `bookingId` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `AccessToken_bookingId_key`(`bookingId`);

CREATE TABLE `BookingSlot` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BookingSlot_bookingId_key`(`bookingId`),
    UNIQUE INDEX `BookingSlot_branchId_serviceId_startsAt_key`(`branchId`, `serviceId`, `startsAt`),
    INDEX `BookingSlot_branchId_startsAt_bookingId_idx`(`branchId`, `startsAt`, `bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AccessToken`
    ADD CONSTRAINT `AccessToken_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BookingSlot`
    ADD CONSTRAINT `BookingSlot_branchId_fkey`
    FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `BookingSlot_serviceId_fkey`
    FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `BookingSlot_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
