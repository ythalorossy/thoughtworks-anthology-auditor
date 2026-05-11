# Code Quality Audit Report

**Codebase:** `<path or repo name>`
**Audit date:** `<YYYY-MM-DD>`
**Scope:** `<what was audited — directory paths, exclusions, language assumed>`

---

## Executive summary

`<One concrete paragraph: name the actual problems and the actual strengths. Avoid "this codebase has some issues" filler — say what kind. Example: "OrderProcessor is the hot spot — a 5-deep nested process() method with stringly-typed status dispatch and a six-link Demeter chain. The Order class itself is anaemic with primitive obsession on money and IDs. The rest of the model is small and reasonable.">`

### Findings by severity

| Severity | OO discipline | Domain purity | Total |
|---|---|---|---|
| Critical | `<n>` | `<n>` | `<n>` |
| Major | `<n>` | `<n>` | `<n>` |
| Minor | `<n>` | `<n>` | `<n>` |

### Headline findings

1. `<one-line summary, with file ref>`
2. `<second>`
3. `<third>`

---

## Findings — OO discipline

`<If no findings, write "No significant findings." and skip subsections. Group findings by file, not by rule. Critical and Major get full treatment; Minor goes in a table.>`

### `<file path>:<line range>` — `<short title naming the actual problem>`

**Severity:** Critical | Major | Minor

`<2-4 sentences diagnosing what's wrong here and why it matters. Don't lead with rule citations. Talk about the smell.>`

```<language>
<3-5 line snippet showing the issue, when it materially helps>
```

`<One paragraph or a tight bullet list of the suggested refactoring direction. Name the pattern (Strategy, value object, first-class collection) when applicable. Point at concrete files/methods.>`

---

`<Repeat the above per file. If multiple smells live in one file, write one combined finding with a clear narrative — not three separate entries.>`

### Minor — summary table

| File:Line | Issue | Suggestion |
|---|---|---|
| `<path>:<line>` | `<one-line note>` | `<one-line suggestion>` |

---

## Findings — Domain purity

`<If the codebase has no domain layer, say so here. If no findings, say so and skip subsections.>`

### Domain layer identification

`<One paragraph: which directories/packages were treated as domain, what conventions identified them, what was skipped.>`

`<Then per-file findings, same structure as OO discipline section.>`

---

## Recommended next steps

The top `<3-5>` highest-leverage refactorings, ranked by impact-to-effort.

### 1. `<short title>`

**Affected files:** `<file refs>`
**Effort:** `<S/M/L>` · **Impact:** `<S/M/L>`

`<2-3 sentences: what to do and why this is the highest-leverage move.>`

### 2. `<short title>`
...

---

## Methodology

**Audited:** `<list of directories/files/languages walked>`
**Skipped:** `<generated code, vendored dependencies, test fixtures, etc.>`
**Limitations:** `<anything the auditor couldn't determine — e.g., dynamic dispatch made some checks impossible without runtime info>`

The audit framework draws on Object Calisthenics (Bay) and Domain Annotations (Doernenburg) from *The ThoughtWorks Anthology* (2008). Findings reflect the auditor's judgment; weigh them against project context.
