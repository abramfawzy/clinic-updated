import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { adminApi } from './adminApi'
import { doctorsApi } from '@/features/doctors/doctorsApi'
import { PageLoader } from '@/shared/components/ui'
import { getErrorMessage } from '@/shared/api/axios'

function Section({ title, children }) {
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

export default function AdminCatalogPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [specialty, setSpecialty] = useState({ nameAr: '', nameEn: '' })
  const [clinic, setClinic] = useState({ name: '', address: '', city: '', phone: '' })
  const [coupon, setCoupon] = useState({ code: '', percent: 10 })

  const specialties = useQuery({ queryKey: ['specialties'], queryFn: doctorsApi.specialties })
  const clinics = useQuery({ queryKey: ['admin-clinics'], queryFn: adminApi.clinics })
  // الكوبونات لسه ما اتبنتش في الباك، فممكن تفشل
  const coupons = useQuery({ queryKey: ['admin-coupons'], queryFn: adminApi.coupons, retry: false })

  const onError = (e) => toast.error(getErrorMessage(e))
  const inv = (k) => () => qc.invalidateQueries({ queryKey: [k] })

  const addSpec = useMutation({
    mutationFn: () => adminApi.addSpecialty(specialty),
    onSuccess: () => {
      setSpecialty({ nameAr: '', nameEn: '' })
      inv('specialties')()
    },
    onError,
  })
  const delSpec = useMutation({ mutationFn: adminApi.removeSpecialty, onSuccess: inv('specialties'), onError })

  const addClinic = useMutation({
    mutationFn: () => adminApi.addClinic({ ...clinic, phone: clinic.phone || null, isActive: true }),
    onSuccess: () => {
      setClinic({ name: '', address: '', city: '', phone: '' })
      inv('admin-clinics')()
    },
    onError,
  })
  const toggleClinic = useMutation({
    mutationFn: (c) =>
      adminApi.updateClinic(c.id, { name: c.name, address: c.address, city: c.city, phone: c.phone, isActive: !c.isActive }),
    onSuccess: inv('admin-clinics'),
    onError,
  })
  const delClinic = useMutation({ mutationFn: adminApi.removeClinic, onSuccess: inv('admin-clinics'), onError })

  const delCoupon = useMutation({ mutationFn: adminApi.removeCoupon, onSuccess: inv('admin-coupons'), onError })

  const addCoupon = useMutation({
    mutationFn: () => adminApi.addCoupon({ ...coupon, percent: Number(coupon.percent) }),
    onSuccess: () => {
      setCoupon({ code: '', percent: 10 })
      inv('admin-coupons')()
    },
    onError,
  })

  if (specialties.isLoading || clinics.isLoading) return <PageLoader />

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      <Section title={t('nav.specialties')}>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            addSpec.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <input className="input" required minLength={2} value={specialty.nameAr} onChange={(e) => setSpecialty({ ...specialty, nameAr: e.target.value })} placeholder={t('admin.nameAr')} />
            <input className="input" required minLength={2} dir="ltr" value={specialty.nameEn} onChange={(e) => setSpecialty({ ...specialty, nameEn: e.target.value })} placeholder={t('admin.nameEn')} />
          </div>
          <button className="btn-primary w-full" disabled={addSpec.isPending}>
            {t('admin.addSpecialty')}
          </button>
        </form>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {specialties.data?.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {s.nameAr} <span className="text-xs text-slate-500">· {s.nameEn}</span>
              </span>
              <button className="text-red-600" onClick={() => confirm(t('admin.deleteConfirm', { name: s.name })) && delSpec.mutate(s.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('nav.clinics')}>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            addClinic.mutate()
          }}
        >
          <input className="input" required minLength={2} value={clinic.name} onChange={(e) => setClinic({ ...clinic, name: e.target.value })} placeholder={t('admin.name')} />
          <input className="input" required minLength={2} value={clinic.address} onChange={(e) => setClinic({ ...clinic, address: e.target.value })} placeholder={t('admin.address')} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" required minLength={2} value={clinic.city} onChange={(e) => setClinic({ ...clinic, city: e.target.value })} placeholder={t('admin.city')} />
            <input className="input" dir="ltr" value={clinic.phone} onChange={(e) => setClinic({ ...clinic, phone: e.target.value })} placeholder={t('auth.phone')} />
          </div>
          <button className="btn-primary w-full" disabled={addClinic.isPending}>
            {t('admin.addClinic')}
          </button>
        </form>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {clinics.data?.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className={c.isActive ? '' : 'text-slate-400 line-through'}>
                {c.name} <span className="text-xs text-slate-500">· {c.city}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <button className="text-xs font-semibold text-brand-600" disabled={toggleClinic.isPending} onClick={() => toggleClinic.mutate(c)}>
                  {c.isActive ? t('admin.deactivate') : t('admin.activate')}
                </button>
                <button className="text-red-600" onClick={() => confirm(t('admin.deleteConfirm', { name: c.name })) && delClinic.mutate(c.id)}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="lg:col-span-2">
        <Section title={t('admin.coupons')}>
          {coupons.isError ? (
            <p className="text-sm text-slate-500">{getErrorMessage(coupons.error)}</p>
          ) : (
            <>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  addCoupon.mutate()
                }}
              >
                <input className="input !w-48" dir="ltr" required value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="CODE" />
                <input className="input !w-28" type="number" min="1" max="100" required value={coupon.percent} onChange={(e) => setCoupon({ ...coupon, percent: e.target.value })} />
                <button className="btn-primary">+</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {coupons.data?.map((c) => (
                  <span key={c.id} className="badge gap-2 bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                    {c.code} · {c.percent}% · ×{c.usedCount}
                    <button className="text-red-600" onClick={() => confirm(t('admin.deleteConfirm', { name: c.code })) && delCoupon.mutate(c.id)}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>
    </div>
  )
}
