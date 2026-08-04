# BillFlow ERP - Backend

Production-ready backend for GST Billing & Invoice Management System built with Node.js, Express, TypeScript, Prisma, and PostgreSQL (Supabase).

## 🏗️ Architecture

```
src/
├── config/         # Environment & database configuration
├── controllers/    # HTTP request/response handlers
├── services/       # Business logic layer
├── repositories/   # Database operations
├── routes/         # Route definitions & registration
├── middlewares/    # Cross-cutting concerns
├── validators/     # Zod validation schemas
├── schemas/        # Shared response schemas
├── interfaces/     # TypeScript contracts
├── constants/      # Application constants
├── types/          # Shared TypeScript types
├── utils/          # Helper functions
├── swagger/        # OpenAPI documentation
├── app.ts          # Express application setup
└── server.ts       # Server entry point with graceful shutdown
```

### Design Principles
- **Repository → Service → Controller** pattern
- **SOLID** principles
- **Separation of Concerns**
- **Type-safe** with strict TypeScript
- **Enterprise-grade** error handling & logging

## 🚀 Quick Start

### Prerequisites
- Node.js 22 LTS
- PostgreSQL (Supabase recommended)
- npm 10+

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# DATABASE_URL, JWT_SECRET, etc.

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`
- Health Check: `http://localhost:3000/health`
- API Docs: `http://localhost:3000/api-docs`
- API Base: `http://localhost:3000/api/v1`

## 📦 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format with Prettier |
| `npm run test` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:migrate:prod` | Deploy migrations (prod) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:push` | Push schema to database |
| `npm run seed` | Seed database with sample data |

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `API_PREFIX` | API version prefix | /api/v1 |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:5173 |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | Access token expiry | 7d |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 30d |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |
| `LOG_LEVEL` | Winston log level | info |
| `LOG_FORMAT` | Morgan log format | combined |

## 📚 API Endpoints

### Health
```
GET /health              # Basic health check
GET /health/detailed     # Detailed health with DB & memory
```

### API Versioning
All endpoints are prefixed with `/api/v1`

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/resource",
  "requestId": "uuid"
}
```

### Pagination
```
?page=1&limit=20&sort=createdAt&order=desc&search=term
```

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Configured for frontend origin
- **Compression** - Gzip response compression
- **Rate Limiting** - Ready for implementation
- **JWT** - Stateless authentication (skeleton)
- **bcrypt** - Password hashing
- **Request ID** - Traceability header

## 📝 Code Quality

- **ESLint** - TypeScript-aware linting
- **Prettier** - Consistent formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks
- **Jest** - Unit & integration testing

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
open coverage/lcov-report/index.html
```

## 🚢 Deployment

### Docker
```dockerfile
# Build
docker build -t billflow-backend .

# Run
docker run -p 3000:3000 --env-file .env billflow-backend
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (64+ chars)
- [ ] Configure `DATABASE_URL` for production DB
- [ ] Set up SSL/TLS termination
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring & logging
- [ ] Run `npm run prisma:migrate:prod`
- [ ] Run `npm run build`

## 📁 Project Structure Details

### Core Modules (Implemented)
- ✅ Configuration management
- ✅ Database connection (Prisma singleton)
- ✅ Express app with middleware
- ✅ Global error handling
- ✅ Async error wrapper
- ✅ 404 handler
- ✅ Health endpoints
- ✅ Swagger/OpenAPI documentation
- ✅ Request validation middleware
- ✅ Route registration system
- ✅ Centralized response utility
- ✅ Structured logging (Winston)
- ✅ Request ID tracking
- ✅ Graceful shutdown
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier + Husky

### Upcoming Modules
- 🔄 Authentication (JWT, refresh tokens)
- 🔄 Products CRUD
- 🔄 Customers CRUD
- 🔄 Invoice management
- 🔄 Reports & analytics
- 🔄 Company settings
- 🔄 PDF generation
- 🔄 File uploads

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'feat: add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request

### Commit Convention
```
feat:     New feature
fix:      Bug fix
refactor: Code restructuring
docs:     Documentation
style:    Formatting
test:     Tests
chore:    Maintenance
```

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Team

Built by BillFlow Team for manufacturing companies needing GST-compliant billing.