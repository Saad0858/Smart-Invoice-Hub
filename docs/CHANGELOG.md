# Changelog

## Version 0.10.0 - Phase 10: Accounts Receivable (2024-08-05)

### Added
- **Payment Model** with auto-generated payment numbers, payment methods (CASH, UPI, BANK_TRANSFER, CHEQUE, CARD, OTHER), reference numbers, remarks, cancellation support
- **Invoice Model Extensions**: paidAmount, balanceAmount, paymentStatus, lastPaymentDate, paymentCount, creditDays, dueDate
- **PaymentStatus Enum**: UNPAID, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- **PaymentMethod Enum**: CASH, UPI, BANK_TRANSFER, CHEQUE, CARD, OTHER

### Payments Module
- POST /api/v1/payments - Record payment with automatic invoice updates
- GET /api/v1/payments - List payments with comprehensive filtering
- GET /api/v1/payments/:id - Get payment details
- PUT /api/v1/payments/:id - Update payment (adjusts invoice automatically)
- DELETE /api/v1/payments/:id/cancel - Cancel payment with reversal
- GET /api/v1/payments/invoice/:invoiceId - Invoice payment history
- GET /api/v1/payments/customer/:customerId - Customer payment history
- GET /api/v1/payments/statistics - Payment dashboard statistics
- GET /api/v1/payments/method-distribution - Payment method breakdown
- GET /api/v1/payments/collection-trend - Collection trend analysis

### Ledger Module
- GET /api/v1/ledger/customer/:customerId - Running customer ledger
- GET /api/v1/ledger/customer/:customerId/statement - Printable statement
- GET /api/v1/ledger/aging - Outstanding aging report

### Outstanding Module
- GET /api/v1/outstanding - Outstanding invoices with filters
- GET /api/v1/outstanding/summary - Outstanding summary with top customers
- GET /api/v1/outstanding/aging - Aging report (0-30, 31-60, 61-90, 90+)
- GET /api/v1/outstanding/overdue - Overdue invoices
- GET /api/v1/outstanding/collection-efficiency - Collection rate & avg days
- GET /api/v1/outstanding/customer/:customerId - Customer outstanding

### AR Analytics
- GET /api/v1/analytics/ar/collection-trend - Collection trend
- GET /api/v1/analytics/ar/monthly-collection - Monthly collection
- GET /api/v1/analytics/ar/daily-collection - Daily collection
- GET /api/v1/analytics/ar/top-paying-customers - Top paying customers
- GET /api/v1/analytics/ar/outstanding-aging - Outstanding aging
- GET /api/v1/analytics/ar/payment-method-analytics - Payment method distribution
- GET /api/v1/analytics/ar/collection-forecast - Linear regression forecast

### Dashboard Integration
- Today's Collection
- Outstanding Amount
- Overdue Amount
- Collection This Month/Year
- Payment Method Distribution
- Average Collection Time

### Technical Implementation
- Repository Pattern for all modules
- Service Layer with Prisma Transactions
- Zod Validation for all endpoints
- Role-based permissions (Admin, Accountant, Manager, Viewer)
- Comprehensive Swagger/OpenAPI documentation
- Seed data: 10 invoices, 15 payments (partial, full, cancelled, overdue)

### Business Rules Enforced
- Invoice Created: paidAmount=0, balanceAmount=grandTotal, status=UNPAID
- Payment: Increase paidAmount, decrease balanceAmount
- Auto status: PAID (balance=0), PARTIALLY_PAID (balance>0)
- Overdue detection based on dueDate
- Cancellation reverses all calculations
- Validations: No overpayment, no payment on cancelled invoice, no negative amounts
- Reference number required for UPI/BANK_TRANSFER/CHEQUE

---

## Version 0.1.0

Initial project planning.

Completed:

* Documentation
* Architecture
* Technology selection
* Folder structure
* Development roadmap

---

Future versions will be documented here with all major changes, bug fixes, and new features.
