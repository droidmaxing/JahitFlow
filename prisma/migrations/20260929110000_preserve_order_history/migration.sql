-- Backfill immutable order and audit snapshots without deleting application rows.
ALTER TABLE `Order`
    ADD COLUMN `customerName` VARCHAR(120) NULL,
    ADD COLUMN `customerPhone` VARCHAR(30) NULL,
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `customerAddress` TEXT NULL,
    ADD COLUMN `createdByName` VARCHAR(120) NULL;

UPDATE `Order` AS o
JOIN `Customer` AS c ON c.`id` = o.`customerId`
JOIN `User` AS u ON u.`id` = o.`createdById`
SET o.`customerName` = c.`name`,
    o.`customerPhone` = c.`phone`,
    o.`customerEmail` = c.`email`,
    o.`customerAddress` = c.`address`,
    o.`createdByName` = u.`name`;

ALTER TABLE `Order`
    MODIFY `customerName` VARCHAR(120) NOT NULL,
    MODIFY `customerPhone` VARCHAR(30) NOT NULL,
    MODIFY `createdByName` VARCHAR(120) NOT NULL;

ALTER TABLE `PaymentLog`
    ADD COLUMN `recordedByName` VARCHAR(120) NULL;

UPDATE `PaymentLog` AS p
JOIN `User` AS u ON u.`id` = p.`recordedById`
SET p.`recordedByName` = u.`name`;

ALTER TABLE `PaymentLog`
    MODIFY `recordedByName` VARCHAR(120) NOT NULL;

ALTER TABLE `StatusLog`
    ADD COLUMN `changedByName` VARCHAR(120) NULL;

UPDATE `StatusLog` AS s
JOIN `User` AS u ON u.`id` = s.`changedById`
SET s.`changedByName` = u.`name`;

ALTER TABLE `StatusLog`
    MODIFY `changedByName` VARCHAR(120) NOT NULL;

ALTER TABLE `Order` DROP FOREIGN KEY `Order_customerId_fkey`;
ALTER TABLE `Order` DROP FOREIGN KEY `Order_createdById_fkey`;
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_orderId_fkey`;
ALTER TABLE `OrderItemSize` DROP FOREIGN KEY `OrderItemSize_orderItemId_fkey`;
ALTER TABLE `PaymentLog` DROP FOREIGN KEY `PaymentLog_orderId_fkey`;
ALTER TABLE `PaymentLog` DROP FOREIGN KEY `PaymentLog_recordedById_fkey`;
ALTER TABLE `StatusLog` DROP FOREIGN KEY `StatusLog_orderId_fkey`;
ALTER TABLE `StatusLog` DROP FOREIGN KEY `StatusLog_changedById_fkey`;

ALTER TABLE `Order`
    ADD CONSTRAINT `Order_customerId_fkey`
        FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `Order_createdById_fkey`
        FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `OrderItem`
    ADD CONSTRAINT `OrderItem_orderId_fkey`
        FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `OrderItemSize`
    ADD CONSTRAINT `OrderItemSize_orderItemId_fkey`
        FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `PaymentLog`
    ADD CONSTRAINT `PaymentLog_orderId_fkey`
        FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `PaymentLog_recordedById_fkey`
        FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `StatusLog`
    ADD CONSTRAINT `StatusLog_orderId_fkey`
        FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `StatusLog_changedById_fkey`
        FOREIGN KEY (`changedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
