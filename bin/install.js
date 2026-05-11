#!/usr/bin/env node
/**
 * thoughtworks-anthology-auditor — installer
 *
 * Copies the bundled skill/ directory into:
 *   - ~/.claude/skills/thoughtworks-anthology-auditor/    (default)
 *   - ./.claude/skills/thoughtworks-anthology-auditor/    (with --project)
 *
 * Usage:
 *   npx -y @ythalorossy/thoughtworks-anthology-auditor
 *   npx -y @ythalorossy/thoughtworks-anthology-auditor --project
 *   npx -y @ythalorossy/thoughtworks-anthology-auditor --force
 *   npx -y @ythalorossy/thoughtworks-anthology-auditor --help
 *
 * The `-y` flag auto-confirms the first-time install prompt. It avoids a
 * known Windows-only issue where the prompt desyncs npx's bin shim
 * resolution and cmd.exe errors with "'thoughtworks-anthology-auditor'
 * is not recognized as an internal or external command".
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'thoughtworks-anthology-auditor';
const SOURCE_DIR = path.join(__dirname, '..', 'skill');

const args = process.argv.slice(2);
const flags = {
  project: args.includes('--project') || args.includes('-p'),
  force: args.includes('--force') || args.includes('-f'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  printHelp();
  process.exit(0);
}

main().catch((err) => {
  console.error(`\n  ${color('red', 'error')}  ${err.message}\n`);
  process.exit(1);
});

async function main() {
  if (!fs.existsSync(SOURCE_DIR) || !fs.statSync(SOURCE_DIR).isDirectory()) {
    throw new Error(
      `Bundled skill directory not found at ${SOURCE_DIR}. ` +
        'The package may be corrupted — try reinstalling.'
    );
  }

  const baseDir = flags.project
    ? path.resolve(process.cwd(), '.claude', 'skills')
    : path.join(os.homedir(), '.claude', 'skills');

  const targetDir = path.join(baseDir, SKILL_NAME);

  console.log(`\n  ${color('cyan', 'thoughtworks-anthology-auditor')}  installing skill...\n`);
  console.log(`  ${dim('source')}  ${SOURCE_DIR}`);
  console.log(`  ${dim('target')}  ${targetDir}`);

  if (fs.existsSync(targetDir)) {
    if (!flags.force) {
      throw new Error(
        `${targetDir} already exists. Re-run with --force to overwrite.`
      );
    }
    console.log(`  ${dim('note')}    overwriting existing install (--force)`);
    rmrf(targetDir);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  copyDir(SOURCE_DIR, targetDir);

  const installed = listFiles(targetDir).length;
  console.log(`\n  ${color('green', '✓')}  installed ${installed} file(s)\n`);
  console.log(`  Use it in Claude Code by invoking the skill, e.g.:`);
  console.log(`    ${dim('/' + SKILL_NAME)}`);
  console.log(
    `  or by asking Claude to "audit my code" / "review for code smells" in a session.\n`
  );
}

function copyDir(src, dst) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function rmrf(target) {
  // fs.rmSync is available from Node 14.14+
  fs.rmSync(target, { recursive: true, force: true });
}

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

function isTTY() {
  return Boolean(process.stdout && process.stdout.isTTY);
}

function color(name, text) {
  if (!isTTY()) return text;
  const codes = { red: 31, green: 32, yellow: 33, cyan: 36 };
  const c = codes[name];
  return c ? `\x1b[${c}m${text}\x1b[0m` : text;
}

function dim(text) {
  return isTTY() ? `\x1b[2m${text}\x1b[0m` : text;
}

function printHelp() {
  console.log(`
  thoughtworks-anthology-auditor — install the skill into your Claude config

  Usage:
    npx -y @ythalorossy/thoughtworks-anthology-auditor [options]

  Options:
    --project, -p    Install into ./.claude/skills (current working directory)
                     instead of ~/.claude/skills (user level, default).
    --force, -f      Overwrite an existing install at the target location.
    --help, -h       Show this help.

  Examples:
    npx -y @ythalorossy/thoughtworks-anthology-auditor
    npx -y @ythalorossy/thoughtworks-anthology-auditor --project
    npx -y @ythalorossy/thoughtworks-anthology-auditor --force
  `);
}
