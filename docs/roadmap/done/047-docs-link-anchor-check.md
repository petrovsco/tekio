# Roadmap: Docs link and anchor check — put the 036 checker in `scripts/`

**Label:** infra
**Status:** done — 2026-09-05, v1.18.3: `scripts/check-docs-links.mjs`,
`npm run check:docs` and the README line shipped the same day the brief was
filed, straight after [036](036-grounding-inventory-stale-refs.md) closed,
because its acceptance check lived in a session scratchpad and was already gone.

## Log

- **2026-09-05 — shipped.** First run on the clean tree: 57 files, 0 dead
  links (`docs/` plus the four root-level READMEs); 74 anchors, 59 passed,
  10 failed, 5 unchecked. None of the 10 was drift — 036 had left every anchor
  right. Seven were the checker's own matching: a whole-token regex that
  rejected `DONATION_SUPPRESSION.acuteHours` because a dot followed the name,
  `1RM` read as the identifier `RM`, and rows with several anchors where each
  anchor indexes a different backticked span (`80` °C / `10` °C). Three were
  rows that did not name what sits on their line, reworded in the same commit
  so the check can read them: 1.11 now names `targets?.[meta.key]`, 9.4 names
  `r05`, and section 11's disclosure row names `revealedEx` next to `revealed`.
- **The rule is a little wider than "first backticked identifier".** Every
  backticked span on the row is one claim: a span with identifiers passes when
  any of them is on the anchored lines; a span of bare numbers when all of them
  are. The inventory's column is `Value`, not `Constant` — half its rows are
  numbers like `6`, and a first-identifier rule would have left them all
  unchecked. The five still unchecked are section 3's prescription rows, which
  have no backticks at all; they print, they do not fail.
- Link text such as `utils.ts:164-190` widens the anchored range the same way
  `#L164-L190` would, because that is how the inventory writes ranges.

## Goal

One command that answers two questions the docs cannot answer about themselves:

1. Does every relative link under `docs/` point at a file that exists?
2. Does every `path#L<n>` anchor in
   [docs/grounding-inventory.md](../../grounding-inventory.md) still land on the
   line its row describes?

Today both checks exist only as a throwaway node script rebuilt during 036.
The next brief that touches the inventory or moves a brief into `done/` will
rebuild it again, or skip it. Skipping it is how 036 found **25 dead links and
63 of 76 stale anchors** — none of them caught, because nothing ran.

## Which read does this sharpen?

None — this is tooling, not a surface. Doctrine §4.5 does not apply: no number
claiming physiological meaning is written, so no `## Grounding` block is
needed. It is deliberately **not** folded into
[023](../023-mechanical-code-quality-tooling.md): 023 is about code (ESLint,
dead code, a perf budget) and is already four items long; this is about docs,
is one afternoon of work, and can close on its own.

## Why the anchor check cannot be a plain link check

A line anchor is not a dead link. `test -e` and every off-the-shelf markdown
link checker see `../src/constants/app.ts#L71` as "file exists, pass". But the
grounding comments above the constants grow with every scout run, pushing
every line below them down, and the anchor keeps pointing at the old number.
On 2026-09-05, 63 of the 76 anchors were off — every row that a previous brief
had not itself rewritten. Nobody had done anything wrong; there was simply no
check that read the target line.

So the anchor mode has to open the target file and read the line.

## Scope

1. **`scripts/check-docs-links.mjs`** — one file, node built-ins only, no
   dependencies. Two modes:

   - **Default (dead links).** Walk every `.md` under `docs/` (extra roots may
     be passed as arguments — `CLAUDE.md` and `README.md` at the repo root are
     worth including). Extract every markdown link target. Skip URLs (anything with
     a `scheme:`) and in-page `#fragment` links. Resolve the rest relative to
     the file that holds them and report each missing target as
     `file:line -> target`. Print a `N files, D dead` summary and **exit
     non-zero when D > 0**.

   - **`--anchors <md>` (line anchors).** For every link in the given file
     whose fragment matches `L<n>` or `L<n>-L<m>`, read the target file and
     take the row's first backticked identifier (the `Constant` column — e.g.
     `` `PUSH_THRESHOLD` ``). If that identifier appears on the target line or
     within the anchored range, the anchor passes silently. If it does not, or
     the row names no identifier, print the row, the anchor, and the target
     line's text so a person can judge it. Print a summary
     (`N anchors, P passed, F failed, U unchecked`) and **exit non-zero when
     F > 0**.

   That split is the honest shape of the data: most rows name the constant
   they index, so the check is mechanical there; the handful that point at a
   use-site or a comment line (5.3 "used at", 5.6 the deload badge) still get
   printed for reading rather than silently passed.

2. **`npm run check:docs`** runs the dead-link mode over `docs/` and then the
   anchor mode over the inventory. It does **not** join `npm run build` —
   the build is what Vercel runs, and a stale doc anchor must not block a
   deploy. It is the step you run before closing a brief.

3. **One line in [docs/roadmap/README.md](../README.md)**: run `npm run check:docs`
   before a brief moves into `done/`, because the move changes every relative
   path in it (that is where 14 of 036's 25 dead links came from).

## Out of scope

- Fixing what the check finds. On a clean tree today it should report zero on
  both modes (036 left it that way); if the first run disagrees, that is a
  finding for this brief's log, not silent scope.
- Links inside `src/` comments that point at docs. Rare, and a different tool.
- Rewriting anchors automatically. Repointing needs a person to read the row;
  the script's job is to say *which* rows, not to guess the new line.
- A pre-commit hook. The check is cheap, but a hook that fails on a doc edit
  while you are mid-unit is friction; a one-line convention in the README is
  enough for a single-user repo.

## Starting point

The script 036 used, verbatim. Rename to `.mjs`, swap `require` for `import`,
add the identifier match and the exit codes, and it is most of scope item 1.

```js
// Usage:
//   node linkcheck.cjs <docsDir>              -> dead relative link targets
//   node linkcheck.cjs --anchors <mdFile>     -> every path#L<n> anchor with the target line's text
const fs = require('fs');
const path = require('path');

const LINK_RE = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

function deadLinks(root) {
  const files = walk(root);
  let dead = 0;
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = LINK_RE.exec(txt))) {
      const t = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith('#')) continue;
      const p = t.split('#')[0];
      if (!p) continue;
      const abs = path.resolve(path.dirname(f), decodeURIComponent(p));
      if (!fs.existsSync(abs)) {
        dead++;
        const line = txt.slice(0, m.index).split('\n').length;
        console.log(`${path.relative(root, f)}:${line} -> ${t}`);
      }
    }
  }
  console.log(`${files.length} files, ${dead} dead`);
}

function anchors(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split('\n');
  let m;
  let n = 0;
  while ((m = LINK_RE.exec(txt))) {
    const t = m[1];
    const hash = t.indexOf('#');
    if (hash < 0) continue;
    const p = t.slice(0, hash);
    const a = t.slice(hash + 1);
    const am = /^L(\d+)(?:-L(\d+))?$/.exec(a);
    if (!am || !p) continue;
    n++;
    const rowLine = txt.slice(0, m.index).split('\n').length;
    const abs = path.resolve(path.dirname(file), p);
    const from = Number(am[1]);
    const to = am[2] ? Number(am[2]) : from;
    let out = [];
    if (!fs.existsSync(abs)) out.push('<<MISSING FILE>>');
    else {
      const src = fs.readFileSync(abs, 'utf8').split('\n');
      for (let i = from; i <= Math.min(to, from + 2); i++) {
        out.push(`${i}: ${(src[i - 1] ?? '<<EOF>>').trim().slice(0, 110)}`);
      }
    }
    const row = lines[rowLine - 1].trim().slice(0, 90);
    console.log(`\n@${rowLine} ${row}\n  -> ${p}#${a}\n     ${out.join('\n     ')}`);
  }
  console.log(`\n${n} line anchors`);
}

if (process.argv[2] === '--anchors') anchors(process.argv[3]);
else deadLinks(process.argv[2]);
```

Two things learned while using it, worth keeping:

- The link regex also matches prose that quotes the link syntax — 036's own
  brief tripped it, and so did the first draft of this one, twice. Reword the
  prose; do not loosen the regex.
- The inventory is one very long line per row. When 60+ anchors need
  repointing, a node script of exact `[old, new, count]` substring pairs that
  asserts each count and writes all-or-nothing is safer than one Edit per row,
  and it preserves line endings.

## Acceptance

- [x] `npm run check:docs` exists, reports zero dead relative targets on a clean
      tree, and exits non-zero when a link to a missing file is introduced.
- [x] The anchor mode walks every `#L<n>` anchor in the inventory, passes the
      rows whose identifier is on the target line, prints the rest, and exits
      non-zero when an identifier is missing from its target.
- [x] `docs/roadmap/README.md` names the check as the step before a brief
      moves into `done/`.
