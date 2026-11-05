# LABORA Database Architecture & Data Dictionary

Database Engine: MySQL 8.0+ (InnoDB)
Collation: `utf8mb4_unicode_ci`

## Tables & Relationships

### 1. `equipment`
- `equipment_id`: INT, Primary Key, AUTO_INCREMENT
- `name`: VARCHAR(100), NOT NULL
- `category`: VARCHAR(50), NOT NULL
- `quantity`: INT, NOT NULL, DEFAULT 0, CHECK (`quantity` >= 0)
- `available_quantity`: INT, NOT NULL, CHECK (`available_quantity` >= 0 AND `available_quantity` <= `quantity`)
- `status`: VARCHAR(20), CHECK in ('Available', 'In Use', 'Low Stock', 'Out of Stock', 'Damaged', 'Maintenance')
- `location`: VARCHAR(100)
- `model_number`: VARCHAR(50)
- `created_at`, `updated_at`: TIMESTAMP

### 2. `users`
- `user_id`: INT, Primary Key, AUTO_INCREMENT
- `name`: VARCHAR(100), NOT NULL
- `email`: VARCHAR(100), UNIQUE, NOT NULL
- `password`: VARCHAR(255), NOT NULL (BCrypt hash)
- `role`: VARCHAR(30), NOT NULL, CHECK in ('admin', 'student', 'faculty', 'lab_assistant')
- `department`: VARCHAR(50)
- `phone`: VARCHAR(20)
- `status`: VARCHAR(20), CHECK in ('Active', 'Inactive', 'Suspended')
- `created_at`, `updated_at`: TIMESTAMP

### 3. `issue_records`
- `issue_id`: INT, Primary Key, AUTO_INCREMENT
- `equipment_id`: INT, Foreign Key (`equipment.equipment_id`)
- `user_id`: INT, Foreign Key (`users.user_id`)
- `issue_date`: DATE, NOT NULL
- `return_date`: DATE, NULL
- `expected_return_date`: DATE, NULL
- `quantity`: INT, NOT NULL, CHECK (`quantity` > 0)
- `status`: VARCHAR(20), CHECK in ('Issued', 'Returned', 'Overdue', 'Damaged', 'Lost')
- `remarks`: TEXT
- `created_at`, `updated_at`: TIMESTAMP
