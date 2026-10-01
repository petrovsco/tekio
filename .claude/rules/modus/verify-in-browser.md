<!-- managed by modus — edit the rule in the modus repo, not here -->

## Before committing/pushing a change the user can see

A passing build only proves the code compiles. It does not prove the feature
works. If the change touches anything a person can see or click, open the app
and check it before pushing.

**When this applies:** any change to UI, a user flow, a chart or visual, or a
number that gets rendered on screen. Skip it for docs-only, test-only, tooling,
or pure refactors with no visible effect — and say which one you're skipping and
why.

### How much to test

**Normal change — test the feature and what it's connected to.**
Walk the actual path a user takes to reach the change, then follow it one step
out: the screens that feed it and the screens that read it. If a value is logged
on one tab and displayed on another, check both. Do not click through the whole
app.

**Big, system-wide change — do a regression pass.**
Only when the change cuts across the app: a shared data model, a store, routing,
a global layout, an auth or config change, or anything touching most screens.
Then walk the main flows end to end, not just the one you edited.

If you are unsure which tier applies, it is the normal one.

### How

- Start the dev server (e.g. `npm run dev`), then drive it with the Playwright
  browser rather than describing what *should* happen.
- Take a screenshot of the changed area and say what you saw in the summary.
- Check the browser console for errors while you are there.

**Report honestly.** If you could not run it, say so plainly and say what is
therefore unverified. Never write "verified" for something you only reasoned
about.
