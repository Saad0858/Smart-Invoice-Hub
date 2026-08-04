# Frontend Integration Guide

## API Base URL

/api/v1

---

## Authentication

JWT Bearer Token

Authorization: Bearer <token>

---

## Response Format

{
    success: true,
    message: "",
    data: {}
}

---

## Error Format

{
    success: false,
    message: "",
    errors: []
}

---

## Pagination

?page=1
&limit=10

---

## Sorting

?sort=name
?order=asc

---

## Filtering

?search=cement

---

## Date Format

ISO 8601

---

## Currency

Indian Rupees

---

## GST

CGST

SGST

IGST