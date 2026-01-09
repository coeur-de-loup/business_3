---
name: architecting-systems
description: Designs system architecture, selects technology stacks, creates API specifications, and plans database schemas. Use when making technology decisions or designing technical structure.
context: fork
agent: code-architect
---

# Architecting Systems

Delegates technical architecture to the code-architect subagent.

## When to Use

- Designing system architecture
- Selecting technology stacks
- Creating API specifications
- Planning database schemas
- Defining infrastructure

## Expected Outputs

Technical specifications saved to `docs/technical/`:
- `architecture.md` - System overview and component diagram
- `tech-stack.md` - Technology choices with rationale
- `database-schema.md` - Data models and relationships
- `api-spec.md` - API endpoints and contracts
- `infrastructure.md` - Hosting, deployment, CI/CD plan

## Quality Criteria

Architecture must include:
- Documented decisions with rationale
- Consideration of failure modes
- Observability planning
- Security by design
- Infrastructure as code approach
