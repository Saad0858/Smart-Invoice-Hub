# Business Rules

## Purpose

This document defines the business logic and validation rules for BillFlow ERP. These rules must always be enforced by the backend regardless of frontend validation.

---

# Authentication

- Only authenticated users can access protected APIs.
- Passwords must always be hashed using bcrypt.
- JWT authentication is used.
- Unauthorized requests must return HTTP 401.
- Forbidden requests must return HTTP 403.

---

# Product Rules

- Product Name is mandatory.
- Product Code / SKU must be unique.
- HSN Code is mandatory.
- GST Rate must be one of:

0%
5%
12%
18%
28%

- Selling Price must be greater than zero.
- Stock Quantity cannot be negative.
- Products cannot be permanently deleted if used in invoices.
- Soft delete should be preferred.

---

# Customer Rules

- Customer Name is mandatory.
- Mobile Number is mandatory.
- GST Number is optional.
- If GST Number exists, it must be unique.
- Email is optional but must be valid.
- Customer Code must be unique.
- PAN Number must be unique if provided.
- Credit Limit must be non-negative.
- Opening Balance and Current Balance track outstanding amounts.

---

# Invoice Rules

- Invoice Number must be auto-generated.
- Invoice Number cannot be edited.
- Every invoice must contain at least one item.
- Quantity must be greater than zero.
- Unit Price must come from Product Master.
- GST is calculated by backend.
- Grand Total is calculated by backend.
- Invoice PDF is generated after successful creation.
- Invoice history must never be lost.
- Invoice Items are immutable snapshots - they store product data at time of invoice creation.
- Invoice Number format: SIH-YYYY-NNNNNN (e.g., SIH-2026-000001)

---

# Payment Status Rules

- Every invoice has a payment status separate from invoice status.
- Payment Status values:
  - PENDING: No payment received
  - PARTIAL: Partial payment received
  - PAID: Full payment received
- Default payment status is PENDING.
- Payment status transitions:
  - PENDING → PARTIAL (when partial payment received)
  - PARTIAL → PAID (when remaining balance paid)
  - PENDING → PAID (when full payment received at once)
- Invoice can be GENERATED but still have PENDING payment status.
- CANCELLED invoices should not accept payments.

---

# Company Settings

- Company Name is mandatory.
- GST Number is mandatory.
- Address is mandatory.
- Logo is optional (stored as logoUrl).
- Bank Details are optional.
- UPI ID is optional.
- Primary Color defaults to #2563EB for branding.
- Invoice Prefix defaults to SIH.
- Next Invoice Number auto-increments per year.

---

# Audit

Every important operation should create an audit log.

Examples:

- Login
- Product Created
- Product Updated
- Customer Added
- Invoice Generated
- Invoice Cancelled
- Payment Received (updates payment status)
- PDF Generated