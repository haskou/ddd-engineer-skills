# DDD Engineer Skills

Reusable Codex skills for practical Domain-Driven Design work.

The skill is intentionally generic. Project-specific rules belong in each
repository's `AGENTS.md`, not in this package.

It can be used without any mandatory runtime dependency, but it is recommended
alongside `@haskou/value-objects` when a project wants first-class value object
semantics.

## Skills

- `ddd-engineer`: DDD, SOLID, boundaries, value objects, aggregates,
  contracts, tests, naming, PR handoff, and review discipline.
- `haskou-value-objects`: TypeScript value-object usage, serialization,
  equality, primitive boundaries, and domain behavior discipline.
- `ddd-migration`: Incremental DDD migration planning and execution with
  durable migration state, target architecture, coherent slices, and staged
  validation.

## Install

Ask Codex to install the skills from this repository:

```text
Install the skills from github.com/haskou/ddd-engineer-skills
```

## Repository Layout

```text
AGENTS.md
skills/
  ddd-engineer/
    SKILL.md
    references/
      aggregates.md
      bounded-contexts.md
      contract-changes.md
      cqrs-read-models.md
      domain-events.md
      domain-modeling-decisions.md
      naming-rules.md
      pr-checklist.md
      repositories-transactions.md
      value-objects.md
  haskou-value-objects/
    SKILL.md
  ddd-migration/
    SKILL.md
    references/
      context-management.md
      discovery.md
      implementation-checklist.md
      migration-state-template.md
      roadmap.md
      target-architecture.md
    scripts/
      find-empty-dirs.sh
      init-migration-state.sh
      read-migration-state.sh
      scan-migration-seams.sh
      snapshot-structure.sh
      suggest-affected-checks.sh
```

## Updating

1. Read `AGENTS.md` before changing this repository.
2. Edit the relevant `skills/<skill-name>/SKILL.md` for core behavior.
3. Put detailed topic guidance under that skill's `references/` directory when
   the skill needs deeper progressive-disclosure material.
4. Keep the skill generic. Do not add project-specific aliases, tools, reviewer
   names, Jira rules, or repository-specific commands.
5. Copy or reinstall the skill in projects that should consume the update.
