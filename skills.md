# Skills And Document Referencing Guide

This file defines the best-practice way to use the Markdown documents in this workspace so requirements stay consistent as the project evolves.

## Purpose

Use this guide whenever you are:

- planning work
- writing implementation notes
- making product or UX decisions
- adding features
- updating architecture
- checking whether a change matches the intended scope

The goal is simple: every important decision should trace back to the right source document.

## Source Of Truth Order

When documents overlap, use this precedence order:

1. `technicalrequirements.md`
2. `prd.md`
3. `tasks.md`
4. `tinyfishdocs.md`
5. `README.md`

### Why this order

- `technicalrequirements.md` is the implementation-level source of truth for stack, architecture, integration shape, and engineering constraints.
- `prd.md` is the source of truth for product intent, user value, UX principles, visual direction, and functional scope.
- `tasks.md` is the current execution checklist and should reflect the work implied by the PRD and technical requirements.
- `tinyfishdocs.md` is the operational reference for how TinyFish should be used inside this project.
- `README.md` is the onboarding summary and should stay aligned with the other documents, not override them.

If two docs conflict, do not guess. Update the lower-priority doc to match the higher-priority one, or explicitly record the discrepancy before proceeding.

## What Each Document Should Be Used For

### `README.md`

Use for:

- quick project overview
- local setup
- route and API inventory
- newcomer orientation

Do not use it as the only source for feature requirements or architecture decisions.

### `prd.md`

Use for:

- product vision
- target users and personas
- user-facing value
- feature intent
- page-level UX and design goals
- success metrics

When a decision affects experience, tone, trust, or feature purpose, reference `prd.md`.

### `technicalrequirements.md`

Use for:

- framework and stack choices
- backend/frontend responsibilities
- TinyFish integration model
- data flow
- security rules
- implementation constraints

When a decision affects code structure, infrastructure, data handling, or delivery shape, reference `technicalrequirements.md`.

### `tasks.md`

Use for:

- current sequencing
- build phases
- outstanding implementation items
- delivery checkpoints

`tasks.md` should describe execution, not redefine the product.

### `tinyfishdocs.md`

Use for:

- TinyFish API and CLI usage
- prompt structure for web-agent tasks
- SSE result handling
- best practices for site-by-site extraction
- parallel-run strategy

When building or refining browser-agent flows, this is the reference doc to cite.

## Best Practices For Referencing Requirements

### 1. Reference the most specific doc available

Pick the document closest to the decision:

- feature purpose or UX behavior: `prd.md`
- engineering implementation: `technicalrequirements.md`
- build sequencing: `tasks.md`
- TinyFish orchestration details: `tinyfishdocs.md`
- basic setup: `README.md`

### 2. Prefer explicit requirement language

When writing tickets, code comments, implementation notes, or summaries, reference requirements in direct language such as:

- "Per `technicalrequirements.md`, TinyFish is the primary remote browser layer."
- "Per `prd.md`, the Results page should preserve the cinematic glass Bento Grid direction."
- "Per `tinyfishdocs.md`, each independent website should run in a separate TinyFish job."

This is better than vague wording like "the docs say" or "based on the spec."

### 3. Keep product intent and implementation intent separate

Do not mix:

- user-facing "why" from `prd.md`
- engineering "how" from `technicalrequirements.md`

A clean pattern is:

1. cite `prd.md` for the intended experience
2. cite `technicalrequirements.md` for the delivery mechanism

Example:

- Product requirement: OpenVoyage should surface live "Ground Truth" signals from open-web sources.
- Technical requirement: this should be implemented using TinyFish-backed scouts plus SSE/WebSocket-style streaming.

### 4. Treat `tasks.md` as derived work

If a task appears in `tasks.md` but is unsupported by the PRD or technical requirements, validate it before implementing.

If a requirement exists in `prd.md` or `technicalrequirements.md` but is missing from `tasks.md`, add it to the task plan rather than ignoring it.

### 5. Use TinyFish guidance only for TinyFish-specific decisions

`tinyfishdocs.md` should guide:

- how to form TinyFish goals
- how to request structured JSON
- how to separate independent runs
- how to interpret SSE output

It should not override core product or architectural requirements unless those project docs are updated to adopt a new TinyFish pattern explicitly.

## Key Requirements To Reuse Consistently

These are the highest-value requirements that should be referenced repeatedly across planning and implementation.

### Product requirements from `prd.md`

- OpenVoyage is an AI-native travel orchestrator for live-web discovery and execution.
- The experience should support hidden or API-blind transport sources such as ferries and KTM.
- Ground-truth validation from open-web/social sources is part of the product value, not an optional extra.
- The visual system is cinematic, premium, and glassmorphism-heavy rather than generic dashboard UI.
- The experience is built around five major surfaces:
  - Gateway
  - Signal Stream
  - Concierge Brief
  - Execution Portal
  - Live Sentry

### Technical requirements from `technicalrequirements.md`

- Next.js 14+ App Router is the application framework.
- TinyFish is the primary agent infrastructure for remote browser orchestration.
- Agent logic is centered on `browser-use` plus an LLM layer.
- Real-time agent visibility should be delivered through SSE or WebSockets.
- Session continuity should be preserved through stored browser session identifiers.
- Payment completion must keep a human confirmation step.

### Delivery requirements from `tasks.md`

- Intent parsing comes first.
- TinyFish scout integration follows as the core execution layer.
- Streaming agent logs is an early milestone, not a late enhancement.
- The UI should be built in stages that mirror the product narrative.

### TinyFish usage requirements from `tinyfishdocs.md`

- Use one clear target website per run where possible.
- Ask for explicit JSON output shapes.
- Split independent websites into separate runs.
- Use the completion event and `resultJson` as the primary structured output.

## Suggested Referencing Pattern

When documenting any meaningful feature, use this four-part pattern:

1. Requirement source
2. Requirement summary
3. Implementation consequence
4. Open gap, if any

Example:

```md
Requirement source: technicalrequirements.md
Requirement summary: TinyFish is the primary remote browser orchestration layer.
Implementation consequence: Search and execution routes should call a TinyFish-backed service rather than local browser automation.
Open gap: Session persistence still needs Redis wiring.
```

## Change Management Rules

When updating docs:

- update the highest-priority source first
- then update dependent docs to match
- avoid introducing new requirements in `README.md` or `tasks.md` without reflecting them upstream
- keep TinyFish usage examples aligned with the current integration strategy

Recommended flow for document changes:

1. Update `technicalrequirements.md` or `prd.md`
2. Sync `tasks.md`
3. Sync `README.md`
4. Sync `tinyfishdocs.md` if the integration pattern changed

## Anti-Drift Checklist

Before finalizing a change, verify:

- the feature still matches the PRD intent
- the implementation still matches the technical requirements
- the delivery step exists in `tasks.md` or is newly added there
- TinyFish usage still follows `tinyfishdocs.md`
- the README still describes the project accurately at a high level

## Practical Rule Of Thumb

If you are unsure which document to cite:

- cite `prd.md` for user value
- cite `technicalrequirements.md` for build decisions
- cite `tasks.md` for sequencing
- cite `tinyfishdocs.md` for agent-browser usage
- cite `README.md` only for setup and orientation

## Summary

The best way to keep this project coherent is to treat the documents as a layered system:

- `prd.md` explains what OpenVoyage should be
- `technicalrequirements.md` explains how it should be built
- `tasks.md` explains what should be done next
- `tinyfishdocs.md` explains how TinyFish should be used correctly
- `README.md` explains how to enter and run the project

When future work references requirements directly and consistently, the repo will stay much easier to build, review, and extend.
