# Error Handling

Every API must return a consistent error response.

## Validation Errors

Return HTTP 422

## Authentication Errors

Return HTTP 401

## Authorization Errors

Return HTTP 403

## Resource Not Found

Return HTTP 404

## Duplicate Resource

Return HTTP 409

## Internal Error

Return HTTP 500

---

Every error response should include:

- success
- message
- errors
- timestamp
- requestId
- path

Never expose stack traces in production.