<!-- managed by modus — edit the rule in the modus repo, not here -->

## Before committing/pushing

- Run the project's **full build** (e.g. `npm run build` → `tsc -b` + bundler), not
  just `npm run typecheck`. The build is the source of truth for "does this ship."
- Only commit/push once the build passes.
- Adapt the command to the stack (e.g. `cargo build`, `go build ./...`,
  `mvn package`) — the principle is "run the same thing the deploy runs."
