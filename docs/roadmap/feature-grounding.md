# Roadmap: Feature-grounding panel + science-scout subagent

**Status:** proposed (2026-08-25) — captured from an architecture session; not started.

## Why

Tekio features encode physiological claims (recovery scoring, deload logic,
adaptation targets). Before implementing one, we want three grounds checked:
(1) solid science, (2) solid UX, (3) solid software architecture. Today that
grounding is ad-hoc; nothing built-in researches exercise-science literature
with any quality standards.

## What to build

**1. `science-scout` custom subagent** — `tekio-workspace/.claude/agents/science-scout.md`
(or inside the tekio repo if sessions run there). The only genuinely custom
agent of the three lenses: built-in Explore is codebase-only, general-purpose
has no domain standards.

- `description`: "Researches current exercise-science literature on performance
  and adaptation training. Use before designing any feature that encodes a
  physiological claim (recovery scoring, deload frequency, protein timing…)."
- `tools: WebSearch, WebFetch, Read` — research only, no write access.
- System prompt: evidence hierarchy (meta-analyses / systematic reviews > RCTs >
  cohort > mechanistic > expert opinion), demand effect sizes and populations,
  flag bro-science, check recency, and report as:
  claim → best evidence → confidence → what would change the conclusion.

**2. `feature-grounding` skill** — a tekio project skill that orchestrates the
panel when a feature with a physiological claim is being designed:

- Science ground → delegate to `science-scout`.
- Architecture ground → delegate to the built-in Plan agent.
- UX ground → apply frontend-design guidance in the main context.
- Gate: the skill's rule is "no feature encoding a physiological claim proceeds
  to implementation until all three grounds report."

## the personal knowledge base tie-in

When the scout surfaces durable life-knowledge (not feature trivia), drop the
finding into the user's own knowledge base for `/ingest` → `wiki/health/`. The agent is
tooling and stays in tekio; lasting conclusions are knowledge and flow to the OS.

## Acceptance

- Designing a feature like "adaptive deload frequency" triggers the skill, the
  scout returns a sourced evidence summary in isolated context, and the main
  session receives only the conclusions.
- The scout never edits files; the skill fires on relevance without being named.

## Notes

- Origin: 2026-08-25 session on restructuring agent-nest / plugin-first setup.
- Deliberately per-project (not in agent-nest): the persona is tekio-specific.
