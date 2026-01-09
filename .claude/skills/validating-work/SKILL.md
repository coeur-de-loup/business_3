---
name: validating-work
description: Tests implementations, validates business assumptions, verifies deliverables, and creates validation reports. Use when testing code, checking implementations, or validating business hypotheses.
context: fork
agent: qa-validator
---

# Validating Work

Delegates testing and validation to the qa-validator subagent.

## When to Use

- Testing code implementations
- Validating business assumptions
- Verifying deliverable quality
- Running acceptance tests
- Creating validation reports

## Expected Outputs

Validation reports saved to `docs/validation/`:
- `test-results.md` - Test execution results
- `validation-report.md` - Findings and status
- `issues-found.md` - Issues requiring attention

## Quality Criteria

Validation must include:
- Clear PASS/FAIL status
- Specific reproduction steps for failures
- Evidence supporting conclusions
- Suggested fixes when possible
