import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'

/** The shape of the T1 Home read while it loads: verdict block, fold-stat
 *  row, then the cards. SIGNAL geometry (§§2, 6) — 3px radii, 1px `line`. */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="pb-2">
        <Skeleton className="h-3 w-24" />
      </div>

      <div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3 mb-3" />
        <Skeleton className="h-3 w-full" />
      </div>

      <div className="rounded-[3px] border border-line bg-white p-2.5">
        <Skeleton className="h-3 w-40 mb-2.5" />
        <Skeleton className="h-8 w-full" />
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white rounded-[3px] border border-line py-2.5 px-1.5">
            <Skeleton className="h-4 w-6 mx-auto mb-1.5" />
            <Skeleton className="h-2 w-10 mx-auto" />
          </div>
        ))}
      </div>

      {Array.from({ length: 2 }, (_, i) => (
        <Card key={i}>
          <Skeleton className="h-2.5 w-20 mb-2.5" />
          <Skeleton className="h-24 w-full" />
        </Card>
      ))}
    </div>
  )
}
