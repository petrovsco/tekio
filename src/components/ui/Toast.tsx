import { useAppStore } from '../../store/app'

export function Toast() {
  const toast = useAppStore(s => s.toast)
  const reported = useAppStore(s => s.toastReport) != null
  if (!toast) return null
  // Above every sheet (z-300): a refused write is usually reported from inside
  // one, and the toast is the only word the user gets that it failed.
  return (
    <div
      key={toast}
      className="fixed top-4 left-1/2 z-[300] bg-ink text-white text-xs px-3 py-2 rounded-[3px] animate-toast-fade"
    >
      {toast}{reported && ' Reported.'}
    </div>
  )
}
