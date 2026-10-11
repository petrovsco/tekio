// Tapping into a field puts the caret at the end of what is already there,
// wherever the tap landed, so a value is extended or backspaced rather than
// split. One listener on the document covers every input the app draws.
// A tap inside a field that already has focus is left to the browser, so the
// caret can still be placed mid-value on purpose.

// Types whose caret setSelectionRange can move. Number and email refuse it, so
// they get their value written back, which leaves the caret at the end.
const SELECTABLE = new Set(['text', 'search', 'url', 'tel', 'password'])
const REWRITE = new Set(['number', 'email'])

export function moveCaretToEnd(el: HTMLInputElement | HTMLTextAreaElement) {
  if (el.readOnly || el.disabled) return
  const value = el.value
  if (value === '') return
  if (el instanceof HTMLTextAreaElement || SELECTABLE.has(el.type)) {
    el.setSelectionRange(value.length, value.length)
  } else if (REWRITE.has(el.type)) {
    el.value = ''
    el.value = value
  }
}

export function caretAtEndOnFocus() {
  document.addEventListener('focusin', event => {
    const el = event.target
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return
    // The browser places the caret at the tap after focus fires; go after it.
    setTimeout(() => {
      if (document.activeElement === el) moveCaretToEnd(el)
    }, 0)
  })
}
