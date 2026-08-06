# API Contract

## Authentication

POST /auth/login

POST /auth/logout

GET /auth/profile

---

## Products

GET /products

GET /products/:id

POST /products

PUT /products/:id

DELETE /products/:id

---

## Customers

GET /customers

GET /customers/:id

POST /customers

PUT /customers/:id

DELETE /customers/:id

---

## Invoices

GET /invoices

GET /invoices/:id

POST /invoices

PUT /invoices/:id

DELETE /invoices/:id

GET /invoices/:id/pdf

---

## Dashboard

GET /dashboard/summary

GET /dashboard/sales

GET /dashboard/products

---

## Payments (Phase 10 - Accounts Receivable)

GET /payments - List all payments with filters (page, limit, search, invoiceId, customerId, paymentMethod, startDate, endDate, isCancelled, sort, order)

GET /payments/statistics - Get payment statistics (total, totalAmount, byMethod, todayCollection, thisMonthCollection, thisYearCollection)

GET /payments/method-distribution - Get payment method distribution

GET /payments/collection-trend - Get collection trend (daily, weekly, monthly)

GET /payments/invoice/:invoiceId - Get payment history for invoice

GET /payments/customer/:customerId - Get customer payment history

GET /payments/:id - Get payment by ID

POST /payments - Record payment

PUT /payments/:id - Update payment

DELETE /payments/:id/cancel - Cancel payment

---

## Ledger (Phase 10 - Accounts Receivable)

GET /ledger/customer/:customerId - Get customer running ledger

GET /ledger/customer/:customerId/statement - Get printable customer statement

GET /ledger/aging - Get outstanding aging report

---

## Outstanding (Phase 10 - Accounts Receivable)

GET /outstanding - List outstanding invoices with filters

GET /outstanding/summary - Get outstanding summary

GET /outstanding/aging - Get aging report

GET /outstanding/overdue - Get overdue invoices

GET /outstanding/collection-efficiency - Get collection efficiency metrics

GET /outstanding/customer/:customerId - Get customer outstanding invoices

---

## AR Analytics (Phase 10 - Accounts Receivable)

GET /analytics/ar/collection-trend - Get collection trend

GET /analytics/ar/monthly-collection - Get monthly collection

GET /analytics/ar/daily-collection - Get daily collection

GET /analytics/ar/top-paying-customers - Get top paying customers

GET /analytics/ar/outstanding-aging - Get outstanding aging report

GET /analytics/ar/payment-method-analytics - Get payment method analytics

GET /analytics/ar/collection-forecast - Get collection forecast
