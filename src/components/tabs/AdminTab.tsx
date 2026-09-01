import { Card } from '../ui/Card'
import { MuscleGroupEditor } from './admin/MuscleGroupEditor'
import { AdaptationTargetsEditor } from './admin/AdaptationTargetsEditor'
import { ExerciseMuscleEditor } from './habits/ExerciseMuscleEditor'

/**
 * Admin-only maintenance screen for the exercise/muscle taxonomy. Intended to be
 * gated behind an admin role once permissions land.
 */
export function AdminTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* The notice states a fact about reach, not an urgency, so it takes no
          colour (§1) — the amber banner is gone and the 2px ink border carries
          the weight instead (§6). */}
      <div className="rounded-[3px] border-2 border-ink bg-white px-2.5 py-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink">
          Admin · taxonomy maintenance
        </p>
        <p className="text-[11px] text-ink-2 mt-1 leading-[1.4]">
          These editors change the shared exercise/muscle data behind every dashboard.
        </p>
      </div>

      <Card>
        <AdaptationTargetsEditor />
      </Card>

      <Card>
        <MuscleGroupEditor />
      </Card>

      <Card>
        <ExerciseMuscleEditor />
      </Card>
    </div>
  )
}
