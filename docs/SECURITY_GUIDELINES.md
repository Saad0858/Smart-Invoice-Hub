# Security Guidelines

## Authentication

JWT

## Password Hashing

bcrypt

## Environment Variables

Never commit secrets.

## Validation

Validate every request.

## SQL Injection

Always use Prisma ORM.

Never use string concatenation.

## XSS

Sanitize input.

## CORS

Allow configured origins only.

## Helmet

Must be enabled.

## Compression

Must be enabled.

## Logging

Sensitive information must never be logged.

## HTTPS

Required in production.

## Rate Limiting

Required for login APIs.