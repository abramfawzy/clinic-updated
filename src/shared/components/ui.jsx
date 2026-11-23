import { useTranslation } from 'react-i18next'

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`}
      role="status"
    />
  )
}

export function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-500">
      <Spinner /> {t('common.loading')}
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="card border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      <p className="font-semibold">{message || t('common.error')}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-3">
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function EmptyState({ text }) {
  const { t } = useTranslation()
  return (
    <div className="card py-10 text-center text-slate-500">{text || t('common.noResults')}</div>
  )
}

export function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const STATUS_COLORS = {
  PendingPayment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  CheckedIn: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  Completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  NoShow: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export function StatusBadge({ status }) {
  const { t } = useTranslation()
  return (
    <span className={`badge ${STATUS_COLORS[status] ?? STATUS_COLORS.NoShow}`}>
      {t(`status.${status}`, status)}
    </span>
  )
}

export function Stars({ value = 0, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500">★</span>
      <span className="font-semibold">{Number(value).toFixed(1)}</span>
      {count != null && <span className="text-slate-500">({count})</span>}
    </span>
  )
}

export function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-3xl transition ${n <= value ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'}`}
          aria-label={`${n}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div className={`card max-h-[90vh] w-full overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-700 dark:text-brand-400">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
