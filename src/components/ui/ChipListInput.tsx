import { useState } from 'react'
import { SmartInput } from './SmartInput'
import { Icon } from './Icon'

interface ChipListInputProps {
  items: string[]
  onChange: (items: string[]) => void
  suggestions: string[]
  placeholder: string
}

export function ChipListInput({ items, onChange, suggestions, placeholder }: ChipListInputProps) {
  const [input, setInput] = useState('')

  const add = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <SmartInput
          value={input}
          onChange={setInput}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input) } }}
          suggestions={suggestions.filter(s => !items.includes(s))}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="px-2.5 py-2 rounded-[3px] text-[11px] font-semibold border border-ink bg-white text-ink hover:bg-hairline cursor-pointer transition-colors"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-[3px] text-[11px] font-semibold border border-line bg-white text-ink"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(items.filter(x => x !== t))}
                aria-label={`Remove ${t}`}
                className="text-ink-3 hover:text-ink cursor-pointer"
              >
                <Icon name="close" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
