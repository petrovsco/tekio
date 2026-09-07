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
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Chip } from '../ui/Chip'
import { useHrMax } from '../../hooks/useHrMax'
import { HR_MAX_REPLICATION_BPM, HR_MAX_WINDOW_MONTHS } from '../../lib/hrMax'
import { Icon, type IconName } from '../ui/Icon'
import { Toggle } from '../ui/Fields'
import { AssistantSettings } from './AssistantSettings'
import { ImportPane } from '../layout/ImportPane'
import { ExportPane } from '../layout/ExportPane'
import type { SectionConfig } from '../../lib/db/sectionConfig'

// A section is named by the same stroke icon the nav uses for it (§7) — the
// emoji that used to sit here was app chrome, not content.
const SECTION_META: Record<string, { icon: IconName; label: string }> = {
  Weights:      { icon: 'weights',  label: 'Weights' },
  Cardio:       { icon: 'cardio',   label: 'Cardio' },
  Mobility:     { icon: 'mobility', label: 'Mobility' },
}

const WEEK_START_OPTS = [
  { value: 'monday' as const, label: 'Monday' },
  { value: 'sunday' as const, label: 'Sunday' },
]

// ─── Sortable row ────────────────────────────────────────────────────────────

function SortableRow({ section }: { section: SectionConfig }) {
  const { setSection } = usePrefs()
  const meta = SECTION_META[section.sectionKey] ?? { icon: 'menu' as IconName, label: section.sectionKey }

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
      className="bg-white border border-line rounded-[3px] px-2.5 py-2 flex items-center gap-2.5"
    >
      <button
        {...attributes}
        {...listeners}
        className="w-7 h-7 -ml-1 flex items-center justify-center text-ink-3 hover:text-ink cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        aria-label="Drag to reorder"
      >
        <Icon name="drag" size={14} />
      </button>

      <Icon name={meta.icon} size={13} className="text-ink-2 shrink-0" />
      <span className="text-xs font-semibold text-ink flex-1 min-w-0 truncate">{meta.label}</span>

      {/* "Show in Home" is gone: the fused Home is not section-configurable
          (doctrine P4), so the toggle controlled nothing. The one that is left
          takes the chip tones (§8) — solid ink is the state that is on. */}
      <Chip
        small
        active={section.showInMenu}
        aria-label={`${meta.label} in menu`}
        onClick={() => setSection(section.sectionKey, { showInMenu: !section.showInMenu })}
      >
        {section.showInMenu ? 'In menu' : 'Hidden'}
      </Chip>
    </div>
  )
}

// ─── ProfileTab ──────────────────────────────────────────────────────────────

export function ProfileTab() {
  const {
    sections, reorderSections, weekStartDay, setWeekStartDay,
    trackedMuscleGroupIds, setTrackedMuscleGroupIds,
    hrMaxOverride, setHrMaxOverride,
  } = usePrefs()
  const muscleGroups = useAppStore(s => s.muscleGroups)
  const [dataAction, setDataAction] = useState<'import' | 'export' | null>(null)

  // The profile HRmax (roadmap 059): the observed peak is shown, the override
  // is the one typed field, and the draft commits on blur or Enter.
  const { observed, hrMax } = useHrMax()
  const [hrDraft, setHrDraft] = useState<string | null>(null)
  const commitHrMax = () => {
    if (hrDraft === null) return
    const n = Number.parseInt(hrDraft, 10)
    setHrMaxOverride(Number.isFinite(n) && n > 0 ? n : null)
    setHrDraft(null)
  }

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
      <Card>
        <SecTitle>Preferences</SecTitle>
        <Toggle
          label="Week starts on"
          options={WEEK_START_OPTS}
          value={weekStartDay}
          onPick={setWeekStartDay}
        />
      </Card>

      <Card>
        <SecTitle>Max heart rate</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">
          {observed
            ? `Observed ${observed.value} bpm (${observed.label}, ${observed.date}) — the highest peak a second session came within ${HR_MAX_REPLICATION_BPM} bpm of in the last ${HR_MAX_WINDOW_MONTHS} months. `
            : `No repeated peak in the last ${HR_MAX_WINDOW_MONTHS} months — one reading is never a maximum. `}
          A typed average heart rate on a manual session is read against this number; set the watch to it too.
          A chest-strap test typed below overrides it until a synced peak beats it by more than {HR_MAX_REPLICATION_BPM} bpm.
        </p>
        <div className="flex items-end gap-3">
          <div className="w-28">
            <Inp
              label="Override (bpm)"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="—"
              value={hrDraft ?? (hrMaxOverride == null ? '' : String(hrMaxOverride))}
              onChange={e => setHrDraft(e.target.value)}
              onBlur={commitHrMax}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            />
          </div>
          <span className="text-xs text-ink-2 pb-2">
            {hrMax != null ? `Reading typed heart rates against ${hrMax} bpm.` : 'No number yet — typed heart rates are not read.'}
          </span>
        </div>
      </Card>

      <Card>
        <SecTitle>Adaptation tracking</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">
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
          // Undoing a selection is the third-rank action here, so it is ghost
          // text (§8). The accent would claim an urgency this does not have.
          <button
            onClick={() => setTrackedMuscleGroupIds([])}
            className="text-[11px] font-semibold text-ink-3 hover:text-ink mt-2.5 cursor-pointer transition-colors"
          >
            Reset to all muscle groups
          </button>
        )}
      </Card>

      <AssistantSettings />

      <div>
        <SecTitle>Sections</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">
          Drag to reorder. Changes are reflected in the menu.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {knownSections.map(section => (
                <SortableRow key={section.sectionKey} section={section} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <SecTitle>Data</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">
          Export or import your entries as JSON via the clipboard.
        </p>
        <div className="flex flex-col gap-1.5">
          {([
            { action: 'export' as const, icon: 'export' as IconName, label: 'Export to clipboard' },
            { action: 'import' as const, icon: 'import' as IconName, label: 'Import from clipboard' },
          ]).map(row => (
            <button
              key={row.action}
              onClick={() => setDataAction(row.action)}
              className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-[3px] border border-line bg-white text-xs font-semibold text-ink hover:bg-hairline cursor-pointer transition-colors"
            >
              <Icon name={row.icon} size={13} className="text-ink-2" />
              {row.label}
            </button>
          ))}
        </div>
      </div>

      {dataAction === 'import' && <ImportPane onClose={() => setDataAction(null)} />}
      {dataAction === 'export' && <ExportPane onClose={() => setDataAction(null)} />}
    </div>
  )
}
