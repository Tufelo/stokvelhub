# 🏦 StokvelHub - Multi-Tenant Fintech SaaS Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18.x-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.x-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-orange)](LICENSE)

---

## 📋 Overview

**StokvelHub** is a full-stack, multi-tenant financial management platform designed for community savings groups (Stokvels). It provides complete financial management with role-based access control, contribution tracking, and a **unique cloning engine** that allows rapid creation of new savings groups.

### 🎯 Why This Matters

In many communities, informal savings groups lack digital tracking, leading to:
- ❌ Manual record-keeping errors
- ❌ No transparency for members
- ❌ Difficulty tracking contributions
- ❌ No audit trail for transactions

**StokvelHub solves these problems** with a modern, secure, and scalable SaaS platform.

---

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication with secure token management
- Role-based access control (Founder, Admin, Treasurer, Member)
- Password hashing with bcrypt
- Protected API routes with middleware

### 🏦 Stokvel Management
- Create Stokvels with custom settings
- **Clone existing stokvels** - Config only, no data sharing
- Enforce max 50 members rule
- View stokvel details with member list
- Update and delete stokvel settings

### 👥 Member Management
- Add/remove members with role assignment
- Role-based permissions (Founder, Admin, Treasurer, Member)
- Join date tracking for all members
- Member contribution history

### 💰 Financial Management
- Contribution ledger - Record and track payments
- Payment status tracking (Paid, Pending, Late)
- Automatic rotational payout system
- Financial summaries - Total contributions, payouts, and balance

### 📊 Audit & Compliance
- Complete audit trail for all actions
- Transaction logging - Every financial event is recorded
- Member activity history

### 🎨 Modern UI
- Material-UI components
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Professional gradient design

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express | Web framework |
| TypeScript | Type-safe development |
| SQLite | Database |
| JWT | Authentication |
| bcrypt | Password hashing |

### Frontend
| Technology | Purpose |
|------------|---------|
| React | UI framework |
| TypeScript | Type-safe development |
| Material-UI | Component library |
| Axios | HTTP client |
| React Router | Navigation |
| Framer Motion | Animations |

---

## 📂 Project Structure
