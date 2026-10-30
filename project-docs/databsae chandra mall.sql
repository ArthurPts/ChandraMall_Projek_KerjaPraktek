-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema chandra_mall
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema chandra_mall
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `chandra_mall` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `chandra_mall` ;

-- -----------------------------------------------------
-- Table `chandra_mall`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`categories` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` INT(10) UNSIGNED NULL DEFAULT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(110) NOT NULL,
  `icon` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_categories_slug` (`slug` ASC),
  INDEX `fk_categories_parent` (`parent_id` ASC),
  CONSTRAINT `fk_categories_parent`
    FOREIGN KEY (`parent_id`)
    REFERENCES `chandra_mall`.`categories` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`users` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('buyer', 'vendor', 'hk_store', 'admin') NOT NULL DEFAULT 'buyer',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_users_email` (`email` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`vendors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`vendors` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) UNSIGNED NOT NULL,
  `store_name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(160) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `logo_url` VARCHAR(255) NULL DEFAULT NULL,
  `origin_city` VARCHAR(100) NULL DEFAULT NULL,
  `origin_address` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Where couriers pick up the parcel',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `rating_avg` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `rating_count` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `bank_account` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Payout destination',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_vendors_user` (`user_id` ASC),
  UNIQUE INDEX `uq_vendors_slug` (`slug` ASC),
  CONSTRAINT `fk_vendors_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `chandra_mall`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`products` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `vendor_id` BIGINT(20) UNSIGNED NOT NULL,
  `category_id` INT(10) UNSIGNED NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `price` DECIMAL(14,2) NOT NULL,
  `stock` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `unit` VARCHAR(30) NOT NULL DEFAULT 'pcs',
  `weight_grams` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_exportable` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_products_slug` (`slug` ASC),
  INDEX `idx_products_vendor` (`vendor_id` ASC),
  INDEX `idx_products_category` (`category_id` ASC),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`)
    REFERENCES `chandra_mall`.`categories` (`id`),
  CONSTRAINT `fk_products_vendor`
    FOREIGN KEY (`vendor_id`)
    REFERENCES `chandra_mall`.`vendors` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`cart_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`cart_items` (
  `user_id` BIGINT(20) UNSIGNED NOT NULL,
  `product_id` BIGINT(20) UNSIGNED NOT NULL,
  `quantity` INT(10) UNSIGNED NOT NULL DEFAULT 1,
  `notes` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`user_id`, `product_id`),
  INDEX `idx_cart_product` (`product_id` ASC),
  CONSTRAINT `fk_cart_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `chandra_mall`.`products` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_cart_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `chandra_mall`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`hk_stores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`hk_stores` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT(20) UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `address_line` VARCHAR(255) NOT NULL,
  `district` VARCHAR(100) NULL DEFAULT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `opening_hours` VARCHAR(150) NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_hk_stores_owner` (`owner_user_id` ASC),
  CONSTRAINT `fk_hk_stores_owner`
    FOREIGN KEY (`owner_user_id`)
    REFERENCES `chandra_mall`.`users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`hk_store_vendors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`hk_store_vendors` (
  `hk_store_id` BIGINT(20) UNSIGNED NOT NULL,
  `vendor_id` BIGINT(20) UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`hk_store_id`, `vendor_id`),
  INDEX `idx_hksv_vendor` (`vendor_id` ASC),
  CONSTRAINT `fk_hksv_store`
    FOREIGN KEY (`hk_store_id`)
    REFERENCES `chandra_mall`.`hk_stores` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_hksv_vendor`
    FOREIGN KEY (`vendor_id`)
    REFERENCES `chandra_mall`.`vendors` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`orders` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(30) NOT NULL,
  `buyer_id` BIGINT(20) UNSIGNED NOT NULL,
  `hk_store_id` BIGINT(20) UNSIGNED NOT NULL,
  `status` ENUM('pending_payment', 'paid', 'cancelled', 'completed') NOT NULL DEFAULT 'pending_payment',
  `total_amount` DECIMAL(14,2) NOT NULL,
  `payment_deadline` DATETIME NOT NULL COMMENT 'created_at + 24 hours',
  `paid_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_orders_number` (`order_number` ASC),
  INDEX `idx_orders_buyer` (`buyer_id` ASC),
  INDEX `idx_orders_store` (`hk_store_id` ASC),
  CONSTRAINT `fk_orders_buyer`
    FOREIGN KEY (`buyer_id`)
    REFERENCES `chandra_mall`.`users` (`id`),
  CONSTRAINT `fk_orders_store`
    FOREIGN KEY (`hk_store_id`)
    REFERENCES `chandra_mall`.`hk_stores` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`notifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`notifications` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NULL DEFAULT NULL,
  `related_order_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `idx_notif_user` (`user_id` ASC, `is_read` ASC),
  INDEX `fk_notif_order` (`related_order_id` ASC),
  CONSTRAINT `fk_notif_order`
    FOREIGN KEY (`related_order_id`)
    REFERENCES `chandra_mall`.`orders` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_notif_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `chandra_mall`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`order_vendor_groups`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`order_vendor_groups` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT(20) UNSIGNED NOT NULL,
  `vendor_id` BIGINT(20) UNSIGNED NOT NULL,
  `status` ENUM('pending_payment', 'awaiting_confirmation', 'packed', 'shipped', 'in_customs', 'returned', 'cancelled', 'arrived_at_hk_store', 'picked_up', 'completed') NOT NULL DEFAULT 'pending_payment',
  `subtotal_amount` DECIMAL(14,2) NOT NULL,
  `platform_fee_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `vendor_net_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `confirmation_deadline` DATETIME NULL DEFAULT NULL COMMENT 'Set on payment: paid_at + 48 hours',
  `packed_at` DATETIME NULL DEFAULT NULL,
  `courier_name` VARCHAR(100) NULL DEFAULT NULL,
  `tracking_number` VARCHAR(100) NULL DEFAULT NULL,
  `shipped_at` DATETIME NULL DEFAULT NULL,
  `arrived_at_store_at` DATETIME NULL DEFAULT NULL,
  `picked_up_at` DATETIME NULL DEFAULT NULL,
  `handled_by_user_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL COMMENT 'HK store account that confirmed arrival / pickup',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `idx_ovg_order` (`order_id` ASC),
  INDEX `idx_ovg_vendor` (`vendor_id` ASC),
  INDEX `idx_ovg_status_deadline` (`status` ASC, `confirmation_deadline` ASC),
  INDEX `fk_ovg_handler` (`handled_by_user_id` ASC),
  INDEX `idx_ovg_hk_pickup` (`status` ASC, `arrived_at_store_at` ASC),
  CONSTRAINT `fk_ovg_handler`
    FOREIGN KEY (`handled_by_user_id`)
    REFERENCES `chandra_mall`.`users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_ovg_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `chandra_mall`.`orders` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_ovg_vendor`
    FOREIGN KEY (`vendor_id`)
    REFERENCES `chandra_mall`.`vendors` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`order_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`order_items` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_vendor_group_id` BIGINT(20) UNSIGNED NOT NULL,
  `product_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
  `product_name_snapshot` VARCHAR(200) NOT NULL,
  `price_snapshot` DECIMAL(14,2) NOT NULL,
  `quantity` INT(10) UNSIGNED NOT NULL,
  `subtotal` DECIMAL(14,2) NOT NULL,
  `notes_snapshot` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_oi_group` (`order_vendor_group_id` ASC),
  INDEX `fk_oi_product` (`product_id` ASC),
  CONSTRAINT `fk_oi_group`
    FOREIGN KEY (`order_vendor_group_id`)
    REFERENCES `chandra_mall`.`order_vendor_groups` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `chandra_mall`.`products` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`order_status_logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`order_status_logs` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_vendor_group_id` BIGINT(20) UNSIGNED NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `note` VARCHAR(255) NULL DEFAULT NULL,
  `changed_by_user_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `idx_osl_group` (`order_vendor_group_id` ASC),
  INDEX `fk_osl_user` (`changed_by_user_id` ASC),
  CONSTRAINT `fk_osl_group`
    FOREIGN KEY (`order_vendor_group_id`)
    REFERENCES `chandra_mall`.`order_vendor_groups` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_osl_user`
    FOREIGN KEY (`changed_by_user_id`)
    REFERENCES `chandra_mall`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`payments` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT(20) UNSIGNED NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `status` ENUM('pending', 'success', 'failed', 'expired') NOT NULL DEFAULT 'pending',
  `gateway_ref` VARCHAR(150) NULL DEFAULT NULL,
  `paid_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_payments_gateway` (`gateway_ref` ASC),
  INDEX `idx_payments_order` (`order_id` ASC),
  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `chandra_mall`.`orders` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`product_images`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`product_images` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT(20) UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `sort_order` SMALLINT(5) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `fk_pimages_product` (`product_id` ASC),
  CONSTRAINT `fk_pimages_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `chandra_mall`.`products` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`refunds`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`refunds` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT(20) UNSIGNED NOT NULL,
  `order_vendor_group_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL COMMENT 'Diisi jika pembatalan terjadi hanya pada sub-order tertentu',
  `amount` DECIMAL(14,2) NOT NULL,
  `reason` VARCHAR(255) NOT NULL COMMENT 'Contoh: Supplier Expired / Bea Cukai Retur',
  `status` ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
  `refund_gateway_ref` VARCHAR(150) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_refunds_gateway_ref` (`refund_gateway_ref` ASC),
  INDEX `idx_refunds_order` (`order_id` ASC),
  INDEX `fk_refunds_group` (`order_vendor_group_id` ASC),
  CONSTRAINT `fk_refunds_group`
    FOREIGN KEY (`order_vendor_group_id`)
    REFERENCES `chandra_mall`.`order_vendor_groups` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_refunds_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `chandra_mall`.`orders` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`reviews`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`reviews` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_vendor_group_id` BIGINT(20) UNSIGNED NOT NULL,
  `buyer_id` BIGINT(20) UNSIGNED NOT NULL,
  `product_id` BIGINT(20) UNSIGNED NOT NULL,
  `vendor_id` BIGINT(20) UNSIGNED NOT NULL,
  `rating` TINYINT(3) UNSIGNED NOT NULL COMMENT '1-5',
  `comment` TEXT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_review_once` (`order_vendor_group_id` ASC, `product_id` ASC),
  INDEX `idx_reviews_vendor` (`vendor_id` ASC),
  INDEX `fk_review_buyer` (`buyer_id` ASC),
  INDEX `fk_review_product` (`product_id` ASC),
  CONSTRAINT `fk_review_buyer`
    FOREIGN KEY (`buyer_id`)
    REFERENCES `chandra_mall`.`users` (`id`),
  CONSTRAINT `fk_review_group`
    FOREIGN KEY (`order_vendor_group_id`)
    REFERENCES `chandra_mall`.`order_vendor_groups` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_review_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `chandra_mall`.`products` (`id`),
  CONSTRAINT `fk_review_vendor`
    FOREIGN KEY (`vendor_id`)
    REFERENCES `chandra_mall`.`vendors` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`vendor_wallets`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`vendor_wallets` (
  `vendor_id` BIGINT(20) UNSIGNED NOT NULL,
  `balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`vendor_id`),
  CONSTRAINT `fk_wallet_vendor`
    FOREIGN KEY (`vendor_id`)
    REFERENCES `chandra_mall`.`vendors` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`wallet_transactions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`wallet_transactions` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `vendor_id` BIGINT(20) UNSIGNED NOT NULL,
  `order_vendor_group_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
  `type` ENUM('credit', 'withdrawal') NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `idx_wtx_vendor` (`vendor_id` ASC),
  INDEX `fk_wtx_group` (`order_vendor_group_id` ASC),
  CONSTRAINT `fk_wtx_group`
    FOREIGN KEY (`order_vendor_group_id`)
    REFERENCES `chandra_mall`.`order_vendor_groups` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_wtx_vendor`
    FOREIGN KEY (`vendor_id`)
    REFERENCES `chandra_mall`.`vendors` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `chandra_mall`.`wishlist_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chandra_mall`.`wishlist_items` (
  `user_id` BIGINT(20) UNSIGNED NOT NULL,
  `product_id` BIGINT(20) UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`user_id`, `product_id`),
  INDEX `idx_wish_product` (`product_id` ASC),
  CONSTRAINT `fk_wish_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `chandra_mall`.`products` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_wish_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `chandra_mall`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
