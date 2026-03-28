# AGENTS.md

## Context7 Documentation Rule

Always use Context7 whenever library or API documentation may help complete the task, even if the user does not explicitly ask for it.

Use Context7 by default for:

- library and framework documentation
- SDK and API reference lookups
- code generation based on library conventions
- setup and installation steps
- configuration and integration guidance
- version-specific syntax, migrations, and CLI usage

This applies to common tools as well as niche ones, including examples like React, Next.js, Prisma, Tailwind, Supabase, Tinybird, Stripe, Vercel, AWS, or any other library, framework, SDK, API, CLI, or cloud service.

## Required Workflow

1. Start with `resolve-library-id` unless the exact Context7 ID is already provided in `/org/project` format.
2. Choose the best match using exact name match, relevance, source reputation, snippet coverage, and benchmark score.
3. Call `query-docs` with the full user question.
4. Use the fetched documentation in the answer or implementation.

## When To Prefer Context7

Prefer Context7 over memory whenever the task involves:

- API syntax or method signatures
- current configuration options
- setup commands
- official examples
- migration steps
- library-specific debugging
- framework conventions

## When Context7 Is Not Required

Context7 is not required for:

- pure refactoring with no library-doc dependency
- business-logic debugging unrelated to external libraries
- generic programming concepts
- code review that does not depend on current library behavior

## Practical Rule

If there is any reasonable chance that current library or platform docs would improve accuracy, use Context7 automatically without waiting for the user to ask.
