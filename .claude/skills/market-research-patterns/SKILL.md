---
name: market-research-patterns
description: Provides frameworks and methodologies for market research, trend analysis, and opportunity validation. Preloaded by market-researcher subagent.
user-invocable: false
---

# Market Research Patterns

## Research Methodology

### 1. Trend Identification
- Search for emerging patterns in target markets
- Analyze growth trajectories and adoption curves
- Identify timing windows for market entry
- Look for problems getting worse, not better

### 2. Demand Validation
Evidence sources to check:
- Reddit/forum discussions (complaints, requests)
- Google Trends and search volume
- Competitor existence and funding
- Social media conversations

### 3. Competitive Analysis
Map existing solutions on:
- Feature completeness
- Pricing positioning
- Target customer segment
- Known weaknesses/gaps

### 4. Pain Point Discovery
Find where people express frustration:
- Support forums and help docs
- App store reviews
- Social media threads
- Industry publications

## Opportunity Scoring

Score each opportunity 1-5 on:

| Factor | Weight | Criteria |
|--------|--------|----------|
| Market Size | 25% | TAM, SAM, SOM estimates |
| Competition | 25% | Number, strength, moats |
| Timing | 20% | Trend direction, urgency |
| Feasibility | 30% | Can we build this? |

**Threshold**: Total score > 3.5 to proceed.

## Output Templates

See [TEMPLATES.md](TEMPLATES.md) for research document templates.

## Anti-Patterns

- Confirmation bias: seeking only supporting evidence
- Ignoring negatives: glossing over red flags
- Analysis paralysis: researching instead of validating
- Vanity metrics: focusing on impressive but irrelevant numbers
