import { useState, useMemo, type ReactNode } from 'react'
import { EmptyMsg } from './Card'
import { Inp, SelEl } from './Input'
import { Icon } from './Icon'

/** Show this many records before collapsing the rest. */
const PREVIEW = 3
/** Show date + category filters once the total record count exceeds this. */
const FILTER_AT = 30

interface Props<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  /** Returns the 'YYYY-MM-DD' date string for an item (used for date range filter). */
  getDate: (item: T) => string
  /** Optional list of category values shown in the dropdown filter. */
  categories?: string[]
  /** Label for the category dropdown (e.g. 'Exercise', 'Type', 'Sport'). */
  categoryLabel?: string
  /** Return true when the item matches the selected category string. */
  matchesCategory?: (item: T, cat: string) => boolean
  emptyMessage?: string
}

export function HistoryList<T,>({
  items,
  renderItem,
  getDate,
  categories,
  categoryLabel = 'Category',
  matchesCategory,
  emptyMessage = 'No entries yet',
}: Props<T>) {
  const [expanded, setExpanded] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [cat, setCat] = useState('')

  const showFilters = expanded && items.length > FILTER_AT
  const hasFilter = !!(fromDate || toDate || cat)

  const visible = useMemo(() => {
    if (!expanded) return items.slice(0, PREVIEW)
    return items.filter(item => {
      const d = getDate(item)
      if (fromDate && d < fromDate) return false
      if (toDate && d > toDate) return false
      if (cat && matchesCategory && !matchesCategory(item, cat)) return false
      return true
    })
  }, [items, expanded, fromDate, toDate, cat, getDate, matchesCategory])

  if (items.length === 0) return <EmptyMsg>{emptyMessage}</EmptyMsg>

  const remaining = items.length - PREVIEW

  return (
    <div>
      {/* ── Filters (only when expanded AND total > FILTER_AT) ── */}
      {showFilters && (
        <div className="mb-3 p-2.5 bg-hairline rounded-[3px] flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Inp
              label="From"
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
            <Inp
              label="To"
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
          {categories && categories.length > 0 && (
            <SelEl
              label={categoryLabel}
              value={cat}
              onChange={e => setCat(e.target.value)}
              options={[
                { value: '', label: `All ${categoryLabel}s` },
                ...categories.map(c => ({ value: c, label: c })),
              ]}
            />
          )}
          {hasFilter && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); setCat('') }}
              className="text-[11px] text-ink self-start font-semibold underline underline-offset-2 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Result count when filters are active ── */}
      {showFilters && hasFilter && (
        <p className="text-[11px] text-ink-3 mb-2">
          Showing {visible.length} of {items.length}
        </p>
      )}

      {/* ── List items ── */}
      {visible.length === 0 && hasFilter
        ? <EmptyMsg>No results match the filters</EmptyMsg>
        : visible.map((item, i) => renderItem(item, i))
      }

      {/* ── Expand button ── */}
      {!expanded && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-2 py-2 flex items-center justify-center gap-1 text-[11px] text-ink font-semibold rounded-[3px] border border-line hover:border-ink cursor-pointer transition-colors"
        >
          Show {remaining} more <Icon name="chevronDown" size={13} />
        </button>
      )}

      {/* ── Collapse button ── */}
      {expanded && (
        <button
          onClick={() => { setExpanded(false); setFromDate(''); setToDate(''); setCat('') }}
          className="w-full mt-3 py-1.5 flex items-center justify-center gap-1 text-[11px] text-ink-2 font-semibold rounded-[3px] border border-line hover:border-ink hover:text-ink cursor-pointer transition-colors"
        >
          Show less <Icon name="chevronUp" size={13} />
        </button>
      )}
    </div>
  )
}
