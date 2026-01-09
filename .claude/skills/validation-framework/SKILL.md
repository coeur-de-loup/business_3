---
name: validation-framework
description: Provides frameworks for validating business hypotheses, testing implementations, and creating verification reports. Preloaded by qa-validator subagent.
user-invocable: false
---

# Validation Framework

## Business Validation

### Hypothesis Testing

For every major assumption:

1. **Hypothesis**: Clear statement of belief
2. **Evidence needed**: What would prove/disprove it
3. **Method**: How to gather evidence
4. **Threshold**: What level is sufficient
5. **Result**: Documented outcome

See [HYPOTHESIS.md](HYPOTHESIS.md) for detailed framework.

## Technical Validation

### Code Validation Checklist

```
[ ] All tests pass
[ ] Coverage > 80% on critical paths
[ ] No linting errors
[ ] Build succeeds
[ ] No security vulnerabilities
[ ] API contracts verified
[ ] Performance acceptable
```

### Validation Report Template

```markdown
# Validation Report: [Feature/Hypothesis]

## Summary
- **Status**: PASS / FAIL / PARTIAL
- **Date**: YYYY-MM-DD
- **Validator**: [agent name]

## What Was Validated
[Description]

## Methodology
[How validation was performed]

## Results
[Detailed findings]

## Issues Found
[Problems discovered]

## Recommendations
[Next steps]
```

## Validation Stages

See [STAGES.md](STAGES.md) for stage-by-stage validation criteria.

## Pivot Triggers

Consider pivoting when:
- Problem validation fails (no real demand)
- Solution doesn't resonate after iterations
- Unit economics don't work
- Competition makes market unviable

Document all pivot decisions with rationale.
