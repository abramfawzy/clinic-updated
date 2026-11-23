import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { doctorsApi } from './doctorsApi'
import DoctorCard from './DoctorCard'
import { ErrorBox, PageLoader } from '@/shared/components/ui'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [clinicId, setClinicId] = useState('')

  const specialties = useQuery({ queryKey: ['specialties'], queryFn: doctorsApi.specialties, staleTime: 5 * 60_000 })
  const clinics = useQuery({ queryKey: ['clinics'], queryFn: doctorsApi.clinics, staleTime: 5 * 60_000 })
  const top = useQuery({ queryKey: ['doctors', { sort: 'rating', home: true }], queryFn: () => doctorsApi.list({ sort: 'rating', pageSize: 3 }) })

  const topDoctors = Array.isArray(top.data) ? top.data : (top.data?.items ?? [])
  const clinicList = Array.isArray(clinics.data) ? clinics.data : (clinics.data?.items ?? [])
  const specialtyList = Array.isArray(specialties.data) ? specialties.data : (specialties.data?.items ?? [])

  const go = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (clinicId) params.set('clinicId', clinicId)
    navigate(`/doctors?${params.toString()}`)
  }

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center text-white">
        <h1 className="text-3xl font-bold md:text-5xl">{t('doctors.title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-brand-100">احجز كشفك أونلاين في دقيقة، وادفع أونلاين أو في العيادة.</p>
        <form onSubmit={go} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1 !border-transparent !bg-white !text-slate-800"
            placeholder={t('doctors.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input sm:w-56 !border-transparent !bg-white !text-slate-800"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
          >
            <option value="">{i18n.language === 'ar' ? 'كل الأماكن / العيادات' : 'All Locations'}</option>
            {clinicList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.city ? `${c.city} - ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <button className="btn bg-slate-900 text-white hover:bg-slate-800">{t('common.search')}</button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t('doctors.specialty')}</h2>
        <div className="flex flex-wrap gap-2">
          {specialtyList.map((s) => (
            <Link
              key={s.id}
              to={`/doctors?specialtyId=${s.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition hover:border-brand-500 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('doctors.sortRating')}</h2>
          <Link to="/doctors" className="text-sm font-semibold text-brand-600">
            {t('common.all')}
          </Link>
        </div>
        {top.isLoading ? (
          <PageLoader />
        ) : top.isError ? (
          <ErrorBox onRetry={top.refetch} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topDoctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}