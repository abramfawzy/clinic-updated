import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { adminApi } from './adminApi'
import { useAuthStore } from '@/features/auth/authStore'
import { ErrorBox, PageLoader, Stars, StatusBadge } from '@/shared/components/ui'
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format'
import { getErrorMessage } from '@/shared/api/axios'

const STATUS_COLOR = {
  Completed: '#10b981',
  Confirmed: '#0ea5e9',
  PendingPayment: '#f59e0b',
  Cancelled: '#ef4444',
}

function Delta({ value = 0, suffix }) {
  const up = value >= 0
  return (
    <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      <span>{up ? '▲' : '▼'}</span>
      <span dir="ltr">{Math.abs(value)}%</span>
      <span className="font-normal text-slate-500">{suffix}</span>
    </p>
  )
}

function Kpi({ icon, tone, label, value, children }) {
  return (
    <div className="card flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        {children}
      </div>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ${tone}`}>{icon}</span>
    </div>
  )
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`card flex flex-col ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function RevenueChart({ data }) {
  if (!data?.length) {
    return <p className="my-auto py-8 text-center text-sm text-slate-400">—</p>
  }
  const W = 640
  const H = 240
  const pad = { l: 44, r: 16, t: 16, b: 32 }
  const max = Math.max(...data.map((d) => d.value), 1)
  const top = Math.ceil(max / 10000) * 10000
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(data.length - 1, 1)
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b)

  const pts = data.map((d, i) => [x(i), y(d.value)])
  const line = pts.reduce((p, [px, py], i) => {
    if (i === 0) return `M${px},${py}`
    const [qx, qy] = pts[i - 1]
    const mx = (qx + px) / 2
    return `${p} C${mx},${qy} ${mx},${py} ${px},${py}`
  }, '')
  const area = `${line} L${pts[pts.length - 1][0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z`
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div dir="ltr" className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[460px]" role="img" aria-label="revenue chart">
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={pad.l} x2={W - pad.r} y1={y(top * tk)} y2={y(top * tk)} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4 4" />
            <text x={pad.l - 8} y={y(top * tk) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
              {Math.round((top * tk) / 1000)}k
            </text>
          </g>
        ))}
        <path d={area} fill="url(#rev-fill)" />
        <path d={line} fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
        {pts.map(([px, py], i) => (
          <g key={data[i].month}>
            <circle cx={px} cy={py} r={i === pts.length - 1 ? 6 : 4} className="fill-white stroke-brand-600 dark:fill-slate-900" strokeWidth="3">
              <title>{`${data[i].month}: ${formatMoney(data[i].value)}`}</title>
            </circle>
            <text x={px} y={H - 10} textAnchor="middle" className="fill-slate-500 text-[12px]">
              {data[i].month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function StatusDonut({ items, totalLabel }) {
  const { t } = useTranslation()
  const sum = items.reduce((s, i) => s + i.count, 0)
  const total = sum || 1
  let acc = 0
  return (
    <div className="my-auto flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-40 w-40 shrink-0" dir="ltr">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4" className="stroke-slate-100 dark:stroke-slate-800" />
          {items.map((it) => {
            const pct = (it.count / total) * 100
            const el = (
              <circle
                key={it.status}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                strokeWidth="4"
                stroke={STATUS_COLOR[it.status]}
                strokeDasharray={`${Math.max(pct - 0.8, 0)} ${100 - Math.max(pct - 0.8, 0)}`}
                strokeDashoffset={25 - acc}
              >
                <title>{`${t(`status.${it.status}`)}: ${it.count}`}</title>
              </circle>
            )
            acc += pct
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-bold">{formatNumber(sum)}</p>
            <p className="text-xs text-slate-500">{totalLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-3 text-sm">
        {items.map((it) => (
          <li key={it.status} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLOR[it.status] }} />
              {t(`status.${it.status}`)}
            </span>
            <span className="font-semibold">{formatNumber(it.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const q = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats })

  if (q.isLoading) return <PageLoader />
  if (q.isError) return <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} />

  const s = q.data
  const bySpecialty = s.bySpecialty ?? []
  const maxSpec = Math.max(...bySpecialty.map((x) => x.visits), 1)
  const doctorsCount = s.doctors ?? s.doctorsCount ?? 0
  const pendingDoctors = s.pendingDoctors ?? 0
  const appointmentsCount = s.appointments ?? s.appointmentsCount ?? 0
  const today = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t('admin.hello', { name: user?.name ?? '' })}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('admin.overview')}</p>
        </div>
        <p className="rounded-full bg-white px-4 py-1.5 text-sm text-slate-500 shadow-sm dark:bg-slate-900">{today}</p>
      </header>

      {pendingDoctors > 0 && (
        <Link
          to="/admin/doctors"
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <span>
            ⏳ <b>{formatNumber(pendingDoctors)}</b> {t('admin.pendingApproval')}
          </span>
          <span className="font-semibold">{t('admin.reviewNow')} ←</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="💰" tone="bg-emerald-100 dark:bg-emerald-900/40" label={t('admin.revenue')} value={formatMoney(s.revenue ?? 0)}>
          <Delta value={s.revenueChange ?? 0} suffix={t('admin.vsLastMonth')} />
        </Kpi>
        <Kpi icon="📅" tone="bg-sky-100 dark:bg-sky-900/40" label={t('admin.appointments')} value={formatNumber(appointmentsCount)}>
          <Delta value={s.appointmentsChange ?? 0} suffix={t('admin.vsLastMonth')} />
        </Kpi>
        <Kpi icon="🩺" tone="bg-brand-100 dark:bg-brand-900/40" label={t('admin.doctorsCount')} value={formatNumber(doctorsCount)}>
          <p className="mt-2 text-xs text-slate-500">
            {formatNumber(pendingDoctors)} {t('admin.pending')}
          </p>
        </Kpi>
        <Kpi icon="🧑‍🤝‍🧑" tone="bg-violet-100 dark:bg-violet-900/40" label={t('admin.patients')} value={formatNumber(s.patients ?? 0)}>
          <p className="mt-2 text-xs text-slate-500">
            {formatNumber(s.completionRate ?? 0)}% {t('admin.completionRate')}
          </p>
        </Kpi>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t('admin.revenueTrend')} action={<span className="text-xs text-slate-500">{t('admin.last6')}</span>} className="lg:col-span-2">
          <RevenueChart data={s.monthlyRevenue ?? []} />
        </Panel>
        <Panel title={t('admin.statusBreakdown')}>
          <StatusDonut
            items={
              s.statusBreakdown ?? [
                { status: 'Completed', count: 0 },
                { status: 'Confirmed', count: 0 },
                { status: 'PendingPayment', count: 0 },
                { status: 'Cancelled', count: 0 },
              ]
            }
            totalLabel={t('admin.total')}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={t('admin.topDoctors')}
          action={
            <Link to="/admin/doctors" className="text-sm font-semibold text-brand-600">
              {t('admin.viewAll')}
            </Link>
          }
          className="lg:col-span-2"
        >
          {(s.topDoctors ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">—</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {s.topDoctors.map((d, i) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {formatNumber(i + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{d.name}</p>
                    <p className="text-xs text-slate-500">
                      {d.specialty} · {formatNumber(d.visits)} {t('admin.visits')}
                    </p>
                  </div>
                  <Stars value={d.rating} />
                  <span className="w-24 text-end text-sm font-bold text-brand-700 dark:text-brand-400">{formatMoney(d.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('admin.bySpecialty')}>
          {bySpecialty.length === 0 ? (
            <p className="my-auto py-6 text-center text-sm text-slate-400">—</p>
          ) : (
            <ul className="my-auto space-y-4">
              {bySpecialty.map((sp) => (
                <li key={sp.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{sp.name}</span>
                    <span className="font-semibold">{formatNumber(sp.visits)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600" style={{ width: `${(sp.visits / maxSpec) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title={t('admin.recent')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3 text-start font-medium">{t('common.patient')}</th>
                <th className="pb-3 text-start font-medium">{t('common.doctor')}</th>
                <th className="pb-3 text-start font-medium">{t('common.date')}</th>
                <th className="pb-3 text-start font-medium">{t('common.status')}</th>
                <th className="pb-3 text-end font-medium">{t('common.price')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(s.recent ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-semibold">{a.patientName}</td>
                  <td>{a.doctorName}</td>
                  <td className="text-slate-500">{formatDateTime(a.start)}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="text-end font-semibold">{formatMoney(a.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}