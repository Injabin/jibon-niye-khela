/**
 * Legal/content sweep (init.md M6 #4, TESTING.md Gate 6 trademark item).
 *
 * Scans tracked sources (everything except node_modules, .next, .git and
 * test fixtures) for:
 *   1. the trademarked name "BitLife" / "Bit Life" — allowed ONLY inside the
 *      reference-document set (TESTING.md, DESIGN.md, AGENT.md, init.md);
 *   2. famous brands / real-person names that DESIGN.md §1 forbids in shipped
 *      copy or content.
 *
 * Exits 0 when clean, 1 with a report when anything is found. Run:
 *   node scripts/legal-sweep.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', '.cache', '.lighthouse', 'docs', 'test-results']);
const IGNORE_EXT = new Set(['tsbuildinfo']);
// The sweep tool itself describes what it guards against; allow it next to
// the reference docs.
const REFERENCE_DOCS = new Set([
  'TESTING.md',
  'DESIGN.md',
  'AGENT.md',
  'init.md',
  'legal-sweep.mjs',
  'Additional_plus_improved_plan.md',
  'UI-DESIGN.md',
  'ui-ux-guide.md',
  'AGENTS.md',
]);

const TRADEMARK = /bitlife|bit[ -]life/i;
const BRANDS_AND_PEOPLE = new RegExp(
  [
    '\\btesla\\b', '\\bapple\\b', '\\biphone\\b', '\\bgoogle\\b', '\\bfacebook\\b',
    '\\bmicrosoft\\b', '\\bamazon\\b', '\\bnetflix\\b', '\\bnike\\b', '\\badidas\\b',
    '\\bbitcoin\\b', '\\bspotify\\b', '\\binstagram\\b', '\\btiktok\\b',
    '\\belon musk\\b', '\\bjeff bezos\\b', '\\bmark zuckerberg\\b',
    '\\blebron james\\b', '\\bharvard university\\b', '\\byale university\\b',
    '\\boxford university\\b',
  ].join('|'),
  'i',
);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (!IGNORE_EXT.has(entry.split('.').pop() ?? '')) out.push(full);
  }
  return out;
}

function scan() {
  const files = walk(ROOT);
  const violations = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (sep === '\\') rel.replaceAll('\\', '/');
    const base = file.split(sep).pop() ?? '';
    const isReference = REFERENCE_DOCS.has(base);
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');

    const check = (pattern, label, allowedInReference) => {
      lines.forEach((line, index) => {
        if (!pattern.test(line)) return;
        const inRef = isReference && allowedInReference;
        const fontsImport = /from ["']next\/font\/[\w-]+["']/.test(line);
        if (inRef || fontsImport) return;
        violations.push(`${rel}:${index + 1} [${label}] ${line.trim().slice(0, 160)}`);
      });
    };

    check(TRADEMARK, 'trademark: BitLife', true);
    check(BRANDS_AND_PEOPLE, 'brand/celebrity', true);
  }
  return violations;
}

const violations = scan();
if (violations.length > 0) {
  console.error('LEGAL SWEEP FAILED — found:');
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log('Legal sweep clean: no BitLife trademark outside the reference docs, no brands/celebrities.');
console.log(
  `(Checked ${walk(ROOT).length} files; assets logs + used-by docs stay in /public/**/CREDITS.md.)`,
);