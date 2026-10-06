# Architecture assessment and findings report

System: [name] | Review date: [date] | Reviewer: [name]

## Executive decision
Recommended next step: [decision]
Business reason: [outcome / risk]
Confidence and limitations: [known evidence / unknowns]

## Scope and method
- Reviewed boundary and excluded systems:
- Stakeholders consulted:
- Evidence reviewed, with date and source:
- Assumptions requiring validation:

## Current architecture
[Insert component / dependency / data-flow diagram. Identify ownership, trust boundaries, external services, and deployment environments.]

## Assessment checklist
For each area, record **Evidence / Concern / Unknown / Next action**.

| Area | Questions |
|---|---|
| Business alignment | Do system priorities match business outcomes and expected growth? |
| Service boundaries | Are responsibilities and dependency ownership explicit? |
| APIs and integration | Are contracts versioned? Are retries, idempotency, timeouts, and failure handling defined? |
| Data | Are consistency, retention, migration, backup, and recovery requirements documented? |
| Security | Are identity, permissions, secrets, data protection, and trust boundaries appropriate? |
| Delivery | Are tests, deployment approvals, rollback, and environment differences understood? |
| Reliability | Are availability and recovery objectives defined and tested? |
| Observability | Can teams trace a user problem to its cause? Are alerts actionable? |
| Cost | Are major cost drivers, owners, budgets, and usage measures visible? |
| Maintainability | Are technical debt, operational toil, and key-person dependencies manageable? |

## Five priority findings
Repeat this section for findings 1–5:

### [Finding ID and title]
- Observation and evidence:
- Business / technical impact:
- Severity: [high / medium / low, with reason]
- Confidence: [verified / inferred / unverified]
- Recommended action:
- Alternatives and tradeoffs:
- Effort: [range, assumptions, and who must validate it]
- Dependencies and owner:
- Success measure:

## Recommended roadmap
Use `03-roadmap.csv`. Sequence improvements by risk reduction, business value, dependencies, and available capacity. Confirm estimated effort with the delivery team.

## Findings meeting
- Decisions agreed:
- Open questions and owners:
- Follow-up date:
- Implementation scope, if separately agreed:
