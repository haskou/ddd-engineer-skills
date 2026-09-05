# DDD Engineer Skills

Reusable Agent Skills for practical Domain-Driven Design and TypeScript engineering work.

The portable contract is the skill itself: `SKILL.md` plus optional `references/`, `scripts/`, and `assets/`. Vendor-specific metadata lives under `agents/` and is optional; it must not be required to understand or execute a skill.

Project-specific rules belong in each consuming repository's instructions, not in this package. Reusable library-specific conventions may live in focused skills that trigger only when the dependency or pattern is present.

The skills can be used without mandatory runtime dependencies. Focused skills activate only when their libraries or patterns are present, including `@haskou/value-objects`, `@haskou/flow`, and `@haskou/ddd-kernel` / `node-dependency-injection`.

## Skills

- `ddd-engineer`: DDD, SOLID, boundaries, value objects, aggregates, contracts, tests, naming, PR handoff, and review discipline.
- `ddd-migration`: Incremental DDD migration planning and execution with durable migration state, target architecture, coherent slices, and staged validation.
- `haskou-ddd-kernel`: Dependency-injection conventions for projects using `@haskou/ddd-kernel`, `node-dependency-injection`, generated `services.yaml`, or class-based container resolution.
- `haskou-flow`: TypeScript async coordination with `@haskou/flow`: concurrency, queues, rate limiting, timeouts, retries, cancellation, scheduling, and composition.
- `haskou-value-objects`: TypeScript value-object usage, serialization, equality, primitive boundaries, and domain behavior discipline with `@haskou/value-objects`.

## Install

### npx

Until the package is published to the npm registry, run it directly from GitHub:

```bash
npx github:haskou/ddd-engineer-skills install
```

That installs every packaged skill into the repository-local portable path:

```text
.agents/skills/
```

Install only selected skills by naming them:

```bash
npx github:haskou/ddd-engineer-skills install ddd-engineer haskou-value-objects
```

Install globally into `~/.agents/skills/`:

```bash
npx github:haskou/ddd-engineer-skills install --global
```

Update skills previously managed by the installer:

```bash
npx github:haskou/ddd-engineer-skills update
```

The installer records content hashes in `.agents/skills/.ddd-engineer-skills.json`. If a managed skill has local changes, `update` refuses to overwrite it. Use `--force` only when those changes should be discarded:

```bash
npx github:haskou/ddd-engineer-skills update --force
```

Once `@haskou/ddd-engineer-skills` is published to npm, the same commands can use the shorter package name:

```bash
npx @haskou/ddd-engineer-skills install
```

### Manual installation

You can still copy the desired skill directories into your agent's compatible skills location. For repository-local installation, prefer the portable path when supported:

```text
.agents/skills/
  ddd-engineer/
  ddd-migration/
  haskou-ddd-kernel/
  haskou-flow/
  haskou-value-objects/
```

Some agents also support vendor-specific skill directories. Prefer one canonical copy rather than maintaining divergent copies of the same skill.

For Codex, you can also ask it to install the skills from this repository:

```text
Install the skills from github.com/haskou/ddd-engineer-skills
```

## Repository layout

```text
AGENTS.md
bin/
  ddd-engineer-skills.mjs
src/
  cli.mjs
  installer.mjs
skills/
  ddd-engineer/
    SKILL.md
    agents/
      openai.yaml
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
  ddd-migration/
    SKILL.md
    agents/
      openai.yaml
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
  haskou-ddd-kernel/
    SKILL.md
    agents/
      openai.yaml
  haskou-flow/
    SKILL.md
    agents/
      openai.yaml
    references/
      api-reference.md
  haskou-value-objects/
    SKILL.md
    agents/
      openai.yaml
```

## Updating

1. Read `AGENTS.md` before changing this repository.
2. Edit the relevant `skills/<skill-name>/SKILL.md` for core workflow and triggering behavior.
3. Put detailed topic guidance under that skill's `references/` directory when progressive disclosure is appropriate.
4. Keep portable instructions vendor-neutral; put optional product metadata under `agents/`.
5. Keep `agents/openai.yaml` aligned with the corresponding `SKILL.md` when present.
6. Keep generic skills free of project-local rules. Put reusable dependency-specific behavior in a focused skill when it applies across projects using that stack.
7. Reinstall or run the installer update command in projects that should consume the change.
