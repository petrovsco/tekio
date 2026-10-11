import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { caretAtEndOnFocus, moveCaretToEnd } from '../lib/caretAtEnd'

// Tapping into a field lands the caret at the end of its value.

beforeAll(() => caretAtEndOnFocus())
afterEach(() => { document.body.innerHTML = '' })

function field(html: string) {
  document.body.innerHTML = html
  return document.body.firstElementChild as HTMLInputElement | HTMLTextAreaElement
}

describe('caret at end', () => {
  it('moves a text caret to the end on focus', async () => {
    vi.useFakeTimers()
    const el = field('<input type="text" value="Bench press">')
    el.focus()
    el.setSelectionRange(2, 2) // where the tap landed
    vi.runAllTimers()
    vi.useRealTimers()
    expect(el.selectionStart).toBe(11)
    expect(el.selectionEnd).toBe(11)
  })

  it('covers textareas', () => {
    const el = field('<textarea>a note</textarea>')
    el.setSelectionRange(0, 0)
    moveCaretToEnd(el)
    expect(el.selectionStart).toBe(6)
  })

  it('keeps a number value intact', () => {
    const el = field('<input type="number" value="82.5">')
    moveCaretToEnd(el)
    expect(el.value).toBe('82.5')
  })

  it('leaves read-only fields and dates alone', () => {
    const ro = field('<input type="text" value="fixed" readonly>')
    ro.setSelectionRange(1, 1)
    moveCaretToEnd(ro)
    expect(ro.selectionStart).toBe(1)
    const date = field('<input type="date" value="2026-10-11">')
    moveCaretToEnd(date)
    expect(date.value).toBe('2026-10-11')
  })

  it('does nothing once focus has moved on', () => {
    vi.useFakeTimers()
    const el = field('<input type="text" value="Squat">')
    el.focus()
    el.setSelectionRange(1, 1)
    el.blur()
    vi.runAllTimers()
    vi.useRealTimers()
    expect(el.selectionStart).toBe(1)
  })
})
