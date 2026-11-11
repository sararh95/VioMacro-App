# VioMacro AI Provider Boundary

Status: Phase 1 structure guidance

VioMacro currently keeps AI provider calls behind Firebase Functions. Folder cleanup must preserve that boundary.

## Current Provider

Gemini remains the current provider for private-alpha scope.

Current AI surfaces include:

- meal-plan generation
- recipe image/PDF parsing
- recipe embedding generation
- semantic recipe search

Provider code lives in `functions/`, not frontend feature folders.

## Approval Gates

Do not perform any of these during folder-structure work:

- run live AI provider smoke tests
- change Gemini model IDs
- add OpenAI or another provider
- deploy Functions
- create Firestore vector indexes
- broaden semantic search beyond its current fallback behavior
- expose provider details in user-facing copy

## Frontend Boundary

Frontend code should call Firebase callable functions through service wrappers. It should not contain provider API keys, provider SDK clients, or direct model calls.

User-facing copy should remain provider-neutral unless the user explicitly asks to brand a provider.

## Future Provider Evaluation

If VioMacro later compares Gemini against another provider, use a separate research/evaluation lane with fixed recipe import fixtures, extraction scoring, cost notes, and latency notes. Do not combine provider evaluation with structural file moves.
