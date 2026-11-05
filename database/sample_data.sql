-- =============================================================================
-- LABORA – Campus Laboratory Asset Management System
-- Seed & Sample Data
-- =============================================================================

USE `labora_db`;

-- Clear existing sample records cleanly
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `issue_records`;
TRUNCATE TABLE `equipment`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Seed Users
-- Default Passwords:
-- Admin: Admin@123
-- Faculty: Faculty@123
-- Assistant: Assistant@123
-- Students: Student@123
-- Note: Hashes generated with bcrypt (cost factor 10)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `department`, `phone`, `status`) VALUES
(1, 'Dr. K. Srinivas', 'admin@labora.edu', '$2a$10$wK1Wq69b4V26q3LqGk5Bxe9ZtU2qZ7N5D.2H3D9M1N2F6E8Z1O8Xe', 'admin', 'Central Laboratory Administration', '+91 9876543210', 'Active'),
(2, 'Prof. Rajesh Kumar', 'faculty.rajesh@labora.edu', '$2a$10$X8JmF9.P1L8c3T6W2V1LceN7H2K8M9D0Q1W2E3R4T5Y6U7I8O9P0A', 'faculty', 'Electronics & Communication', '+91 9876543211', 'Active'),
(3, 'Suresh Varma', 'assistant.suresh@labora.edu', '$2a$10$Y9KnG0.Q2M9d4U7X3W2MdfO8I3L9N0E1R2X3F4S5U6V7W8J9P0Q1B', 'lab_assistant', 'Computer Science & Engineering', '+91 9876543212', 'Active'),
(4, 'Madhu Chandran', 'student.madhu@labora.edu', '$2a$10$Z0LoH1.R3N0e5V8Y4X3NegP9J4M0O1F2S3Y4G5T6V7W8X9K0Q1R2C', 'student', 'Computer Science & Engineering', '+91 9876543213', 'Active'),
(5, 'Ananya Sharma', 'student.ananya@labora.edu', '$2a$10$Z0LoH1.R3N0e5V8Y4X3NegP9J4M0O1F2S3Y4G5T6V7W8X9K0Q1R2C', 'student', 'Computer Science & Engineering', '+91 9876543214', 'Active'),
(6, 'Rahul Patel', 'student.rahul@labora.edu', '$2a$10$Z0LoH1.R3N0e5V8Y4X3NegP9J4M0O1F2S3Y4G5T6V7W8X9K0Q1R2C', 'student', 'Electronics & Communication', '+91 9876543215', 'Active'),
(7, 'Priya Nair', 'student.priya@labora.edu', '$2a$10$Z0LoH1.R3N0e5V8Y4X3NegP9J4M0O1F2S3Y4G5T6V7W8X9K0Q1R2C', 'student', 'Mechanical Engineering', '+91 9876543216', 'Active'),
(8, 'Kiran Reddy', 'student.kiran@labora.edu', '$2a$10$Z0LoH1.R3N0e5V8Y4X3NegP9J4M0O1F2S3Y4G5T6V7W8X9K0Q1R2C', 'student', 'Computer Science & Engineering', '+91 9876543217', 'Active');


-- -----------------------------------------------------------------------------
-- Seed Equipment Inventory
-- -----------------------------------------------------------------------------
INSERT INTO `equipment` (`equipment_id`, `name`, `category`, `quantity`, `available_quantity`, `status`, `location`, `model_number`) VALUES
(1, 'Digital Storage Oscilloscope 100MHz', 'Electronics', 15, 12, 'Available', 'Room 302, Signal Processing Lab', 'Tektronix TBS1102C'),
(2, 'Arbitrary Function Generator 25MHz', 'Electronics', 10, 8, 'Available', 'Room 302, Signal Processing Lab', 'Rigol DG1022Z'),
(3, 'UV-Vis Spectrophotometer', 'Chemistry', 6, 5, 'Available', 'Room 105, Analytical Chemistry Lab', 'Shimadzu UV-1900i'),
(4, 'Digital Analytical Precision Balance', 'Chemistry', 8, 8, 'Available', 'Room 105, Analytical Chemistry Lab', 'Mettler Toledo ME204'),
(5, 'NVIDIA Jetson Nano Developer Kits', 'Computer Science', 20, 16, 'Available', 'Room 412, AI & Embedded IoT Lab', 'NV-JETSON-NANO-B01'),
(6, 'Raspberry Pi 4 Model B (8GB)', 'Computer Science', 30, 24, 'Available', 'Room 412, AI & Embedded IoT Lab', 'RPi4-8GB-V1.4'),
(7, 'Fluke True-RMS Digital Multimeter', 'Electrical', 25, 20, 'Available', 'Room 208, Basic Electrical Lab', 'Fluke 117 Professional'),
(8, 'Binocular Compound Microscope 1000x', 'Biotechnology', 12, 10, 'Available', 'Room 110, Bio-Science Lab', 'Olympus CX23'),
(9, 'SMD Rework & Soldering Station', 'Electronics', 12, 10, 'Available', 'Room 304, Hardware Prototyping Lab', 'Hakko FX-888D / 850'),
(10, 'Helium-Neon Gas Laser Optics Bench', 'Physics', 5, 4, 'Available', 'Room 201, Advanced Optics Lab', 'Thorlabs HNL100R'),
(11, 'Digital Vernier Caliper (0.01mm)', 'Mechanical', 18, 18, 'Available', 'Room 101, Metrology Workshop', 'Mitutoyo 500-196-30'),
(12, 'Xilinx Artix-7 FPGA Development Board', 'Electronics', 8, 0, 'Out of Stock', 'Room 306, VLSI & Microelectronics Lab', 'Digilent Basys 3'),
(13, 'Portable Ultrasonic Flaw Detector', 'Mechanical', 4, 3, 'Damaged', 'Room 103, NDT Testing Lab', 'Olympus EPOCH 650');


-- -----------------------------------------------------------------------------
-- Seed Issue & Return Records
-- -----------------------------------------------------------------------------
INSERT INTO `issue_records` (`issue_id`, `equipment_id`, `user_id`, `issue_date`, `return_date`, `expected_return_date`, `quantity`, `status`, `remarks`) VALUES
-- Past Completed Returns
(1, 1, 4, '2026-09-10', '2026-09-17', '2026-09-17', 1, 'Returned', 'Returned on time in pristine working condition.'),
(2, 6, 5, '2026-09-15', '2026-09-22', '2026-09-22', 2, 'Returned', 'Project IoT telemetry demonstration completed.'),
(3, 7, 6, '2026-10-01', '2026-10-08', '2026-10-08', 2, 'Returned', 'Completed circuit simulation measurements.'),
(4, 2, 4, '2026-10-05', '2026-10-12', '2026-10-12', 1, 'Returned', 'Filter frequency response analysis completed.'),
(5, 5, 7, '2026-10-10', '2026-10-18', '2026-10-17', 2, 'Returned', 'Edge AI inference benchmark concluded.'),

-- Current Active Issues (Pending Returns)
(6, 1, 4, '2026-10-25', NULL, '2026-11-10', 2, 'Issued', 'Assigned for Quantum Cryptography and Hardware Security project.'),
(7, 5, 5, '2026-10-28', NULL, '2026-11-12', 2, 'Issued', 'Computer vision automated drone payload project.'),
(8, 6, 8, '2026-10-30', NULL, '2026-11-15', 4, 'Issued', 'Smart campus environmental sensing mesh network.'),
(9, 7, 6, '2026-11-01', NULL, '2026-11-14', 3, 'Issued', 'Power electronic inverter harmonic distortion test.'),
(10, 2, 2, '2026-11-02', NULL, '2026-11-16', 1, 'Issued', 'Faculty demonstration for advanced modulation techniques.'),
(11, 3, 7, '2026-11-03', NULL, '2026-11-17', 1, 'Issued', 'Chemical absorbance sample curve calibration.'),

-- Active Overdue Issue
(12, 12, 4, '2026-10-12', NULL, '2026-10-26', 8, 'Overdue', 'Senior VLSI hardware emulation capstone; pending lab signoff.'),

-- Damaged Record
(13, 13, 6, '2026-10-20', '2026-10-27', '2026-10-27', 1, 'Damaged', 'Transducer probe connector cracked during drop test. Sent for OEM repair.');
