import { useMemo, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { SecTitle } from '../../ui/Card'
import { Btn, DelBtn } from '../../ui/Button'
import { Inp, SelEl, FIELD } from '../../ui/Input'
import { createMuscleGroup, updateMuscleGroup, deleteMuscleGroup } from '../../../lib/db/muscles'
import type { BodyRegion } from '../../../types'

const REGION_OPTS: { value: BodyRegion; label: string }[] = [
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'core', label: 'Core' },
  { value: 'full_body', label: 'Full body' },
]

export function MuscleGroupEditor() {
  const { muscleGroups, reloadMuscleData, setToast } = useAppStore()

  const [newName, setNewName] = useState('')
  const [newRegion, setNewRegion] = useState<BodyRegion>('upper')
  const [newParent, setNewParent] = useState('')

  const topLevel = useMemo(
    () => muscleGroups.filter(g => !g.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [muscleGroups],
  )
  const childrenOf = (id: string) =>
    muscleGroups.filter(g => g.parentId === id).sort((a, b) => a.name.localeCompare(b.name))

  const parentOpts = useMemo(
    () => [{ value: '', label: 'None (top-level)' }, ...topLevel.map(g => ({ value: g.id, label: g.name }))],
    [topLevel],
  )

  const reload = async (msg: string) => {
    try {
      await reloadMuscleData()
      setToast(msg)
    } catch {
      setToast('Failed to refresh muscle data.')
    }
  }

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    if (muscleGroups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      setToast('That muscle group already exists.')
      return
    }
    try {
      await createMuscleGroup(name, newRegion, newParent || null)
      setNewName('')
      await reload('Muscle group added.')
    } catch {
      setToast('Failed to add muscle group.')
    }
  }

  const rename = async (id: string, name: string, current: string) => {
    const v = name.trim()
    if (!v || v === current) return
    try {
      await updateMuscleGroup(id, { name: v })
      await reload('Renamed.')
    } catch {
      setToast('Failed to rename.')
    }
  }

  const setRegion = async (id: string, region: BodyRegion) => {
    try {
      await updateMuscleGroup(id, { bodyRegion: region })
      await reload('Region updated.')
    } catch {
      setToast('Failed to update region.')
    }
  }

  const setParent = async (id: string, parent: string) => {
    if (parent === id) return
    try {
      await updateMuscleGroup(id, { parentId: parent || null })
      await reload('Moved.')
    } catch {
      setToast('Failed to move group.')
    }
  }

  const remove = async (id: string, name: string) => {
    if (childrenOf(id).length > 0) {
      setToast('Move or delete its sub-groups first.')
      return
    }
    try {
      await deleteMuscleGroup(id)
      await reload(`${name} deleted.`)
    } catch {
      setToast('Can’t delete — something still references it.')
    }
  }

  const Row = ({ id, name, region, parentId, child }: {
    id: string; name: string; region: BodyRegion; parentId: string | null; child?: boolean
  }) => (
    // Two stated lines rather than one wrapping row: at phone width the old
    // flex-wrap dropped the delete button onto a line of its own, where it read
    // as belonging to the next group.
    <div className={`py-2 ${child ? 'pl-4 border-l border-hairline ml-1' : ''}`}>
      <div className="flex items-center gap-2">
        <input
          aria-label={`Rename ${name}`}
          defaultValue={name}
          onBlur={e => rename(id, e.target.value, name)}
          className={FIELD}
        />
        <DelBtn label={`Delete ${name}`} onClick={() => remove(id, name)} />
      </div>
      <div className="flex gap-2 mt-1.5">
        <div className="flex-1 min-w-0">
          <SelEl
            aria-label={`${name} region`}
            options={REGION_OPTS}
            value={region}
            onChange={e => setRegion(id, e.target.value as BodyRegion)}
            className="!py-1.5 !px-2"
          />
        </div>
        <div className="flex-1 min-w-0">
          <SelEl
            aria-label={`${name} parent`}
            options={parentOpts.filter(o => o.value !== id)}
            value={parentId ?? ''}
            onChange={e => setParent(id, e.target.value)}
            className="!py-1.5 !px-2"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div>
        <SecTitle className="mb-1">Muscle groups</SecTitle>
        <p className="text-[11px] text-ink-2 leading-[1.4]">
          Add, rename, re-region or nest muscle groups. Top-level groups drive the adaptation
          dashboards; children roll up into their parent.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2 border border-line rounded-[3px] p-2.5 bg-hairline">
        <Inp
          label="New group"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="e.g. Serratus"
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          className="min-w-[7rem]"
        />
        <SelEl label="Region" options={REGION_OPTS} value={newRegion} onChange={e => setNewRegion(e.target.value as BodyRegion)} className="w-28" />
        <SelEl label="Parent" options={parentOpts} value={newParent} onChange={e => setNewParent(e.target.value)} className="w-32" />
        <Btn small onClick={add}>Add</Btn>
      </div>

      <div className="flex flex-col divide-y divide-hairline">
        {topLevel.map(top => (
          <div key={top.id} className="py-0.5">
            <Row id={top.id} name={top.name} region={top.bodyRegion} parentId={null} />
            {childrenOf(top.id).map(c => (
              <Row key={c.id} id={c.id} name={c.name} region={c.bodyRegion} parentId={c.parentId ?? null} child />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
