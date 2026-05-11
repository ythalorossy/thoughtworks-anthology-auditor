# Contributing

Thanks for considering a contribution. This is a small project — a single skill packaged for npm — so the contribution surface is narrow but real: the audit prompt itself (`skill/SKILL.md`), the two reference guides under `skill/references/`, the report template under `skill/assets/`, and the installer at `bin/install.js`.

## Ways to help

- **Report a false positive or false negative.** If the skill flagged something it shouldn't have, or missed something it should have, open an issue with a minimal code snippet and the audit output you got vs. the one you expected.
- **Improve the rule descriptions.** The reference guides under `skill/references/` are the skill's memory. If a rule's heuristics are too loose, too strict, or unclear in a given language, a PR that sharpens them is welcome.
- **Add language adaptations.** The skill already adapts checks across Java, C#, TypeScript, Python, Ruby, Go, and Kotlin. If you write a language that's underrepresented, edit the "Language adaptations" sections to add it.
- **Fix the installer.** Bug reports against `bin/install.js` (failures on Windows paths, permission errors, weird Node versions) are welcome.

## Workflow

1. **Open an issue first** for anything bigger than a typo fix or a small rule tweak. A short discussion before the PR usually saves time.
2. **Fork the repo** and create a topic branch off `main`: `git checkout -b fix/installer-windows-path` or `improve/python-rule-7`.
3. **Make your change.** Keep PRs focused — one rule edit per PR rather than a sweeping rewrite. If you're rewriting a reference guide, post the diff in the issue first.
4. **Run the smoke test locally** (see below) to confirm the installer still works.
5. **Open a PR** against `main`. The PR template will prompt for context.

## Local development

```bash
# clone
git clone https://github.com/ythalorossy/thoughtworks-anthology-auditor.git
cd thoughtworks-anthology-auditor

# verify installer syntax
node -c bin/install.js

# smoke-test against a throwaway HOME directory
TMP=$(mktemp -d)
HOME="$TMP" node bin/install.js
find "$TMP/.claude" -type f      # should list 4 files
rm -rf "$TMP"

# verify the tarball that npm would publish
npm pack --dry-run
```

The package has zero runtime dependencies — Node's stdlib only. If you find yourself reaching for an npm package, push back on it first. The installer is intentionally minimal so it stays reviewable in one screen.

## Editing the skill itself

The skill is three Markdown files (`SKILL.md`, two reference guides) plus a template. There is no build step.

When you change `SKILL.md`'s `description:` front-matter, **be specific about triggers** — the description is what Claude pattern-matches against to decide whether to invoke the skill. Vague descriptions cause both false-positive activation and false-negative misses. Use the same shape as the existing description: lead with what the skill does, then list trigger phrases.

When you change a reference guide, keep the severity rubric and "What NOT to flag" sections honest. Inflating severity makes the report look like an exam answer key, which is what the skill explicitly tries to avoid.

## Commit style

- Imperative-mood subject lines under 72 characters: "Fix installer path handling on Windows", not "fixed the installer".
- Reference the issue in the commit message if there is one: `Closes #12`.
- Squash if your branch has noise; otherwise leave commits as-is.

## Code review

I'll usually respond within a few days. If a week goes by with no response, ping the PR — it's not deliberate.

PRs that touch the audit rules will get more scrutiny than PRs that touch the installer; the skill's behaviour is what users feel.

## Questions

For anything that doesn't fit an issue, open a [discussion](https://github.com/ythalorossy/thoughtworks-anthology-auditor/discussions) (once enabled) or email ysaldanha@checkbook.org.
