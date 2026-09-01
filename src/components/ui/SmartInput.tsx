import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { FIELD } from './Input'

interface SmartInputProps {
  value: string
  onChange: (val: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function SmartInput({ value, onChange, suggestions, placeholder, className = '', onFocus, onBlur, onKeyDown }: SmartInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(value.toLowerCase()) && s !== value
  ).slice(0, 8)

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
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}
              className="w-full text-left px-2.5 py-2 text-xs text-ink hover:bg-hairline cursor-pointer transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
