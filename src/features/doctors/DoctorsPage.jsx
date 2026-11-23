import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { doctorsApi } from './doctorsApi'
import DoctorCard from './DoctorCard'
import { EmptyState, ErrorBox, PageLoader } from '@/shared/components/ui'
import { getErrorMessage } from '@/shared/api/axios'

function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export default function DoctorsPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const debounced = useDebounced(search)

  const filters = {
    search: debounced,
    specialtyId: params.get('specialtyId') ?? '',
    clinicId: params.get('clinicId') ?? '',
    minRating: params.get('minRating') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sort: params.get('sort') ?? 'rating',
    page: Number(params.get('page') ?? 1),
  }

  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    v ? next.set(k, v) : next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const specialties = useQuery({ queryKey: ['specialties'], queryFn: doctorsApi.specialties, staleTime: 5 * 60_000 })
  const clinics = useQuery({ queryKey: ['clinics'], queryFn: doctorsApi.clinics, staleTime: 5 * 60_000 })
  const doctors = useQuery({
    queryKey: ['doctors', filters],
    queryFn: () => doctorsApi.list(filters),
    placeholderData: (prev) => prev,
  })

  const locationLabel = i18n.language === 'ar' ? 'المكان / العيادة' : 'Location / Clinic'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('doctors.title')}</h1>

      <div className="card grid gap-3 md:grid-cols-6">
        <input
          className="input md:col-span-2"
          placeholder={t('doctors.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={filters.clinicId} onChange={(e) => setParam('clinicId', e.target.value)}>
          <option value="">{locationLabel}: {t('common.all')}</option>
          {clinics.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.city ? `${c.city} - ${c.name}` : c.name}
            </option>
          ))}
        </select>
        <select className="input" value={filters.specialtyId} onChange={(e) => setParam('specialtyId', e.target.value)}>
          <option value="">{t('doctors.specialty')}: {t('common.all')}</option>
          {specialties.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="input" value={filters.minRating} onChange={(e) => setParam('minRating', e.target.value)}>
          <option value="">{t('doctors.minRating')}</option>
          {[4.5, 4, 3].map((r) => (
            <option key={r} value={r}>
              ★ {r}+
            </option>
          ))}
        </select>
        <select className="input" value={filters.sort} onChange={(e) => setParam('sort', e.target.value)}>
          <option value="rating">{t('doctors.sortRating')}</option>
          <option value="priceAsc">{t('doctors.sortPriceAsc')}</option>
          <option value="priceDesc">{t('doctors.sortPriceDesc')}</option>
        </select>
        <div className="md:col-span-6">
          <label className="label">
            {t('doctors.maxPrice')}: {filters.maxPrice || t('common.all')}
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={filters.maxPrice || 1000}
            onChange={(e) => setParam('maxPrice', e.target.value === '1000' ? '' : e.target.value)}
            className="w-full accent-brand-600"
          />
        </div>
      </div>

      {doctors.isLoading ? (
        <PageLoader />
      ) : doctors.isError ? (
        <ErrorBox message={getErrorMessage(doctors.error)} onRetry={doctors.refetch} />
      ) : doctors.data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${doctors.isFetching ? 'opacity-60' : ''}`}>
            {doctors.data.items.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
          {doctors.data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button className="btn-outline" disabled={filters.page <= 1} onClick={() => setParam('page', String(filters.page - 1))}>
                {t('common.prev')}
              </button>
              <span className="text-sm text-slate-500">
                {t('common.pageOf', { page: doctors.data.page, total: doctors.data.totalPages })}
              </span>
              <button
                className="btn-outline"
                disabled={filters.page >= doctors.data.totalPages}
                onClick={() => setParam('page', String(filters.page + 1))}
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}