import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { adminApi } from './adminApi'
import { doctorsApi } from '@/features/doctors/doctorsApi'
import { ErrorBox, Field, Modal, PageLoader, Spinner } from '@/shared/components/ui'
import { formatMoney } from '@/shared/lib/format'
import { getErrorMessage, getFieldErrors } from '@/shared/api/axios'

const EMPTY = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  specialtyId: '',
  clinicId: '',
  yearsOfExperience: 0,
  consultationFee: 200,
  followUpFeePercent: 50,
  followUpWindowDays: 14,
  bio: '',
}

function CreateDoctorModal({ open, onClose }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const specialties = useQuery({ queryKey: ['specialties'], queryFn: doctorsApi.specialties, enabled: open })
  const clinics = useQuery({ queryKey: ['admin-clinics'], queryFn: adminApi.clinics, enabled: open })

  const create = useMutation({
    mutationFn: () => adminApi.createDoctor(form),
    onSuccess: () => {
      toast.success(t('admin.doctorCreated'))
      qc.invalidateQueries({ queryKey: ['admin-doctors'] })
      setForm(EMPTY)
      setErrors({})
      onClose()
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  return (
    <Modal open={open} onClose={onClose} title={t('admin.addDoctor')} wide>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <Field label={t('auth.fullName')} error={errors.fullName}>
          <input className="input" required minLength={2} value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label={t('auth.email')} error={errors.email}>
          <input className="input" type="email" required dir="ltr" value={form.email} onChange={set('email')} />
        </Field>
        <Field label={t('admin.tempPassword')} error={errors.password}>
          <input className="input" type="text" required dir="ltr" minLength={8} value={form.password} onChange={set('password')} />
          <p className="mt-1 text-xs text-slate-500">{t('auth.passwordRule')}</p>
        </Field>
        <Field label={t('auth.phone')} error={errors.phoneNumber}>
          <input className="input" dir="ltr" value={form.phoneNumber} onChange={set('phoneNumber')} />
        </Field>
        <Field label={t('doctors.specialty')} error={errors.specialtyId}>
          <select className="input" required value={form.specialtyId} onChange={set('specialtyId')}>
            <option value="">—</option>
            {specialties.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('doctors.clinic')} error={errors.clinicId}>
          <select className="input" required value={form.clinicId} onChange={set('clinicId')}>
            <option value="">—</option>
            {clinics.data?.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('doctor.fee')} error={errors.consultationFee}>
          <input className="input" type="number" min="0" max="100000" required value={form.consultationFee} onChange={set('consultationFee')} />
        </Field>
        <Field label={t('doctor.experience')} error={errors.yearsOfExperience}>
          <input className="input" type="number" min="0" max="70" required value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
        </Field>
        <Field label={t('doctor.followUpPercent')} error={errors.followUpFeePercent}>
          <input className="input" type="number" min="0" max="100" required value={form.followUpFeePercent} onChange={set('followUpFeePercent')} />
        </Field>
        <Field label={t('doctor.followUpDays')} error={errors.followUpWindowDays}>
          <input className="input" type="number" min="0" max="365" required value={form.followUpWindowDays} onChange={set('followUpWindowDays')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('doctors.about')} error={errors.bio}>
            <textarea className="input" rows={3} maxLength={1000} value={form.bio} onChange={set('bio')} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button className="btn-primary w-full" disabled={create.isPending}>
            {create.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
            {t('admin.addDoctor')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminDoctorsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const q = useQuery({ queryKey: ['admin-doctors'], queryFn: () => adminApi.doctors({ pageSize: 100 }) })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-doctors'] })
    qc.invalidateQueries({ queryKey: ['doctors'] })
  }
  const onError = (e) => toast.error(getErrorMessage(e))
  const approve = useMutation({ mutationFn: adminApi.approveDoctor, onSuccess: refresh, onError })
  const unapprove = useMutation({ mutationFn: adminApi.unapproveDoctor, onSuccess: refresh, onError })

  if (q.isLoading) return <PageLoader />
  if (q.isError) return <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} />

  const pending = q.data.items.filter((d) => !d.isApproved)
  const approved = q.data.items.filter((d) => d.isApproved)

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('nav.doctors')}</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          + {t('admin.addDoctor')}
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">
          {t('admin.pendingApproval')} <span className="badge bg-amber-100 text-amber-800">{pending.length}</span>
        </h2>
        {pending.length === 0 && <p className="text-sm text-slate-500">{t('admin.noPending')}</p>}
        {pending.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{d.name}</p>
              <p className="text-sm text-slate-500">
                {d.specialty} · {d.clinic?.name}
              </p>
              <p className="text-xs text-slate-400" dir="ltr">
                {d.email}
              </p>
            </div>
            <button className="btn-primary" disabled={approve.isPending} onClick={() => approve.mutate(d.id)}>
              {t('admin.approve')}
            </button>
          </div>
        ))}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-4 font-bold">{t('admin.approvedDoctors')}</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2 text-start">{t('admin.name')}</th>
              <th className="text-start">{t('doctors.specialty')}</th>
              <th className="text-start">{t('doctors.clinic')}</th>
              <th className="text-start">{t('common.price')}</th>
              <th className="text-start">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {approved.map((d) => (
              <tr key={d.id}>
                <td className="py-3 font-semibold">
                  {d.name}
                  <span className="block text-xs font-normal text-slate-400" dir="ltr">
                    {d.email}
                  </span>
                </td>
                <td>{d.specialty}</td>
                <td>{d.clinic?.name}</td>
                <td>{formatMoney(d.price)}</td>
                <td>
                  <button
                    className="btn-outline !px-3 !py-1.5"
                    disabled={unapprove.isPending}
                    onClick={() => confirm(t('admin.unapprove') + '?') && unapprove.mutate(d.id)}
                  >
                    {t('admin.unapprove')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <CreateDoctorModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
