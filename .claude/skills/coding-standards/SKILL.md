---
name: coding-standards
description: Provides coding standards, project setup requirements, linting configuration, and quality gates for software development. Preloaded by code-architect and full-stack-dev subagents.
user-invocable: false
---

# Coding Standards

## Project Setup Checklist

When initializing a new codebase:

```
[ ] Initialize project with appropriate tooling
[ ] Configure linting (ESLint/Prettier or equivalent)
[ ] Setup pre-commit hooks (husky + lint-staged)
[ ] Configure testing framework
[ ] Create CI pipeline
[ ] Setup .claude/settings.json with post-tool hooks
```

See [SETUP.md](SETUP.md) for detailed configuration.

## Code Quality Standards

### General Principles
- Write self-documenting code with clear naming
- Keep functions small and focused (< 50 lines)
- One responsibility per function/class
- Handle errors explicitly
- Avoid premature optimization

### Testing Requirements
- Unit tests for all business logic
- Integration tests for API endpoints
- Test edge cases and error paths
- Aim for >80% coverage on critical paths

## Quality Gates

Before any code task is complete:

```
[ ] npm run lint passes (or equivalent)
[ ] npm test passes
[ ] npm run build succeeds
[ ] No security warnings
[ ] Documentation updated if needed
```

## Framework-Specific Standards

See [FRAMEWORKS.md](FRAMEWORKS.md) for language/framework-specific patterns.
