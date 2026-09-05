# AGENTS.md

## Repository purpose

This repository contains reusable, cross-agent skills for practical DDD and related TypeScript engineering workflows.

Keep the skills portable. Model names, model-specific prompting tricks, repository-specific implementation rules, and vendor-specific behavior do not belong in the portable skill instructions.

## Skill authoring

- Keep `SKILL.md` focused on the workflow, trigger conditions, essential constraints, and guidance the agent actually needs to execute the task.
- Assume the agent already understands general software engineering. Do not spend tokens reteaching generic concepts unless the skill needs a non-standard interpretation.
- Put detailed domain guidance, catalogs, API notes, schemas, and extended examples under `references/` and load them only when relevant.
- Keep references one level deep from `SKILL.md`. Link every reference directly from `SKILL.md` and state when it should be read.
- Do not duplicate the same guidance between `SKILL.md`, references, or this file. Keep one source of truth.
- Use `scripts/` for deterministic or repeatedly implemented operations where executable tooling is more reliable and token-efficient than prose.
- Keep skill names lowercase and hyphenated. The skill folder name must match the `name` in YAML frontmatter.
- Make each skill `description` explicit about both what should trigger it and, when useful, what should not.
- Keep skills generic. Project-specific aliases, repository paths, reviewer names, Jira rules, deployment commands, or local architecture exceptions belong in the consuming repository's instructions.
- Library- or framework-specific reusable conventions may live in their own focused skill when they apply across projects using that dependency. Prefer a dependency-triggered skill over bloating a generic skill with conditional vendor rules.

## Cross-agent compatibility

- Treat `SKILL.md`, `references/`, `scripts/`, and `assets/` as the portable skill contract.
- Prefer `.agents/skills/<skill-name>/` as the repository-local installation path when the consuming agent supports it.
- Vendor-specific metadata may live under `agents/`, but it must not be required to understand or execute the skill.
- `agents/openai.yaml` is OpenAI product metadata, not agent instructions. Keep it limited to UI/interface metadata and update it when the skill's purpose or triggering behavior materially changes.
- Do not put current model names or version-specific assumptions into a skill unless the skill explicitly exists to target that model or version.

## Repository conventions

- Do not revert unrelated user changes.
- Do not commit directly to `main`; use a branch for changes.
- Use conventional commits with gitmoji.
- Prefer small, coherent changes over broad rewrites that mix unrelated concerns.

Examples:

```text
feat(skills): ✨ Add a reusable engineering workflow
fix(skills): 🐛 Correct a broken reference
refactor(skills): ♻️ Reduce duplicated skill guidance
docs(skills): 📝 Clarify cross-agent installation
```

## Validation

Before handing off a skill change:

1. Verify every `SKILL.md` has valid YAML frontmatter with matching `name` and folder name.
2. Verify every referenced file exists and no guidance is duplicated unnecessarily.
3. Keep `SKILL.md` concise and move detailed material to `references/` when progressive disclosure is appropriate.
4. If `agents/openai.yaml` exists, verify all strings are quoted, `short_description` is concise, and `default_prompt` explicitly mentions `$<skill-name>`.
5. Verify the README lists every shipped skill and reflects the current repository layout.
6. Run the skill validation tooling available in the environment when present.
