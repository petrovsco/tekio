import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/app'
import { mergeById } from '../../lib/utils'
import { saveWeightEntry } from '../../lib/db/weights'
import { saveBodyweightEntry } from '../../lib/db/bodyweight'
import { saveCardioEntry } from '../../lib/db/cardio'
import { saveMobilityEntry } from '../../lib/db/mobility'
import { saveSportEntry } from '../../lib/db/sport'
import { saveDonationEntry } from '../../lib/db/donations'
import { saveWaterEntry } from '../../lib/db/water'
import { saveSleepEntry, saveSaunaEntry, saveColdEntry } from '../../lib/db/recovery'
import type { WeightEntry, BodyweightEntry, CardioEntry, MobilityEntry, SportEntry, DonationEntry, WaterEntry, SleepEntry, SaunaEntry, ColdEntry, Program } from '../../types'
import { Btn } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { FIELD } from '../ui/Input'

interface ImportPaneProps {
  onClose: () => void
}

export function ImportPane({ onClose }: ImportPaneProps) {
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const store = useAppStore()

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  async function applyData(text: string): Promise<boolean> {
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(text) } catch { return false }
    if (!Array.isArray(parsed.weights) || !Array.isArray(parsed.bodyweight)) return false

    try {
      const p = parsed
      setLoading(true)

      // Remap non-UUID supersetIds (e.g. nanoid strings) to proper UUIDs, preserving grouping
      const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
      const supersetIdMap = new Map<string, string>()
      const inWeights: WeightEntry[] = ((p.weights as WeightEntry[]) || []).map(w => {
        if (!w.supersetId || isUuid(w.supersetId)) return w
        if (!supersetIdMap.has(w.supersetId)) supersetIdMap.set(w.supersetId, crypto.randomUUID())
        return { ...w, supersetId: supersetIdMap.get(w.supersetId)! }
      })

      // Natural key deduplication — existing data wins; imported entries only fill gaps.
      // IDs can't be used here because imported JSON uses nanoid strings while the DB uses UUIDs.
      const existingWKeys = new Set(store.weights.map(w => `${w.date}:${w.exercise}`))
      const existingBDates = new Set(store.bodyweight.map(b => b.date))
      const existingCKeys = new Set(store.cardio.map(c => `${c.date}:${c.type}`))
      const existingMDates = new Set(store.mobility.map(m => m.date))
      const existingSkKeys = new Set(store.sports.map(s => `${s.date}:${s.sport}`))
      const existingDKeys = new Set(store.donations.map(d => `${d.date}:${d.type}`))
      const existingWaterKeys = new Set(store.water.map(w => `${w.date}:${w.amountMl}`))
      // Sleep is one row per night (upsert on date); sauna/cold can repeat per day,
      // so key those on date+duration like water does.
      const existingSleepDates = new Set(store.sleep.map(s => s.date))
      const existingSaunaKeys = new Set(store.sauna.map(s => `${s.date}:${s.duration}`))
      const existingColdKeys = new Set(store.cold.map(c => `${c.date}:${c.duration}`))

      const newInWeights = inWeights.filter(w => !existingWKeys.has(`${w.date}:${w.exercise}`))
      const newInBodyweight = ((p.bodyweight as BodyweightEntry[]) || []).filter(b => !existingBDates.has(b.date))
      const newInCardio = ((p.cardio as CardioEntry[]) || []).filter(c => !existingCKeys.has(`${c.date}:${c.type}`))
      const newInMobility = ((p.mobility as MobilityEntry[]) || []).filter(m => !existingMDates.has(m.date))
      // Accept both the new `sports` key and legacy `skills` exports (field `skill` → `sport`).
      const inSports = ((p.sports ?? p.skills) as (SportEntry & { skill?: string })[] | undefined ?? [])
        .map(s => ({ ...s, sport: (s.sport ?? s.skill) as SportEntry['sport'] }))
      const newInSports = inSports.filter(s => !existingSkKeys.has(`${s.date}:${s.sport}`))
      const newInDonations = ((p.donations as DonationEntry[]) || []).filter(d => !existingDKeys.has(`${d.date}:${d.type}`))
      const newInWater = ((p.water as WaterEntry[]) || []).filter(w => !existingWaterKeys.has(`${w.date}:${w.amountMl}`))
      const newInSleep = ((p.sleep as SleepEntry[]) || []).filter(s => !existingSleepDates.has(s.date))
      const newInSauna = ((p.sauna as SaunaEntry[]) || []).filter(s => !existingSaunaKeys.has(`${s.date}:${s.duration}`))
      const newInCold = ((p.cold as ColdEntry[]) || []).filter(c => !existingColdKeys.has(`${c.date}:${c.duration}`))

      const newWeights: WeightEntry[] = mergeById(store.weights, newInWeights)
      const newBodyweight: BodyweightEntry[] = mergeById(store.bodyweight, newInBodyweight)
      const newCardio: CardioEntry[] = mergeById(store.cardio, newInCardio)
      const newMobility: MobilityEntry[] = mergeById(store.mobility, newInMobility)
      const newSports: SportEntry[] = mergeById(store.sports, newInSports)
      const newDonations: DonationEntry[] = mergeById(store.donations, newInDonations)
      const newWater: WaterEntry[] = mergeById(store.water, newInWater)
      const newSleep: SleepEntry[] = mergeById(store.sleep, newInSleep)
      const newSauna: SaunaEntry[] = mergeById(store.sauna, newInSauna)
      const newCold: ColdEntry[] = mergeById(store.cold, newInCold)

      // Weights: process date-by-date to avoid concurrent session creation race condition
      const byDate = new Map<string, WeightEntry[]>()
      for (const w of newInWeights) {
        const arr = byDate.get(w.date) ?? []
        arr.push(w)
        byDate.set(w.date, arr)
      }
      for (const entries of byDate.values()) {
        for (const w of entries) await saveWeightEntry(w)
      }

      // Other domains are safe to run in parallel (no shared session concept)
      await Promise.all([
        ...newInBodyweight.map(b => saveBodyweightEntry(b)),
        ...newInCardio.map(c => saveCardioEntry(c)),
        ...newInMobility.map(m => saveMobilityEntry(m)),
        ...newInSports.map(s => saveSportEntry(s)),
        ...newInDonations.map(d => saveDonationEntry(d)),
        ...newInWater.map(w => saveWaterEntry(w)),
        ...newInSleep.map(s => saveSleepEntry(s)),
        ...newInSauna.map(s => saveSaunaEntry(s)),
        ...newInCold.map(c => saveColdEntry(c)),
      ])

      store.setWeights(newWeights)
      store.setBodyweight(newBodyweight)
      store.setCardio(newCardio)
      store.setMobility(newMobility)
      store.setSports(newSports)
      store.setDonations(newDonations)
      store.setWater(newWater)
      store.setSleep(newSleep)
      store.setSauna(newSauna)
      store.setCold(newCold)

      if (p.program && store.programs.length === 0) {
        await store.saveActiveProgram(p.program as Program)
      }

      store.setToast('Data imported!')
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData?.getData('text') || ''
    if (!text) return
    e.preventDefault()
    setVal(text)
    ref.current?.blur()
    setTimeout(async () => {
      const ok = await applyData(text)
      if (!ok) store.setToast('Invalid data format.')
      onClose()
    }, 100)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Import data"
      footer={
        <div className="flex gap-2">
          <Btn
            onClick={async () => {
              const ok = await applyData(val)
              if (!ok) store.setToast('Invalid data format.')
              else onClose()
            }}
            disabled={!val.trim() || loading}
            className="flex-1"
          >
            {loading ? 'Loading…' : 'Load'}
          </Btn>
          <Btn onClick={onClose} variant="secondary" className="flex-1">Cancel</Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-2 leading-[1.4]">Paste JSON — it loads automatically on paste.</p>
        <textarea
          ref={ref}
          value={val}
          onPaste={handlePaste}
          onChange={e => setVal(e.target.value)}
          placeholder="Paste here…"
          className={`${FIELD} h-24 font-mono resize-none`}
        />
      </div>
    </Modal>
  )
}
