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
