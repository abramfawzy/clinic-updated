import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { doctorPortalApi } from './doctorPortalApi'
import { ErrorBox, Field, PageLoader, Spinner } from '@/shared/components/ui'
import { getErrorMessage, getFieldErrors } from '@/shared/api/axios'

export default function DoctorProfilePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})

  const q = useQuery({ queryKey: ['doctor-profile'], queryFn: doctorPortalApi.profile })

  useEffect(() => {
    const d = q.data
    if (d) {
      setForm({
        bio: d.bio ?? '',
        yearsOfExperience: d.yearsOfExperience,
        price: d.price,
        followUpFeePercent: d.followUpFeePercent,
        followUpWindowDays: d.followUpWindowDays,
      })
    }
  }, [q.data])

  const save = useMutation({
    mutationFn: () => doctorPortalApi.saveProfile(form),
    onSuccess: () => {
      setErrors({})
      toast.success(t('medical.saved'))
      qc.invalidateQueries({ queryKey: ['doctor-profile'] })
      qc.invalidateQueries({ queryKey: ['doctors'] })
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  if (q.isLoading || !form) return q.isError ? <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} /> : <PageLoader />

  const d = q.data
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">{d.name}</h1>
        <p className="text-slate-500">
          {d.specialty} · {d.clinic?.name}
        </p>
        <p
          className={`mt-3 rounded-xl p-3 text-sm ${
            d.isApproved
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
          }`}
        >
          {d.isApproved ? t('doctor.approved') : t('doctor.notApproved')}
        </p>
      </div>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('doctor.fee')} error={errors.consultationFee}>
            <input className="input" type="number" min="0" max="100000" required value={form.price} onChange={set('price')} />
          </Field>
          <Field label={t('doctor.experience')} error={errors.yearsOfExperience}>
            <input className="input" type="number" min="0" max="70" required value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
          </Field>
          <Field label={t('doctor.followUpPercent')} error={errors.followUpFeePercent}>
            <input className="input" type="number" min="0" max="100" required value={form.followUpFeePercent} onChange={set('followUpFeePercent')} />
            <p className="mt-1 text-xs text-slate-500">{t('doctor.followUpPercentHint')}</p>
          </Field>
          <Field label={t('doctor.followUpDays')} error={errors.followUpWindowDays}>
            <input className="input" type="number" min="0" max="365" required value={form.followUpWindowDays} onChange={set('followUpWindowDays')} />
          </Field>
        </div>
        <Field label={t('doctors.about')} error={errors.bio}>
          <textarea className="input" rows={4} maxLength={1000} value={form.bio} onChange={set('bio')} />
        </Field>
        <button className="btn-primary" disabled={save.isPending}>
          {save.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
          {t('common.save')}
        </button>
      </form>
    </div>
  )
}
