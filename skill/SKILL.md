---
name: thoughtworks-anthology-auditor
description: Audit a codebase for code-quality smells — OO design discipline, primitive obsession, train wrecks, anaemic domain, framework coupling, god validate methods, DDD purity — and produce a severity-ranked Markdown report with concrete refactoring suggestions and file:line references. Based on Object Calisthenics and Domain Annotations from *The ThoughtWorks Anthology* (2008). Use whenever the user asks for a code-quality review, OO design critique, code smell audit, "is my code clean?", domain-model assessment, DDD purity check, framework-coupling review, refactoring scan, or mentions Object Calisthenics, primitive obsession, train wrecks, Law of Demeter, anaemic domain models, or "tell don't ask". Trigger even when the user doesn't name these — phrases like "review my code for OO smells", "is my domain model clean", "find where my model is coupled to my framework", "tell me what's wrong with this class", "audit this codebase", or "what's the code quality like here" should activate this skill.
---

# Thoughtworks Anthology Auditor

A structured code-quality audit. The output is a focused Markdown report with severity-ranked findings and concrete refactoring suggestions.

The audit draws on two essays from *The ThoughtWorks Anthology* (2008): Jeff Bay's nine Object Calisthenics rules and Erik Doernenburg's Domain Annotations pattern. **The reader does not need to know these sources, and the report should rarely cite them.** The skill is a tool for diagnosing code; the references are scaffolding.

## When to use this skill

Trigger on any request to audit, review, or critique code quality. Cues include:

- Direct asks: "audit my code", "review this codebase", "find code smells"
- OO-design framing: "is this real OO?", "anaemic domain", "primitive obsession", "train wrecks", "tell don't ask"
- DDD framing: "is my domain model clean?", "framework coupling", "DDD purity"
- Implicit asks: "what's wrong with this class?", "how would you refactor this?"

If the user pointed at one file, audit it. If they pointed at a directory, **confirm scope** before walking large trees — auditing a 500-file repo unbidden wastes everyone's time.

## Voice and tone

Write the report as a senior engineer would write a code review. **Lead with the smell, not a rule citation.** Diagnose what's wrong and why it matters here, then suggest a refactoring direction. The chapter/rule names are internal scaffolding — mention a rule by name only when the reader genuinely benefits (e.g., "this is classic primitive obsession" once, not "Rule 3 violated" four times in one section).

Avoid:

- Headers like `**Rules violated:** Rule 1, 2, 4, 9` — they read like an exam answer key
- Repeating the framework's name (`Object Calisthenics says...`, `Per Chapter 09...`)
- Three-paragraph diagnoses for one-line problems
- Generic remediation phrases ("consider refactoring") — be specific about what to do

Aim for:

- One paragraph per finding (sometimes a tight bullet list, sometimes 2-4 sentences)
- A short before-snippet (3-5 lines) when it materially clarifies the issue
- A one-paragraph fix that names the pattern (Strategy, value object, first-class collection) and points at concrete files/methods

## Length target

| Codebase size | Report target |
|---|---|
| Single file, ≤ 100 LOC | ~50-100 lines, often shorter |
| Small package, ≤ 10 files | 100-200 lines |
| Medium codebase, 10-50 files | 200-400 lines |
| Large codebase | 400-600 lines, with aggressive folding |

If you find yourself writing more than ~10 findings per file, you're over-reporting. **Fold repetitive violations** — twenty `else` branches in one file collapse to one entry that says "pervasive `else` use (~20 instances) — sweep with guard clauses or polymorphism."

## Audit workflow

The audit runs in five stages.

### Stage 1 — Scope and inventory

1. **Confirm scope** if the user pointed at a directory and the tree is large.
2. **Inventory the codebase** — list code files and identify primary language(s) using common signals: `pom.xml`/`build.gradle`/`.java`/`.kt` (JVM), `.csproj`/`.cs` (C#), `package.json`/`.ts`/`.tsx`/`.js` (TS/JS), `pyproject.toml`/`.py` (Python), `Gemfile`/`.rb` (Ruby), `go.mod`/`.go` (Go).
3. **Identify the domain layer if one exists** — look for `domain/`, `model/`, `entities/`, `core/` directories or `*.domain.*` package names. If there is no clear domain layer, note that and audit the whole codebase under OO-discipline rules; the framework-coupling check needs a domain layer to be meaningful.
4. **Note the framework stack** — Spring, Django, Rails, NestJS, ASP.NET, etc. Matters for the framework-coupling check.

### Stage 2 — Apply OO-discipline checks

Read `references/object-calisthenics.md` for the rule descriptions, severity rubric, language adaptations, and detection heuristics.

Walk inventoried code files in priority order — **largest files and the domain layer first**. For each file, identify the worst violations and skip the long tail. Don't be exhaustive — record the worst two or three findings per file and note `(N more occurrences)` if relevant.

### Stage 3 — Apply domain-purity checks

Read `references/domain-annotations.md` for framework-coupling detection, god `validate()` checks, and the decision framework.

This stage runs only if a domain layer exists. Key checks: framework annotations on domain classes, god `validate()` methods that should be annotation-driven, marker interfaces or inheritance used for classification, hardcoded navigation paths that recur across the model.

### Stage 4 — Severity-rank and de-duplicate

Before writing the report:

- **Group near-duplicates.** Twenty similar findings in one file → one entry with a count.
- **Rank by severity.** Critical findings genuinely matter; minor findings are stylistic. When in doubt, prefer lower severity.
- **Cull noise.** A 51-line DTO is fine. A flagged `else` in test code is noise. Drop or downgrade.

### Stage 5 — Write the report

Use `assets/report-template.md` as the structure. Always include:

- A specific executive summary (one paragraph naming the actual problems, not generic praise/criticism)
- A severity count table
- Three to five **headline findings** as a bulleted list at the top
- Per-section findings grouped by file (not by rule)
- A **recommended next steps** section with the top 3-5 highest-leverage refactorings
- A short methodology footer (what was audited, what was skipped)

Save the report to a `.md` file the user can keep — typically alongside the audited codebase or in their working folder. Provide a `computer://` link.

## Severity rubric (short form)

- **Critical** — likely to cause real maintenance pain or block evolution. God classes (>300 LOC), domain entities tightly coupled to ORM internals, anaemic domain with all data exposed via setters.
- **Major** — clear violation that hurts readability, testability, or extensibility. Train wrecks in business logic, classes 100-300 LOC, validation methods >50 LOC, primitive obsession in core types.
- **Minor** — style or discipline issue worth noting in passing. Single `else` clauses, classes 50-100 LOC, abbreviations in private helpers.

When in doubt, prefer the lower severity. The detailed rubric is in each reference file.

## Adapting to language

Some checks need adaptation across languages — full per-rule notes are in `references/object-calisthenics.md`. Quick reminders:

- Public-getter rules in Python/Ruby/JS translate to "domain attributes accessed from outside the class for computation" (the underlying "tell, don't ask" principle).
- The 50-line class cap is fair in verbose languages (Java, C#); equivalent is closer to 40 in Python/Ruby/Kotlin.
- Primitive-wrapping in TypeScript can use branded types; in Python, frozen dataclasses or NamedTuples; in Go, named types.

For framework coupling, the catalogue is per-stack — see `references/domain-annotations.md` for Spring, JPA, Django, NestJS, ASP.NET equivalents.

## What NOT to flag

- Generated code (lexers, ORM stubs, protobuf, OpenAPI clients)
- Framework-required boilerplate (Spring `@Configuration`, Django `Meta`, `__init__.py`)
- Test fixtures with intentionally unusual patterns
- Migrations and one-off scripts
- DTOs and serialization records — they're meant to be data carriers
- Files in `vendor/`, `node_modules/`, `__generated__/`

## Output expectations

- Always produce a `.md` report file (not just chat output) so the user can re-read, share, and act on it.
- Use file:line references that work as IDE jump targets (`src/foo/Bar.java:42`).
- Lead the executive summary with **what's actually wrong**, not a generic framing.
- End with concrete next steps ranked by impact-to-effort.
- Don't pad. A 50-line report on a clean codebase is the right answer; don't manufacture findings to look thorough.

## Reference files

- `references/object-calisthenics.md` — OO-discipline checks: rule guide, language adaptations, severity rubric
- `references/domain-annotations.md` — DDD-purity checks: framework-coupling catalogue, anti-pattern list
- `assets/report-template.md` — the standardized report structure
