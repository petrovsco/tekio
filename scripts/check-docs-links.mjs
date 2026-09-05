#!/usr/bin/env node
// Two checks the docs cannot run on themselves (roadmap 047).
//
//   node scripts/check-docs-links.mjs [root ...]
//     Dead relative links. Walks every .md under each root (a root that is a
//     file is checked as-is; default root: docs). Every markdown link target
//     that is not a URL or an in-page #fragment is resolved relative to the
//     file that holds it, and the ones that point at nothing are printed as
//     `file:line -> target`. Exit 1 when any are dead.
//
//   node scripts/check-docs-links.mjs --anchors <file.md>
//     Line anchors. For every link in <file.md> whose fragment is L<n> or
//     L<n>-L<m> (a link text ending `:<n>-<m>` widens the range the same way),
//     the target file is opened and the anchored line(s) are checked against
//     the row that holds the link: the row passes when one of its backticked
//     spans is on those lines (see `claims` below for what "on" means), is
//     unchecked when it has no backticked span, and fails otherwise.
//     Passing rows are silent. Failing and unchecked rows are printed with the
//     target line's text so a person can judge them. Exit 1 when any fail.
//
//   node scripts/check-docs-links.mjs --no-line-anchors <dir>
//     No line anchors in active briefs (roadmap 052). A brief links a file
//     and names the symbol, never a line: a line moves with every edit and
//     nothing re-checks it. Every .md directly under <dir> (not its
//     subdirectories — done/ is history) is scanned, and each link whose
//     fragment is L<n> is printed as `file:line -> target`. Exit 1 when any
//     are found.
//
// Node built-ins only. `npm run check:docs` runs all three;
// docs/roadmap/README.md says when.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Deliberately strict: it also matches prose that quotes the link syntax, and
// the fix for that is to reword the prose, not to loosen this (047). The link
// text is optional so a bare `](target)` still counts, and it excludes newlines
// so the match stays on the line that holds the target.
const LINK_RE = /(?:\[([^[\]\n]*))?\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const SKIP_DIRS = new Set(['node_modules', '.git']);

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');
const lineOf = (txt, index) => txt.slice(0, index).split('\n').length;

// Both checks hit the same few targets many times over, and each stat or read
// is slow on /mnt/c, so the answers are kept.
const seen = new Map();
const exists = (p) => {
  if (!seen.has(p)) seen.set(p, fs.existsSync(p));
  return seen.get(p);
};
const sources = new Map();
const readLines = (p) => {
  // null when the file does not exist.
  if (!sources.has(p)) {
    try {
      sources.set(p, fs.readFileSync(p, 'utf8').split(/\r?\n/));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      sources.set(p, null);
    }
  }
  return sources.get(p);
};

function walk(root, out = []) {
  const st = fs.statSync(root);
  if (st.isFile()) {
    out.push(root);
    return out;
  }
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(root, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

function deadLinks(roots) {
  const files = roots.flatMap((r) => walk(path.resolve(REPO, r)));
  let dead = 0;
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const m of txt.matchAll(LINK_RE)) {
      const target = m[2];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const abs = path.resolve(path.dirname(f), decodeURIComponent(target.split('#')[0]));
      if (!exists(abs)) {
        dead++;
        console.log(`${rel(f)}:${lineOf(txt, m.index)} -> ${target}`);
      }
    }
  }
  console.log(`${files.length} files, ${dead} dead`);
  return dead === 0;
}

const IDENT_RE = /(?<![A-Za-z0-9_])[A-Za-z_][A-Za-z0-9_]+/g; // `1RM` is not `RM`
const NUMBER_RE = /\d+(?:\.\d+)?/g;

const wholeWord = (w) => new RegExp(`(?<![A-Za-z0-9_])${w}(?![A-Za-z0-9_])`);
// `6` is not `16`, `0.6` or `x6`, but it is `6h` and `1RM` is `1` with a unit.
const wholeNumber = (n) => new RegExp(`(?<![A-Za-z0-9_.])${n.replace('.', '\\.')}(?![0-9.])`);

// Each backticked span on the row is one claim about the anchored lines. A span
// with identifiers (`PUSH_THRESHOLD = 33`, `cycle_length_weeks: CYCLE`) holds
// when any of them is there as a whole word; a span of bare numbers (`6`,
// `[1, 5]`) when all of them are there as whole tokens. One holding span passes
// the anchor — a row like `80` °C / `10` °C anchors each value separately.
function claims(row) {
  return [...row.matchAll(/`([^`]+)`/g)].flatMap(([, span]) => {
    const idents = span.match(IDENT_RE) ?? [];
    if (idents.length) return [{ span, test: (h) => idents.some((w) => wholeWord(w).test(h)) }];
    const numbers = span.match(NUMBER_RE) ?? [];
    if (numbers.length) return [{ span, test: (h) => numbers.every((n) => wholeNumber(n).test(h)) }];
    return [];
  });
}

function anchors(file) {
  const abs = path.resolve(REPO, file);
  const txt = fs.readFileSync(abs, 'utf8');
  const lines = txt.split('\n');
  const tally = { total: 0, passed: 0, failed: 0, unchecked: 0 };

  const report = (verdict, rowNo, target, note, targetLines) => {
    const row = lines[rowNo - 1].trim().slice(0, 100);
    console.log(`\n${verdict} @${rowNo} ${row}\n  -> ${target}   ${note}`);
    for (const l of targetLines) console.log(`     ${l}`);
  };

  for (const m of txt.matchAll(LINK_RE)) {
    const [, text, target] = m;
    const [p, frag = ''] = target.split('#');
    const am = /^L(\d+)(?:-L(\d+))?$/.exec(frag);
    if (!am || !p) continue;
    tally.total++;

    const rowNo = lineOf(txt, m.index);
    const from = Number(am[1]);
    let to = am[2] ? Number(am[2]) : from;
    // `[utils.ts:164-190](../src/lib/utils.ts#L164)` — the text carries the range.
    const tr = text && /:(\d+)-(\d+)$/.exec(text);
    if (tr && Number(tr[1]) === from) to = Math.max(to, Number(tr[2]));

    const src = readLines(path.resolve(path.dirname(abs), decodeURIComponent(p)));
    if (!src) {
      tally.failed++;
      report('FAIL', rowNo, target, 'missing file', []);
      continue;
    }
    const range = src.slice(from - 1, to);
    const shown = range.slice(0, 3).map((l, i) => `${from + i}: ${l.trim().slice(0, 110)}`);
    if (from > src.length) shown.push(`${from}: <<EOF>>`);
    const haystack = range.join('\n');

    const rowClaims = claims(lines[rowNo - 1]);
    if (!rowClaims.length) {
      tally.unchecked++;
      report('UNCHECKED', rowNo, target, 'row names no identifier or value', shown.slice(0, 1));
    } else if (rowClaims.some((c) => c.test(haystack))) {
      tally.passed++;
    } else {
      tally.failed++;
      const looked = rowClaims.map((c) => `\`${c.span}\``).join(', ');
      report('FAIL', rowNo, target, `none of ${looked} on line`, shown);
    }
  }

  console.log(
    `\n${tally.total} anchors, ${tally.passed} passed, ${tally.failed} failed, ${tally.unchecked} unchecked`,
  );
  return tally.failed === 0;
}

function noLineAnchors(dir) {
  const abs = path.resolve(REPO, dir);
  const files = fs
    .readdirSync(abs)
    .filter((n) => n.endsWith('.md'))
    .map((n) => path.join(abs, n));
  let found = 0;
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const m of txt.matchAll(LINK_RE)) {
      if (!/#L\d+/.test(m[2])) continue;
      found++;
      console.log(`${rel(f)}:${lineOf(txt, m.index)} -> ${m[2]}`);
    }
  }
  console.log(`${files.length} briefs, ${found} line anchors (name the symbol instead)`);
  return found === 0;
}

const [mode, ...rest] = process.argv.slice(2);
let ok;
if (mode === '--anchors') {
  if (!rest[0]) {
    console.error('usage: check-docs-links.mjs --anchors <file.md>');
    process.exit(2);
  }
  ok = anchors(rest[0]);
} else if (mode === '--no-line-anchors') {
  if (!rest[0]) {
    console.error('usage: check-docs-links.mjs --no-line-anchors <dir>');
    process.exit(2);
  }
  ok = noLineAnchors(rest[0]);
} else {
  ok = deadLinks(mode ? [mode, ...rest] : ['docs']);
}
process.exit(ok ? 0 : 1);
