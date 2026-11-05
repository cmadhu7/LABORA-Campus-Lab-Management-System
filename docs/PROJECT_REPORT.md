# LABORA – Campus Laboratory Asset Management System
## Academic Mini-Project Report & Technical Specification

**Author / Developer:** Madhu  
**Degree:** Bachelor of Technology in Computer Science and Engineering  
**Institution:** G. Pullaiah College of Engineering & Technology  
**Subject:** Enterprise Software Architecture & Database Engineering  
**Version:** 1.0 (Production Release)

---

### 1. Abstract
The modern higher-education laboratory infrastructure requires strict accountability, precise inventory tracking, and swift checkout operations. Manual logbooks and disconnected spreadsheets fail due to high human error rates, lack of concurrency control, and inability to maintain real-time auditability. 

**LABORA** (Campus Laboratory Asset Management System) is an enterprise-grade, full-stack laboratory resource planning platform. Powered by an Express.js REST API, MySQL database engine, and a vanilla JavaScript frontend adhering to Apple and modern SaaS design patterns, LABORA enforces ACID-compliant inventory transactions, role-based access control, real-time stock telemetry, and comprehensive reporting.

---

### 2. Problem Statement
Academic laboratories manage thousands of high-value apparatus (oscilloscopes, spectrometers, GPU clusters, FPGA boards). Existing administrative workflows face critical vulnerabilities:
1. **Inventory Discrepancy & Over-allocation:** Double-booking apparatus during high-demand student capstones.
2. **Untracked Damaged Assets:** Broken equipment is lost in inventory rather than scheduled for repair.
3. **Absence of Concurrency Locks:** Concurrent checkouts cause negative stock counts.
4. **Poor Audit Readiness:** Generating compliance reports for university accreditation audits requires days of manual compilation.

---

### 3. System Architecture & Relational Model

#### 3.1 Entity Relationship Model
- **users (1) --- (N) issue_records**: A user can check out multiple laboratory instruments over their academic program.
- **equipment (1) --- (N) issue_records**: A single equipment inventory line item can have multiple checkout transactions over its lifetime.

#### 3.2 Relational Schema
- `equipment`: `equipment_id` (PK), `name`, `category`, `quantity`, `available_quantity`, `status`, `location`, `model_number`, timestamps.
- `users`: `user_id` (PK), `name`, `email` (UNIQUE), `password` (BCrypt hash), `role`, `department`, `phone`, `status`, timestamps.
- `issue_records`: `issue_id` (PK), `equipment_id` (FK), `user_id` (FK), `issue_date`, `return_date`, `expected_return_date`, `quantity`, `status`, `remarks`, timestamps.

#### 3.3 ACID Transaction Guarantees in Equipment Checkout
To eliminate race conditions, checkout requests use explicit row locking:
```sql
START TRANSACTION;
SELECT available_quantity FROM equipment WHERE equipment_id = ? FOR UPDATE;
-- Check available_quantity >= requested_quantity
UPDATE equipment SET available_quantity = available_quantity - ? WHERE equipment_id = ?;
INSERT INTO issue_records (equipment_id, user_id, issue_date, expected_return_date, quantity, status) 
VALUES (?, ?, CURDATE(), ?, ?, 'Issued');
COMMIT;
```

---

### 4. Verification & Testing Matrix

| Test ID | Module | Scenario | Expected Behavior | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Auth | Login with valid credentials | 200 OK + JWT returned + Dashboard redirect | **PASS** |
| **TC-02** | Auth | Login with incorrect password | 401 Unauthorized + Error toast | **PASS** |
| **TC-03** | Equipment | Add equipment with negative quantity | 400 Bad Request + DB CHECK rejection | **PASS** |
| **TC-04** | Issue | Request 10 units when available is 4 | 400 Bad Request + Transaction rolled back | **PASS** |
| **TC-05** | Return | Return active item | `available_quantity` restored + Status updated | **PASS** |
| **TC-06** | Return | Duplicate return on closed issue | 400 Bad Request ("Already returned") | **PASS** |
| **TC-07** | Admin | Delete item with active checkout | 400 Bad Request + Integrity constraint preserved | **PASS** |

---

### 5. Conclusion & Future Enhancements
LABORA delivers a production-grade laboratory asset management solution eliminating equipment misplacement, preventing race conditions, and providing real-time oversight for department heads. Future milestones include:
1. **RFID / Barcode Scanner Integration:** Instant physical check-in and check-out via handheld scanners.
2. **Automated WhatsApp / Email Alerts:** Automated reminder triggers 24 hours prior to expected return dates.
3. **IoT Smart Locker Integration:** Automated locker unlocking upon approved student checkout.
