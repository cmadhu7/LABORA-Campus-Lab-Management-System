-- =============================================================================
-- LABORA – Campus Laboratory Asset Management System
-- Database Schema Definition
-- Database Engine: MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `labora_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `labora_db`;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Table 1: equipment
-- Stores all physical laboratory instruments, apparatus, and devices
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
    `equipment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 0,
    `available_quantity` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Available',
    `location` VARCHAR(100) DEFAULT 'Main Campus Central Lab',
    `model_number` VARCHAR(50) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Table Constraints
    CONSTRAINT `chk_equipment_quantity_non_negative` CHECK (`quantity` >= 0),
    CONSTRAINT `chk_equipment_available_quantity_bounds` CHECK (`available_quantity` >= 0 AND `available_quantity` <= `quantity`),
    CONSTRAINT `chk_equipment_status_valid` CHECK (`status` IN ('Available', 'In Use', 'Low Stock', 'Out of Stock', 'Damaged', 'Maintenance'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Indexes for Equipment Table
CREATE INDEX `idx_equipment_category` ON `equipment` (`category`);
CREATE INDEX `idx_equipment_status` ON `equipment` (`status`);
CREATE INDEX `idx_equipment_name` ON `equipment` (`name`);


-- -----------------------------------------------------------------------------
-- Table 2: users
-- Stores administrative staff, faculty members, lab assistants, and students
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL DEFAULT 'student',
    `department` VARCHAR(50) DEFAULT 'Computer Science & Engineering',
    `phone` VARCHAR(20) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Table Constraints
    CONSTRAINT `chk_users_role_valid` CHECK (`role` IN ('admin', 'student', 'faculty', 'lab_assistant')),
    CONSTRAINT `chk_users_status_valid` CHECK (`status` IN ('Active', 'Inactive', 'Suspended'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Indexes for Users Table
CREATE INDEX `idx_users_role` ON `users` (`role`);
CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_users_department` ON `users` (`department`);


-- -----------------------------------------------------------------------------
-- Table 3: issue_records
-- Tracks laboratory asset checkout transactions, reservations, and returns
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `issue_records`;
CREATE TABLE `issue_records` (
    `issue_id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipment_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `issue_date` DATE NOT NULL,
    `return_date` DATE DEFAULT NULL,
    `expected_return_date` DATE DEFAULT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Issued',
    `remarks` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key Relationships
    CONSTRAINT `fk_issue_equipment` FOREIGN KEY (`equipment_id`) 
        REFERENCES `equipment` (`equipment_id`) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
        
    CONSTRAINT `fk_issue_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`user_id`) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
        
    -- Table Constraints
    CONSTRAINT `chk_issue_quantity_positive` CHECK (`quantity` > 0),
    CONSTRAINT `chk_issue_status_valid` CHECK (`status` IN ('Issued', 'Returned', 'Overdue', 'Damaged', 'Lost'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Indexes for Issue Records Table
CREATE INDEX `idx_issue_equipment_id` ON `issue_records` (`equipment_id`);
CREATE INDEX `idx_issue_user_id` ON `issue_records` (`user_id`);
CREATE INDEX `idx_issue_status` ON `issue_records` (`status`);
CREATE INDEX `idx_issue_dates` ON `issue_records` (`issue_date`, `return_date`);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
