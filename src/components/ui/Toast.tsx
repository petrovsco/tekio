import { useAppStore } from '../../store/app'

export function Toast() {
  const toast = useAppStore(s => s.toast)
  if (!toast) return null
  return (
    <div
      key={toast}
      className="fixed top-4 left-1/2 z-[100] bg-ink text-white text-xs px-3 py-2 rounded-[3px] animate-toast-fade"
    >
      {toast}
    </div>
  )
}
