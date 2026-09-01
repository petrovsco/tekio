import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today, parseDurationMins } from '../../../lib/utils'
import { Inp, FIELD_LABEL } from '../../ui/Input'
import { Btn } from '../../ui/Button'
import { FieldLabel, Toggle, Rating } from '../../ui/Fields'
import { SmartInput } from '../../ui/SmartInput'
import { ChipListInput } from '../../ui/ChipListInput'
import type { QualityRating, MatchResult, NewSportFlags } from '../../../types'

const RESULTS: { value: MatchResult; label: string }[] = [
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'tie', label: 'Tie' },
]

/**
 * Sport capture, folded into Cardio (doctrine ledger: "a sport session is a
 * cardio session with a name and a quality rating"). The fields below are the
 * ones a cardio session genuinely lacks — sport name, trainer, quality,
 * competitors, teammates, result.
 */
export function SportLogForm() {
  const [sport, setSport] = useState('')
  const [date, setDate] = useState(today())
  const [withTrainer, setWithTrainer] = useState(false)
  const [quality, setQuality] = useState(0)
  const [duration, setDuration] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [notes, setNotes] = useState('')
  const [competitorNames, setCompetitorNames] = useState<string[]>([])
  const [result, setResult] = useState<MatchResult | ''>('')
  const [teammates, setTeammates] = useState<string[]>([])
  const [newSportHasCompetitor, setNewSportHasCompetitor] = useState(false)
  const [newSportHasTeammate, setNewSportHasTeammate] = useState(false)
  const { sports, sportTypes, addSportEntry, setToast } = useAppStore()

  const allSports = [...new Set(sports.map(d => d.sport))].sort()
  const allCompetitors = [...new Set(sports.flatMap(d => d.competitorNames ?? []))].sort()
  const allTeammates = [...new Set(sports.flatMap(d => d.teammateNames ?? []))].sort()
  const existingType = sportTypes.find(t => t.name.toLowerCase() === sport.trim().toLowerCase())
  const isNewSport = sport.trim() !== '' && !existingType
  const hasCompetitor = existingType ? existingType.hasCompetitor : (isNewSport && newSportHasCompetitor)
  const hasTeammate = existingType ? existingType.hasTeammate : (isNewSport && newSportHasTeammate)

  const handleSelectSport = (n: string) => {
    setSport(n)
    const prev = sports.filter(d => d.sport.toLowerCase() === n.trim().toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (prev) { setWithTrainer(prev.withTrainer); setQuality(prev.quality) }
  }

  const add = async () => {
    if (!sport.trim()) return
    const newSportFlags: NewSportFlags | undefined = isNewSport
      ? { hasCompetitor: newSportHasCompetitor, hasTeammate: newSportHasTeammate }
      : undefined
    try {
      await addSportEntry({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sport: sport.trim() as any,
        date,
        withTrainer,
        quality: quality as QualityRating,
        duration: parseDurationMins(duration) || undefined,
        avgHr: avgHr ? +avgHr : undefined,
        notes,
        competitorNames: hasCompetitor ? (competitorNames.length ? competitorNames : undefined) : undefined,
        result: hasCompetitor ? (result || undefined) : undefined,
        teammateNames: hasTeammate ? teammates : undefined,
      }, newSportFlags)
      setSport(''); setNotes(''); setQuality(0); setWithTrainer(false)
      setDuration(''); setAvgHr('')
      setCompetitorNames([]); setResult(''); setTeammates([])
      setNewSportHasCompetitor(false); setNewSportHasTeammate(false)
      setToast('Session logged!')
    } catch {
      setToast('Failed to save.')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2.5 mb-3">
        <div>
          <FieldLabel>Sport</FieldLabel>
          <SmartInput
            value={sport}
            onChange={handleSelectSport}
            suggestions={allSports}
            placeholder="e.g. Tennis, Swimming"
          />
        </div>
        {isNewSport && (
          <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-[3px] bg-hairline border border-line">
            <p className={FIELD_LABEL}>New sport — what should this track?</p>
            <label className="flex items-center gap-2 text-xs text-ink">
              <input type="checkbox" className="accent-ink" checked={newSportHasCompetitor} onChange={e => setNewSportHasCompetitor(e.target.checked)} />
              Competitor (opponent + win/loss)
            </label>
            <label className="flex items-center gap-2 text-xs text-ink">
              <input type="checkbox" className="accent-ink" checked={newSportHasTeammate} onChange={e => setNewSportHasTeammate(e.target.checked)} />
              Teammate(s)
            </label>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Toggle
            label="With trainer?"
            value={withTrainer}
            onPick={setWithTrainer}
            options={[{ value: false, label: 'No' }, { value: true, label: 'Yes' }]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Inp
            label="Duration (MM:SS, opt.)"
            type="text"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="60:00"
          />
          <Inp
            label="Avg HR (bpm, opt.)"
            type="number"
            value={avgHr}
            onChange={e => setAvgHr(e.target.value)}
            placeholder="130"
            min="0"
            step="1"
          />
        </div>
        {/* Squares, not stars: a star has to be filled with a colour to read,
            and §1 has none to spend (decided in roadmap 026). */}
        <Rating label="Quality" value={quality} onPick={v => setQuality(v as QualityRating | 0)} />
        {hasCompetitor && (
          <>
            <div>
              <FieldLabel>Competitor(s) (opt.)</FieldLabel>
              <ChipListInput items={competitorNames} onChange={setCompetitorNames} suggestions={allCompetitors} placeholder="Add competitor" />
            </div>
            <Toggle
              label="Result"
              value={result}
              onPick={(r: MatchResult) => setResult(rv => (rv === r ? '' : r))}
              options={RESULTS}
            />
          </>
        )}
        {hasTeammate && (
          <div>
            <FieldLabel>Teammate(s) (opt.)</FieldLabel>
            <ChipListInput items={teammates} onChange={setTeammates} suggestions={allTeammates} placeholder="Add teammate" />
          </div>
        )}
        <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it go?" />
      </div>
      <Btn onClick={add} className="w-full">Log session</Btn>
    </>
  )
}
