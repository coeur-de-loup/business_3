# SMB AI Orchestration Platform

A unified B2B SaaS platform that enables small businesses to consolidate AI tools and automate workflows without coding.

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4+
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (Upstash)
- **Authentication:** NextAuth.js
- **State Management:** React Query + Zustand
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel (app) + Supabase (database)

## 📋 Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

## 🏗️ Project Structure

```
app/
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
├── .github/workflows/     # CI/CD pipelines
├── .env.example           # Environment variables template
└── package.json
```

## 🛠️ Getting Started

### 1. Clone and Install Dependencies

```bash
# Navigate to app directory
cd app

# Install dependencies
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Required: DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY
```

### 3. Set Up Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (create database)
pnpm prisma:migrate

# (Optional) Seed database with sample data
pnpm prisma:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test              # Run once
pnpm test:watch        # Watch mode

# E2E tests (Playwright)
pnpm test:e2e          # Run all E2E tests
pnpm test:e2e:ui       # Run with UI

# Type checking
pnpm type-check

# Linting
pnpm lint              # Check linting
pnpm lint:fix          # Fix linting issues

# Formatting
pnpm format:check      # Check formatting
pnpm format            # Format code
```

## 🗄️ Database Management

```bash
# View database in Prisma Studio
pnpm prisma:studio

# Push schema changes to database (development only)
pnpm db:push

# Pull schema from existing database
pnpm db:pull

# Create a new migration
pnpm prisma:migrate
```

## 🏗️ Build & Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Vercel Deployment

The project is configured for Vercel deployment. Push to `main` branch to deploy automatically.

Environment variables must be configured in Vercel dashboard.

## 📦 Key Dependencies

### Core
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety
- `prisma` - Database ORM
- `next-auth` - Authentication

### State & Data
- `@tanstack/react-query` - Server state
- `zustand` - Client state
- `react-hook-form` - Form management
- `zod` - Schema validation

### Infrastructure
- `@upstash/redis` - Serverless Redis
- `@upstash/ratelimit` - Rate limiting
- `bcryptjs` - Password hashing

### Development
- `eslint` - Linting
- `prettier` - Formatting
- `vitest` - Unit testing
- `@playwright/test` - E2E testing

## 🔒 Security

- All secrets stored in environment variables
- Credentials encrypted at rest (AES-256)
- HTTPS/TLS for all connections
- Rate limiting on API endpoints
- Row-level security in database

## 📚 Documentation

- [Architecture](../docs/technical/architecture.md)
- [Tech Stack](../docs/technical/tech-stack.md)
- [Database Schema](../docs/technical/database-schema.md)
- [API Spec](../docs/technical/api-spec.md)
- [Infrastructure](../docs/technical/infrastructure.md)

## 🚦 CI/CD

GitHub Actions runs on every push and PR:

1. **Lint** - ESLint checks
2. **Type Check** - TypeScript compilation
3. **Test** - Unit and integration tests
4. **Build** - Production build
5. **E2E** - End-to-end tests (PRs only)

## 📝 Coding Standards

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier (100 char line width)
- **Linting:** ESLint with Next.js config
- **Imports:** Absolute imports (`@/` alias)
- **Components:** Function components with hooks
- **Files:** kebab-case for files, PascalCase for components

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Create a pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions, contact the development team.
