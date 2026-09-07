import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { FIELD } from './Input'
import { normaliseExerciseName } from '../../lib/exerciseName'
import type { ExerciseAlias } from '../../types'

interface SmartInputProps {
  value: string
  onChange: (val: string) => void
  suggestions: string[]
  /**
   * Other spellings that should find these suggestions (roadmap 044). Passed
   * only by the exercise pickers; a competitor or a sport name has no aliases,
   * so the list stays empty there and matching behaves as it always did.
   */
  aliases?: ExerciseAlias[]
  placeholder?: string
  className?: string
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

/** One row of the dropdown: what gets picked, and the spelling that found it. */
interface Match {
  name: string
  /** The alias that matched, when the typed text does not appear in the name. */
  via?: string
}

/**
 * Matching ignores case, punctuation and spacing, so "kb swing" and "KB-Swing"
 * both find the same movement. A suggestion is offered when the typed text is
 * inside its name, or inside any spelling that resolves to it.
 */
function match(suggestions: string[], aliases: ExerciseAlias[], typed: string): Match[] {
  const key = normaliseExerciseName(typed)
  const out: Match[] = []

  for (const name of suggestions) {
    if (name === typed) continue
    if (!key || normaliseExerciseName(name).includes(key)) {
      out.push({ name })
      continue
    }
    // Not in the name itself — is it in one of the name's other spellings?
    const nameKey = normaliseExerciseName(name)
    const via = aliases.find(
      a => normaliseExerciseName(a.canonicalName) === nameKey
        && normaliseExerciseName(a.alias).includes(key),
    )
    if (!via) continue
    // The label exists to explain a row that would otherwise look like a
    // guess. A plural or a suffix ("Clapping Push-ups" for "Clapping Push-up")
    // explains nothing, so those rows just appear, like any other match.
    const viaKey = normaliseExerciseName(via.alias)
    const obvious = viaKey.startsWith(nameKey) || nameKey.startsWith(viaKey)
    out.push(obvious ? { name } : { name, via: via.alias })
  }
  return out.slice(0, 8)
}

export function SmartInput({ value, onChange, suggestions, aliases = [], placeholder, className = '', onFocus, onBlur, onKeyDown }: SmartInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = match(suggestions, aliases, value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={`relative min-w-0 ${className}`}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); onFocus?.() }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={FIELD}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full top-full mt-1 bg-white border border-ink rounded-[3px] overflow-hidden">
          {filtered.map(m => (
            <button
              key={m.name}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(m.name); setOpen(false) }}
              className="w-full text-left px-2.5 py-2 text-xs text-ink hover:bg-hairline cursor-pointer transition-colors"
            >
              {m.name}
              {m.via && (
                // Say why this row is here, so picking it never feels like a
                // guess the app made on its own.
                <span className="text-ink-2"> · matched <i>{m.via}</i></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
