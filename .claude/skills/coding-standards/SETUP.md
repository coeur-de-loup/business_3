# Project Setup Guide

## JavaScript/TypeScript Projects

### 1. Initialize Project
```bash
npm init -y
# or
pnpm init
```

### 2. Install Dev Dependencies
```bash
npm install -D eslint prettier eslint-config-prettier typescript
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D husky lint-staged
npm install -D vitest @vitest/coverage-v8
```

### 3. Configure ESLint

Create `eslint.config.js`:
```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  }
);
```

### 4. Configure Prettier

Create `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 5. Setup Pre-commit Hooks

```bash
npx husky init
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

Create `.husky/pre-commit`:
```bash
npx lint-staged
```

### 6. Claude Code Post-Tool Hooks

Create `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix -- \"$CLAUDE_FILE\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### 7. Add Scripts to package.json

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint --fix",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "build": "tsc"
  }
}
```

### 8. Setup CI Pipeline

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## Python Projects

### 1. Initialize with uv
```bash
uv init
uv add --dev ruff mypy pytest pytest-cov
```

### 2. Configure pyproject.toml
```toml
[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W"]

[tool.mypy]
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
```

### 3. Pre-commit for Python
```bash
uv add --dev pre-commit
```

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```
