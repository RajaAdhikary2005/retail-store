# 🏪 RetailStore — Quick Guide

> **Live**: [retail-store-gilt.vercel.app](https://retail-store-gilt.vercel.app) • **Built by** Raja Adhikary

---

## 🔐 Login

| Role | Email | Password |
|------|-------|----------|
| 🔴 Admin | `admin@retailstore.com` | `password123` |
| 🟡 Manager | `manager@retailstore.com` | `password123` |
| 🔵 Staff | `staff@retailstore.com` | `password123` |

New users → Click **Sign Up** → Admin accounts are instant, Manager/Staff need admin approval.

---

## 🛡️ Who Can Do What?

| Module | Admin | Manager | Staff |
|--------|:-----:|:-------:|:-----:|
| Dashboard, Products, Customers, Orders | ✅ | ✅ | ✅ (view) |
| Take Order & Customer Lookup | ✅ | ✅ | ✅ |
| Analytics, Dues, Inventory Alerts | ✅ | ✅ | ❌ |
| Returns | Approve + Refund | Approve | Create only |
| Suppliers, Promotions, Users, Audit Logs | ✅ | ❌ | ❌ |

---

## 🛒 Take Order (POS)

1. **Search & click products** to add to cart
2. **Select/search a customer** (or type name manually)
3. *(Optional)* Enter **coupon code** → "Check & Apply"
4. Choose **Cash / Card / UPI**
5. Click **Complete Order** ✅

---

## 📦 Key Modules

| Page | What It Does |
|------|-------------|
| **Products** | Add, edit, delete products with price & stock |
| **Customers** | Manage customer database |
| **Orders** | View all orders, change status (Pending → Delivered) |
| **Customer Lookup** | See loyalty tiers (Bronze→Platinum), expand for order history |
| **Inventory Alerts** | Low stock warnings + create Purchase Orders |
| **Dues & Payments** | Track money owed, record payments with "Received"/"Pay" |
| **Analytics** | Charts — revenue trends, top customers, best products |
| **Suppliers & POs** | Add suppliers, create purchase orders with product selection |
| **Promotions** | Create/delete coupon codes (Percentage or Flat) |
| **Returns** | Staff creates → Manager approves → Admin issues refund |
| **User Management** | Suspend/activate users |
| **Audit Logs** | Auto-recorded trail of all actions |
| **Settings** | Change name/email (persists to DB), dark mode toggle |

---

## 🏗️ Tech Stack

| | Technology |
|--|-----------|
| **Frontend** | React + TypeScript + Vite → Vercel |
| **Backend** | Spring Boot 3 + JPA → Render |
| **Database** | MySQL |
| **Auth** | Spring Security + BCrypt |

---

>
