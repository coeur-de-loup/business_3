# Framework-Specific Patterns

## React/Next.js

### Project Structure
```
src/
├── app/              # Next.js app router
├── components/       # Reusable components
│   ├── ui/          # Primitive UI components
│   └── features/    # Feature-specific components
├── lib/             # Utilities, helpers
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── styles/          # Global styles
```

### Component Pattern
```tsx
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Testing
```tsx
// components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Node.js/Express

### Project Structure
```
src/
├── routes/          # API route handlers
├── controllers/     # Business logic
├── services/        # External service integrations
├── models/          # Data models
├── middleware/      # Express middleware
├── utils/           # Utilities
└── index.ts         # Entry point
```

### Error Handling
```typescript
// middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
  });
}
```

## Python/FastAPI

### Project Structure
```
src/
├── api/             # API routes
├── core/            # Config, security
├── models/          # Pydantic models
├── services/        # Business logic
├── db/              # Database
└── main.py          # Entry point
```

### Route Pattern
```python
# api/users.py
from fastapi import APIRouter, Depends, HTTPException
from models.user import User, UserCreate
from services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=User)
async def create_user(user: UserCreate, service: UserService = Depends()):
    return await service.create(user)
```

## Database Patterns

### Schema Design Principles
1. Normalize to 3NF unless performance requires denormalization
2. Use UUIDs for public-facing IDs
3. Always include created_at, updated_at timestamps
4. Soft delete (deleted_at) for recoverable data
5. Index frequently queried columns

### Migration Pattern
```sql
-- migrations/001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```
