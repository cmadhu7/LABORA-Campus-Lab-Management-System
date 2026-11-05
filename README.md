# LABORA – Campus Laboratory Asset Management System
> Smart Laboratory. Smarter Management.

LABORA is an enterprise-grade laboratory resource and equipment checkout platform built for college campus research labs.

## Technology Stack
- **Frontend:** Vanilla HTML5, CSS3, ES6+ JavaScript, Chart.js
- **Backend:** Node.js, Express.js REST API
- **Database:** MySQL 8.0+ (`mysql2/promise` with ACID transactions)
- **Security:** Bcrypt password hashing, JWT session authentication, Role-Based Access Control (RBAC)

## Quick Start Setup

### 1. Database Initialization
Import the schema and sample data into your MySQL server:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```

### 2. Environment Configuration
Copy `.env.example` to `backend/.env` and configure your database credentials:
```bash
cp .env.example backend/.env
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
# Server will listen on http://localhost:5000
```

### 4. Access LABORA
Open your browser and navigate to:
`http://localhost:5000/login.html`

### Demo Credentials
- **Administrator:** `admin@labora.edu` | Password: `Admin@123`
- **Student:** `student.madhu@labora.edu` | Password: `Student@123`
