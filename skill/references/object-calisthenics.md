# OO Discipline — Audit Guide

Reference for the OO-discipline portion of the audit. The checks are heuristics, not laws — every flagged issue gets weighed against context. A 60-line DTO is fine; a 60-line piece of business logic is a problem.

The underlying source is Jeff Bay's nine "Object Calisthenics" rules. **The audit does not need to cite the rules in its output** — diagnose the smell in plain code-review voice. Mention a rule by name only when it materially helps the reader (e.g., naming "primitive obsession" once, not citing "Rule 3" four times).

## How to use this guide

For each file the audit walks, run through the checks in order. For each violation:

1. Note **file path, line range, severity, and a one-sentence remediation direction**.
2. Don't flag every occurrence — flag the worst two or three per file and note `(N more occurrences)`.
3. Weigh severity against context (see "Severity calibration" below).
4. Skip checks that don't apply to the language (see "Language adaptations").

The nine rules collectively target seven OO virtues: cohesion, loose coupling, zero duplication, encapsulation, testability, readability, focus. Eight of the nine target real encapsulation from different angles.

---

## Check 1 — One level of indentation per method

A method should do one thing at one level of abstraction. Nested control structures fold multiple responsibilities into a single body.

**Detection:** Methods with two or more levels of nested `if`, `for`, `while`, `switch`, or `try`.

**Severity:**
- *Critical* — 4+ nested levels in domain/business logic
- *Major* — 3 levels in non-trivial methods (>15 LOC)
- *Minor* — 2 levels in short methods, or any depth in test/generated code

**Remediation:** Extract the inner loop or branch into a named method. The new name will reveal what the inner block was actually doing.

**Don't flag:** switch tables that exhaust an enum; standard async/error-handling boilerplate (`try/finally`, `using`/`with`) that doesn't add real branching.

---

## Check 2 — Don't use `else`

`else` is "the lazy person's polymorphism" — it duplicates condition state and avoids type discovery.

**Detection:** `else` and `else if` keywords; chains of length ≥ 3 are red flags. Repeated `if (status == X)` shapes across multiple methods → strategy/polymorphism candidate.

**Three escape patterns to recommend:**
1. Guard clause + early return — for "handle the special case, then continue"
2. Ternary — for simple value selection
3. Polymorphism (Strategy, Null Object, subclass per case) — when the same condition recurs

**Severity:**
- *Critical* — same `if (type == X)` branching appears in 3+ methods (clear strategy-pattern omission)
- *Major* — long `else-if` chains (≥4 branches) in business logic
- *Minor* — single `if/else` blocks where a guard clause would read better

**Don't flag:** `else` in idiomatic exhaustive matches some languages require; `if/else` in test assertions; defensive null checks idiomatically using `else`.

---

## Check 3 — Wrap primitives and strings (primitive obsession)

Bare primitives carry no domain meaning. `bookFlight(int duration, int seats, int miles)` invites unit-mixup bugs; `bookFlight(Hour duration, SeatCount seats, Distance miles)` rules them out. The wrappers also become natural homes for behavior that would otherwise scatter.

**Detection:**
- Method parameters of primitive types in domain classes
- Multiple primitives of the same type in one signature (`int, int, int`, `String, String`)
- Stringly-typed identifiers (`String customerId`, `String status`)
- Primitive return types in domain methods that compute domain values

**Severity:**
- *Critical* — primitive obsession in core domain entities (`Money` as `BigDecimal`, `Email` as `String`, `UserId` as `long`)
- *Major* — recurring primitive type patterns across multiple domain methods
- *Minor* — primitives in non-domain code (DTOs, config, infrastructure)

**Remediation language (in plain voice):** "Wrap `<primitive>` representing `<concept>` in a value object. Behavior that currently scatters (validation, formatting, comparison) will gather inside the new type."

**Language adaptations:**
- TypeScript: branded types or template literal types
- Python: `dataclass(frozen=True)` or `NamedTuple`
- Go: named types (`type UserID int64`)

**Don't flag:** primitives at serialization boundaries (JSON DTOs, DB rows); stdlib calls that take primitives; very generic utilities.

---

## Check 4 — One dot per line (Law of Demeter)

`a.b.c.d` reaches across class boundaries. Either the calling object knows too much, or behavior is misplaced.

**Detection:** chains of length ≥ 3 (`obj.foo.bar.baz`); `.get*().get*().get*()` patterns; loops that traverse a chain to extract a value.

**Don't flag:**
- Fluent builders (`StringBuilder().append(...).append(...).build()`) — composition, not reaching
- Stream/LINQ pipelines (`users.filter(...).map(...).collect()`) — same shape but stage composition
- Immutable record dot-access for nested data (`event.payload.timestamp` in logging payloads)
- DI container boilerplate

**Severity:**
- *Critical* — train wrecks in domain logic, especially conditionals built on `a.b.c.d`
- *Major* — recurring length-3-4 chains in business logic
- *Minor* — single chains in test or scaffolding code

**Remediation:** "This chain reaches into `<distant type>`. Push the operation onto `<intermediate type>` so the caller asks one object to do something rather than walking a graph."

---

## Check 5 — Don't abbreviate

Abbreviations hide design problems. If you need `usrSvcMgr` to fit, the entity might be doing too much, or the context is being needlessly repeated.

**Detection:** identifiers with vowels removed (`mgr`, `svc`, `cfg`, `cnt`, `ctx`, `dlg`, `hdlr`); single-letter names outside small loop indices/lambda params; names that duplicate context (`OrderManager.createOrder()`, `UserUserId`).

**Severity:**
- *Major* — cryptic abbreviations in public API surfaces (class names, method signatures)
- *Minor* — abbreviations in private helpers, local variables, fixtures
- *Don't flag* — established standard abbreviations (`URL`, `HTTP`, `JSON`, `XML`, `IO`); language-canonical short names (`ctx` in Go, `cls` in Python class methods, `e` for exception/event)

---

## Check 6 — Keep entities small

Size is the easiest measurable proxy for "doing too much." Bay proposes ≤ 50 LOC per class and ≤ 10 files per package.

**Detection:** count non-blank, non-comment lines per class; count files per directory; method count per class as a secondary signal.

**Severity:**
- *Critical* — classes ≥ 300 LOC, especially in domain code
- *Major* — classes 100-300 LOC, OR packages ≥ 20 files
- *Minor* — classes 50-100 LOC, OR packages 10-20 files

**Language adaptations:** verbose languages (Java, C#) — 50-line cap is fair; concise languages (Python, Ruby, Kotlin) — closer to ~40 LOC; languages with required boilerplate (Java getters, C# property bodies) — discount 5-10 lines per ~10 fields.

**Don't flag:** generated files; test fixtures with many setup objects; configuration/registration classes (Spring config, DI wiring).

---

## Check 7 — Few instance variables per class

Bay's "max 2" is aggressive — in modern code, treat **5+ as a finding, 3-4 as a note**. A class with many fields almost certainly contains a missing class.

**Detection:** count fields/properties; look for **data clumps** — the same group of fields appearing across multiple classes (`firstName, middleName, lastName` in three places).

**Severity:**
- *Major* — ≥ 5 instance variables in domain code, especially when forming an obvious cluster
- *Minor* — 3-4 instance variables that form a cluster
- *Don't flag* — DTOs/value objects whose purpose is to carry several fields; configuration objects; builders mid-construction

**Remediation heuristic:** Pick any two fields, ask "would these make a class?" If yes, extract.

**Plain voice example:** "`firstName, middleName, lastName, suffix` co-occur and are formatted by hand in three places — likely a missing `Name` value object."

---

## Check 8 — First-class collections

A class containing a collection should contain *only* that collection. The wrapper becomes the home for filters, joins, and rules-over-each.

**Detection:** public `List<X>`, `Set<X>`, `Map<K,V>` fields exposed on domain classes with external code computing predicates on them (`users.stream().filter(...)`, `[u for u in users if ...]`); repeated filter/transform patterns across the codebase over the same collection type.

**Severity:**
- *Major* — domain classes with multiple collection fields and external loops doing domain logic
- *Minor* — single collection fields without much external logic

**Plain voice:** "`List<<T>>` is an under-specified primitive. Wrap it in `<TPlural>` and move the recurring filter/predicate methods inside."

**Don't flag:** internal collections used as caches/indexes; stdlib collections passed at infrastructure boundaries; test code.

---

## Check 9 — Tell, don't ask

If callers can read your data, they'll compute on it elsewhere — guaranteeing duplication and mislocation of behavior.

**Detection:** public getters/setters on domain classes; `if (x.getStatus() == DONE && x.getTotal() > limit)` — caller computing on getters; anaemic domain (pure data carriers, all logic in services).

**Severity:**
- *Critical* — entire anaemic domain layer (all entities are pure data, all logic in services)
- *Major* — domain entities with public mutable setters and external code mutating state
- *Minor* — read-only getters used in display/serialization

**Language adaptations:**
- Python/Ruby/JS: explicit getters/setters are unusual; the equivalent finding is "domain attributes accessed from outside the class for computation"
- Kotlin: `var` properties on domain classes ≈ Java setters; external `val` reads driving logic ≈ getters used externally
- Records / data classes: by design carry data publicly; flag only if used as full domain entities rather than value objects

**Plain voice example:** "Behavior at `<call site>` reads `<class>.<getter>` and decides what to do. Move the decision into `<class>` as a verb-named method."

**Don't flag:** DTOs, ViewModels, serialization records; generated accessors (Lombok `@Data`, Kotlin data classes, Python dataclass) **unless** they're being used for domain entities with non-trivial behavior.

---

## Severity calibration

The numeric thresholds above are starting points. Calibrate for context:

- **Domain code is judged more strictly than infrastructure code.** A 200-line `OrderProcessor` is a critical finding; a 200-line `OAuthFilter` may just be how that filter has to look.
- **Public API is judged more strictly than internals.** Abbreviations on a class name are worse than in a private helper.
- **Newer code is judged more strictly than legacy.** "If you touch this file again, here's the refactor" is more useful than demanding rewrites of 10-year-old stable code.
- **Test code gets more leeway.** Long setup methods, long `expect()` chains, and `else` branches in test assertions are usually fine.

When in doubt, prefer the lower severity.

---

## What NOT to flag

- Generated code (lexers, parsers, ORM stubs, protobuf, OpenAPI clients)
- Boilerplate the framework requires (Spring `@Configuration`, Django `Meta`, `__init__.py`)
- Tests of edge cases that intentionally use unusual patterns
- One-off scripts and migrations
- Files that explicitly opt out via comment markers like `// auditor: skip` or directories called `vendor/`, `node_modules/`, `__generated__/`

---

## Reporting reminders

- **Group findings by file**, not by rule. Readers fix one file at a time.
- **Lead with the worst.** A file with critical findings appears before one with only minors.
- **Combine multi-smell findings into a single narrative.** If one class has god-size + primitive obsession + getters, write one diagnosis paragraph, not three separate entries with rule citations.
- **Always suggest a refactoring direction** — a finding without a fix is unactionable.
- **Quote a small snippet** (3-5 lines) only when it materially clarifies. Use file:line references for jump targets.
- **Don't manufacture findings to look thorough.** A short report on a clean codebase is the right answer.
