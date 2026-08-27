import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import { usePrefs } from '../../store/prefs'
import { useAppStore } from '../../store/app'
import { SecTitle } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { AssistantSettings } from './AssistantSettings'
import { ImportPane } from '../layout/ImportPane'
import { ExportPane } from '../layout/ExportPane'
import type { SectionConfig } from '../../lib/db/sectionConfig'

const SECTION_META: Record<string, { icon: string; label: string }> = {
  Weights:      { icon: '🏋️', label: 'Weights' },
  'Body Weight': { icon: '⚖️', label: 'Body Weight' },
  Cardio:       { icon: '❤️', label: 'Cardio' },
  Mobility:     { icon: '🧘', label: 'Mobility' },
  Donations:    { icon: '🩸', label: 'Donations' },
  Water:        { icon: '💧', label: 'Water' },
  Habits:       { icon: '✅', label: 'Habits' },
  Recovery:     { icon: '🔋', label: 'Recovery' },
}

// ─── Toggle pill ────────────────────────────────────────────────────────────

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
          value
            ? 'bg-accent text-white'
            : 'bg-bg border border-border text-muted'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

// ─── Sortable row ────────────────────────────────────────────────────────────

function SortableRow({ section }: { section: SectionConfig }) {
  const { setSection } = usePrefs()
  const meta = SECTION_META[section.sectionKey] ?? { icon: '📌', label: section.sectionKey }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.sectionKey })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border border-border rounded-xl p-3 flex items-start gap-3"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-muted hover:text-primary cursor-grab active:cursor-grabbing touch-none select-none text-base leading-none px-0.5"
        aria-label="Drag to reorder"
      >
        ≡
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{meta.icon}</span>
          <span className="text-sm font-semibold text-primary">{meta.label}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Toggle
            label="Show in menu"
            value={section.showInMenu}
            onChange={v => setSection(section.sectionKey, { showInMenu: v })}
          />
          <Toggle
            label="Show in Home"
            value={section.showInHome}
            onChange={v => setSection(section.sectionKey, { showInHome: v })}
          />
        </div>
      </div>
    </div>
  )
}

// ─── ProfileTab ──────────────────────────────────────────────────────────────

export function ProfileTab() {
  const {
    sections, reorderSections, weekStartDay, setWeekStartDay,
    trackedMuscleGroupIds, setTrackedMuscleGroupIds,
  } = usePrefs()
  const muscleGroups = useAppStore(s => s.muscleGroups)
  const [dataAction, setDataAction] = useState<'import' | 'export' | null>(null)

  const topMuscles = useMemo(
    () => muscleGroups.filter(g => !g.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [muscleGroups],
  )
  const tracked = new Set(trackedMuscleGroupIds)
  const toggleMuscle = (id: string) => {
    const next = new Set(tracked)
    next.has(id) ? next.delete(id) : next.add(id)
    setTrackedMuscleGroupIds([...next])
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  // Config rows outlive the sections they configure — a folded section (Sports)
  // or a renamed one (Skills) leaves an orphan row behind. Only offer toggles
  // for sections the app still knows how to render.
  const knownSections = sections.filter(s => s.sectionKey in SECTION_META)
  const sectionIds = knownSections.map(s => s.sectionKey)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionIds.indexOf(active.id as string)
    const newIndex = sectionIds.indexOf(over.id as string)
    const newOrder = arrayMove(sectionIds, oldIndex, newIndex)
    reorderSections(newOrder)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SecTitle>Preferences</SecTitle>
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-xs text-muted font-medium mb-1.5">Week starts on</p>
          <div className="flex gap-1.5">
            {(['monday', 'sunday'] as const).map(v => (
              <button
                key={v}
                onClick={() => setWeekStartDay(v)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                  weekStartDay === v ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SecTitle>Adaptation Tracking</SecTitle>
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-xs text-muted mb-2.5">
            Choose which muscle groups must hit their weekly target for a resistance adaptation to
            count as “on target” on the dashboard. Select none to count every muscle group.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topMuscles.map(g => (
              <Chip key={g.id} small active={tracked.has(g.id)} onClick={() => toggleMuscle(g.id)}>
                {g.name}
              </Chip>
            ))}
          </div>
          {tracked.size > 0 && (
            <button
              onClick={() => setTrackedMuscleGroupIds([])}
              className="text-[11px] text-accent mt-2.5"
            >
              Reset to all muscle groups
            </button>
          )}
        </div>
      </div>

      <AssistantSettings />

      <div>
        <SecTitle>Sections</SecTitle>
        <p className="text-xs text-muted mb-3">
          Drag ≡ to reorder. Changes are reflected in the menu and Home tab.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {knownSections.map(section => (
                <SortableRow key={section.sectionKey} section={section} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <SecTitle>Data</SecTitle>
        <p className="text-xs text-muted mb-3">
          Export or import your entries as JSON via the clipboard.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setDataAction('export')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-primary hover:bg-bg transition-colors"
          >
            <span>📤</span> Export to clipboard
          </button>
          <button
            onClick={() => setDataAction('import')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-primary hover:bg-bg transition-colors"
          >
            <span>📥</span> Import from clipboard
          </button>
        </div>
      </div>

      {dataAction === 'import' && <ImportPane onClose={() => setDataAction(null)} />}
      {dataAction === 'export' && <ExportPane onClose={() => setDataAction(null)} />}
    </div>
  )
}
