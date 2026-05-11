# thoughtworks-anthology-auditor

[![npm version](https://img.shields.io/npm/v/@ythalorossy/thoughtworks-anthology-auditor.svg)](https://www.npmjs.com/package/@ythalorossy/thoughtworks-anthology-auditor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/ythalorossy/thoughtworks-anthology-auditor/actions/workflows/ci.yml/badge.svg)](https://github.com/ythalorossy/thoughtworks-anthology-auditor/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

A [Claude](https://claude.com) skill that audits a codebase for code-quality smells and produces a severity-ranked Markdown report with concrete refactoring suggestions and `file:line` references.

> **Based on *The ThoughtWorks Anthology* (2008).** This skill encodes ideas from two essays in the book:
>
> - **"Object Calisthenics"** by Jeff Bay — nine rules of OO discipline (indentation depth, no `else`, primitive wrapping, Law of Demeter, no abbreviations, small entities, few instance variables, first-class collections, tell-don't-ask).
> - **"Domain Annotations"** by Erik Doernenburg — DDD purity, framework-coupling on domain classes, god `validate()` methods, classification by inheritance, hardcoded navigation paths.
>
> *The ThoughtWorks Anthology: Essays on Software Technology and Innovation*, ed. ThoughtWorks Inc., Pragmatic Bookshelf, 2008. ISBN 978-1-934356-14-2.

The skill diagnoses smells in plain code-review voice — it doesn't lecture readers about the framework.

## Install

```bash
npx -y @ythalorossy/thoughtworks-anthology-auditor
```

That installs the skill into `~/.claude/skills/thoughtworks-anthology-auditor/` so Claude (Claude Code and Cowork mode) can use it across all projects on your machine.

> The `-y` flag auto-confirms the first-time install prompt. On Windows in particular, that prompt can desync npx's bin shim resolution and produce a `'thoughtworks-anthology-auditor' is not recognized as an internal or external command` error — `-y` avoids it. Safe on macOS and Linux too.

### Options

| Flag | Behaviour |
|---|---|
| (default) | Install into `~/.claude/skills/` (user-level — available everywhere) |
| `--project`, `-p` | Install into `./.claude/skills/` in the current directory only |
| `--force`, `-f` | Overwrite an existing install |
| `--help`, `-h` | Show usage |

```bash
# project-local install
npx -y @ythalorossy/thoughtworks-anthology-auditor --project

# overwrite an existing version
npx -y @ythalorossy/thoughtworks-anthology-auditor --force
```

> **Note on `npx -i`.** `npx` doesn't have an `-i` flag — the right syntax is just `npx -y <package>`. If you've seen `npx -i` somewhere, that's a typo for `npm i` (which installs the package as a dependency, not what you want here).

## Use

After installing, Claude will auto-trigger the skill on phrases like:

- "audit this codebase"
- "review my code for OO smells"
- "is my domain model clean?"
- "find where my model is coupled to my framework"
- "tell me what's wrong with this class"

You can also invoke it explicitly in Claude Code:

```
/thoughtworks-anthology-auditor
```

The skill walks the codebase in five stages — inventory, OO-discipline checks, domain-purity checks, severity ranking, report writing — and produces a Markdown report saved to your working folder.

## What gets audited

| Check | Looks for |
|---|---|
| Nesting depth | Methods with 3+ levels of `if`/`for`/`switch` |
| `else` overuse | Long else-if chains, missing Strategy patterns |
| Primitive obsession | `String`/`int`/`decimal` standing in for domain types like `Email`, `Money`, `UserId` |
| Train wrecks | `a.b.c.d` reaches across class boundaries |
| Abbreviations | `mgr`/`svc`/`cfg` in public API surfaces |
| Class size | Domain classes > 300 LOC (critical), 100-300 (major) |
| Instance-variable count | 5+ fields forming an obvious data clump |
| First-class collections | `List<T>` with external `.filter(...).map(...)` doing domain logic |
| Tell, don't ask | Public getters/setters on domain classes driving external computation |
| Framework annotations | `@Entity`, `@Component`, `[Table]`, etc. on domain classes |
| God validators | `validate()` methods >50 LOC with uniform per-field rules |
| Classification by inheritance | `instanceof`/`is` dispatch for type categorization |

The report bundles findings by file (not by rule) and ranks them Critical/Major/Minor with a "Recommended next steps" section ranked by impact-to-effort.

## What it deliberately does NOT flag

- Generated code (lexers, ORM stubs, protobuf, OpenAPI clients)
- Framework-required boilerplate (Spring `@Configuration`, Django `Meta`)
- Test fixtures with intentionally unusual patterns
- One-off migrations and scripts
- DTOs and serialization records
- Anything under `vendor/`, `node_modules/`, `__generated__/`

## Layout of the installed skill

```
~/.claude/skills/thoughtworks-anthology-auditor/
├── SKILL.md                          # main skill prompt, triggers, workflow
├── references/
│   ├── object-calisthenics.md        # OO-discipline check guide, severity rubric
│   └── domain-annotations.md         # DDD-purity check guide
└── assets/
    └── report-template.md            # standardized report structure
```

## Uninstall

```bash
rm -rf ~/.claude/skills/thoughtworks-anthology-auditor
```

(or `./.claude/skills/thoughtworks-anthology-auditor` if you installed with `--project`).

## Repository

- Source: [github.com/ythalorossy/thoughtworks-anthology-auditor](https://github.com/ythalorossy/thoughtworks-anthology-auditor)
- Issues: [github.com/ythalorossy/thoughtworks-anthology-auditor/issues](https://github.com/ythalorossy/thoughtworks-anthology-auditor/issues)
- npm: [npmjs.com/package/@ythalorossy/thoughtworks-anthology-auditor](https://www.npmjs.com/package/@ythalorossy/thoughtworks-anthology-auditor)

## Contributing

Bug reports, feature requests, and pull requests are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community expectations.

For security issues, please follow the disclosure process in [SECURITY.md](./SECURITY.md) rather than opening a public issue.

## Releasing (maintainers)

```bash
# from the package root
npm login                                              # one-time, against npmjs.com
npm version patch                                      # or minor / major
npm publish                                            # scope is public via package.json
```

The `publishConfig.access` in `package.json` is already set to `public`.

To validate the tarball contents before publishing:

```bash
npm pack --dry-run
```

See [CHANGELOG.md](./CHANGELOG.md) for the release history.

## Acknowledgments

This skill would not exist without the writing in *The ThoughtWorks Anthology* (2008):

- **Jeff Bay**, "Object Calisthenics" — the nine rules of OO discipline that the audit's first stage operationalizes.
- **Erik Doernenburg**, "Domain Annotations" — the framework-coupling and god-validator detection that powers the audit's second stage.

Thanks also to the broader DDD community — Eric Evans, Vaughn Vernon, Martin Fowler — whose vocabulary (aggregate roots, value objects, anaemic domain model, primitive obsession, train wrecks) the audit reuses without re-defining.

## License

[MIT](./LICENSE) © Ythalo Saldanha.

The book *The ThoughtWorks Anthology* is © Pragmatic Bookshelf and its respective authors. This project does not redistribute the book's text; it implements an audit framework inspired by two of its essays.
