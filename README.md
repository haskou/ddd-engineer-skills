# DDD Engineer Skills

Reusable Codex skills for practical Domain-Driven Design work.

The skill is intentionally generic. Project-specific rules belong in each
repository's `AGENTS.md`, not in this package.

It can be used without any mandatory runtime dependency, but it is recommended
alongside `@haskou/value-objects` when a project wants first-class value object
semantics.

## Skills

- `hasko-ddd-engineer`: DDD, SOLID, boundaries, value objects, aggregates,
  contracts, tests, naming, PR handoff, and review discipline.
- `haskou-value-objects`: TypeScript value-object usage, serialization,
  equality, primitive boundaries, and domain behavior discipline.

## Install

Ask Codex to install the skills from this repository:

```text
Install the skills from github.com/haskou/ddd-engineer-skill
```

## Repository Layout

```text
skills/
  hasko-ddd-engineer/
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
```

## Updating

1. Edit the relevant `skills/<skill-name>/SKILL.md` for core behavior.
2. Put detailed topic guidance under that skill's `references/` directory when
   the skill needs deeper progressive-disclosure material.
3. Keep the skill generic. Do not add project-specific aliases, tools, reviewer
   names, Jira rules, or repository-specific commands.
4. Copy or reinstall the skill in projects that should consume the update.
