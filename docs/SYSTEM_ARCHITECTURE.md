# System Architecture

## Architecture Style

Repository → Service → Controller

## Frontend

Presentation Layer

↓

API Layer

↓

Global State

↓

Reusable Components

## Backend

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma ORM

↓

Supabase PostgreSQL

## Phase 10 - Accounts Receivable Architecture

### Module Structure

Payments Module:
- PaymentRepository (CRUD + Payment-specific queries)
- PaymentService (Business logic + Invoice updates + Validation)
- PaymentController (REST endpoints)
- Payment Routes (/api/v1/payments)

Ledger Module:
- LedgerRepository (Customer ledger generation)
- LedgerService (Statement generation + Aging)
- LedgerController (REST endpoints)
- Ledger Routes (/api/v1/ledger)

Outstanding Module:
- OutstandingRepository (Outstanding invoice queries)
- OutstandingService (Summary + Aging + Collection efficiency)
- OutstandingController (REST endpoints)
- Outstanding Routes (/api/v1/outstanding)

### Data Flow

Customer
    │
    ▼
Invoice (extended with payment fields)
    │
    ▼
Payment (new model)
    │
    ▼
Customer Ledger (generated from Invoices + Payments)
    │
    ▼
Reports / Dashboard / Analytics

### Business Logic

1. Invoice Created → paidAmount=0, balanceAmount=grandTotal, status=UNPAID
2. Payment Recorded → Increase paidAmount, Decrease balanceAmount
   - balanceAmount == 0 → Status = PAID
   - balanceAmount > 0 → Status = PARTIALLY_PAID
3. Payment Cancelled → Reverse all calculations, Update invoice
4. Validation: No payment > outstanding, No payment on cancelled invoice, No negative amounts
5. Reference number required for UPI, BANK_TRANSFER, CHEQUE

### Dashboard Integration

New AR metrics added to dashboard summary:
- Today's Collection
- Outstanding Amount
- Overdue Amount
- Collection This Month
- Collection This Year
- Payment Method Distribution
- Cash Collection
- UPI Collection
- Bank Collection
- Cheque Collection
- Average Collection Time

### Analytics Integration

New AR Analytics endpoints:
- Collection Trend (Daily/Weekly/Monthly)
- Monthly Collection
- Daily Collection
- Top Paying Customers
- Outstanding Aging (0-30, 31-60, 61-90, 90+ days)
- Payment Method Analytics
- Collection Forecast (Linear regression)

### Permissions

- Admin: Full access
- Accountant: Record payment, View all
- Manager: Record payment, View assigned
- Viewer: Read only

## Authentication

JWT Access Token

↓

Authentication Middleware

↓

Protected Routes

## API Design

REST API

JSON Responses

Consistent Response Format

## Design Principles

* SOLID
* DRY
* Separation of Concerns
* Modular Development
* Reusable Components
