# Bank Simulation 

A full-stack banking simulation platform that provides users with a realistic digital banking experience. The application includes account management, transaction processing, loan services, bill payments, financial analytics, fraud monitoring, and AI-powered financial assistance.

## Features

### Authentication & Security

* User Registration and Login
* JWT-based Authentication
* Protected Routes
* Secure Session Management

### Banking Operations

* Deposit Money
* Withdraw Money
* Transfer Funds
* Transaction History
* Account Balance Tracking

### Loan Management

* Loan Application
* Loan Eligibility Checker
* EMI Planner
* My Loans Dashboard

### Financial Services

* Bill Payments
* Bill Payment History
* Credit Score Monitoring
* Financial Analytics Dashboard

### Monitoring & Insights

* Fraud Monitoring System
* Spending Analytics
* Financial Reports
* Smart Recommendations

### User Experience

* Responsive UI
* Modern Glassmorphism Design
* Professional Dashboard
* Dark/Light Theme Support
* Real-time Notifications

---

## Technology Stack

### Frontend

* React.js
* React Context API
* Tailwind CSS
* JavaScript
* Responsive Design

### Backend

* Node.js
* Express.js
* JWT Authentication
* REST API Architecture

### Database

* MySQL
* SQL Scripts for Database Setup

---

## Project Structure

```text
banksimulation/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── database.sql
│   └── setup-database.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
│
├── .gitignore
├── vercel.json
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/adilpashags/Bank-Simulation.git
cd Bank-Simulation
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `config.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=bank_simulation
JWT_SECRET=your_secret_key
```

Run database setup:

```bash
node setup-database.js
```

Start backend server:

```bash
npm start
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will run on:

```text
http://localhost:3000
```

---

## Database Setup

Execute the SQL script:

```bash
backend/database.sql
```

or run:

```bash
node setup-database.js
```

to automatically create the required tables.

---

## Available Modules

* User Authentication
* Dashboard
* Transactions
* Transaction History
* Bill Payments
* Bill Payment History
* Apply Loan
* Loan Eligibility
* EMI Planner
* My Loans
* Credit Score
* Financial Advisor
* Fraud Monitor
* Analytics
* User Profile

---

## API Overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Banking

```http
GET  /api/bank/account
POST /api/bank/deposit
POST /api/bank/withdraw
POST /api/bank/transfer
GET  /api/bank/transactions
```

---

## Future Enhancements

* UPI Integration
* Net Banking Simulation
* Investment Portfolio Management
* AI Chatbot Assistant
* Real-Time Notifications
* Mobile Application
* Multi-Bank Support

---

## Learning Outcomes

This project demonstrates:

* Full Stack Development
* REST API Development
* Authentication & Authorization
* Database Design
* Financial System Simulation
* React State Management
* Secure Application Development

---

## Author

**Adil Pasha**

GitHub: https://github.com/adilpashags

---

## License

This project is developed for educational and portfolio purposes.
