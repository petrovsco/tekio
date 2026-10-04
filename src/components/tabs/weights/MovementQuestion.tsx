import { useState } from 'react'
import { Chip } from '../../ui/Chip'
import { FIELD_LABEL } from '../../ui/Input'
import { MOVEMENT_AREAS } from '../../../constants/movementQuestion'
import type { PatternKey } from '../../../constants/movementPatterns'

/**
 * RFC 0074: asked only for a name nothing knows — not on file, not an alias,
 * not in the catalogue. Two taps: a body area, then the movement, each named
 * with a lift it is like. The answer decides which muscles the new exercise
 * counts for. Skipping it still saves; the lift is then unmapped.
 */
export function MovementQuestion({ value, onChange }: {
  value: PatternKey | null
  onChange: (pattern: PatternKey | null) => void
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const area = picked ?? MOVEMENT_AREAS.find(a => a.choices.some(c => c.pattern === value))?.label ?? null
  const choices = MOVEMENT_AREAS.find(a => a.label === area)?.choices ?? []

  return (
    <div className="flex flex-col gap-2 px-2.5 py-2 bg-hairline rounded-[3px]">
      <div className="flex flex-col gap-0.5">
        <span className={FIELD_LABEL}>New exercise</span>
        <span className="text-[11px] text-ink-2 leading-snug">
          Which movement is it? It decides which muscles this lift counts for.
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {MOVEMENT_AREAS.map(a => (
          <Chip
            key={a.label}
            small
            active={a.label === area}
            onClick={() => { setPicked(a.label); onChange(null) }}
          >
            {a.label}
          </Chip>
        ))}
      </div>
      {choices.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {choices.map(c => {
            const on = c.pattern === value
            return (
              <button
                key={c.pattern}
                onClick={() => onChange(on ? null : c.pattern)}
                aria-pressed={on}
                className={`flex flex-col items-start text-left px-2 py-1.5 rounded-[3px] border cursor-pointer transition-colors ${
                  on ? 'bg-ink border-ink' : 'bg-white border-line hover:border-ink'
                }`}
              >
                <span className={`text-[11px] font-semibold ${on ? 'text-white' : 'text-ink'}`}>{c.label}</span>
                <span className={`text-[10px] leading-snug ${on ? 'text-white/80' : 'text-ink-3'}`}>like {c.like}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
