// Roadmap 023 item 1. Mechanical checks only — the things a reader cannot be
// relied on to catch and an LLM reviewer should never be asked to guess at.
// Judgement about whether code is *good* stays with /simplify and /code-review;
// this file only answers questions with one right answer.
//
// Deliberately permissive at the start: the goal was a baseline that passes on
// the tree as it stands, not a week of cleanup. Tighten a rule when a real bug
// gets through it, not on principle.
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  {
    // Build output, dependencies, and the Deno edge functions — those run on a
    // different runtime with different globals and are linted by Deno, not here.
    ignores: ['dist', 'node_modules', 'supabase/functions', 'scripts/garmin-sync'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Fast Refresh only works when a module exports components and nothing
      // else. A warning, not an error: several files here deliberately export a
      // component beside its types.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // `_` prefix is the agreed "deliberately unused" marker — an unused
      // binding without one is a leftover.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Supabase rows arrive untyped and the app narrows them at the edges;
      // `any` there is honest. Flag it so it stays visible without failing.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Node scripts and config files: Node globals, not browser ones.
    files: ['scripts/**/*.mjs', '*.config.{js,ts}', 'middleware.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Two known exceptions, scoped to the one file each so the rule keeps
    // protecting new code — quarantined, not forgiven.
    files: ['src/components/ui/EditModal.tsx'],
    // Ten forms do `saveRef.current = save` in the render body so the shared
    // modal footer can call the active form's save. Mutating a ref during
    // render is the thing this rule exists to stop. Already tracked: candidate
    // S1 of roadmap 048 replaces exactly this with a `useSave(saveRef,
    // onClose)` hook, and acting on it is out of scope for 023 by name.
    rules: { 'react-hooks/refs': 'warn' },
  },
  {
    files: ['src/components/tabs/AssistantSettings.tsx'],
    // Seeds two editable fields from async-loaded status. Setting state in an
    // effect is the ordinary way to do that; the alternative is a `key` or the
    // adjust-during-render dance, neither clearer here.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  {
    // Tests get the Vitest globals and are allowed to be blunt.
    files: ['src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
)
