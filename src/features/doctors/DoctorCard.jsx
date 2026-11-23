import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stars } from '@/shared/components/ui'
import { formatMoney } from '@/shared/lib/format'

export default function DoctorCard({ doctor }) {
  const { t } = useTranslation()
  return (
    <div className="card flex flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-2xl text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          🩺
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{doctor.name}</h3>
          <p className="text-sm text-slate-500">{doctor.specialty}</p>
          <Stars value={doctor.rating} count={doctor.reviewsCount} />
        </div>
      </div>
      <p className="text-sm text-slate-500">📍 {doctor.clinic?.name}</p>
      <div className="mt-auto flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('doctors.fee')}</p>
          <p className="font-bold text-brand-700 dark:text-brand-400">{formatMoney(doctor.price)}</p>
        </div>
        <Link to={`/doctors/${doctor.id}`} className="btn-primary">
          {t('doctors.book')}
        </Link>
      </div>
    </div>
  )
}
