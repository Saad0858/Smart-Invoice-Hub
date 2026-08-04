# API Standards

## Base URL

/api/v1

---

## API Versioning

All APIs must be versioned.

Example

/api/v1/products

---

## Authentication

Authorization: Bearer <JWT>

---

## Success Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

## Error Response

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [],
  "timestamp": "",
  "path": ""
}
```

---

## Pagination

?page=1&limit=20

---

## Searching

?search=steel

---

## Sorting

?sort=name

?order=asc

---

## Filtering

?status=ACTIVE

---

## HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error