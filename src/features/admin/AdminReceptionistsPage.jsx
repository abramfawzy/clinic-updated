import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { adminApi } from './adminApi'
import { EmptyState, ErrorBox, Field, Modal, PageLoader, Spinner } from '@/shared/components/ui'
import { getErrorMessage, getFieldErrors } from '@/shared/api/axios'

const EMPTY = { fullName: '', email: '', password: '', phoneNumber: '', clinicId: '' }

export default function AdminReceptionistsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const list = useQuery({ queryKey: ['admin-receptionists'], queryFn: adminApi.receptionists })
  const clinics = useQuery({ queryKey: ['admin-clinics'], queryFn: adminApi.clinics })

  const create = useMutation({
    mutationFn: () =>
      adminApi.createReceptionist({
        ...form,
        phoneNumber: form.phoneNumber || null,
        clinicId: Number(form.clinicId),
      }),
    onSuccess: () => {
      toast.success(t('medical.saved'))
      qc.invalidateQueries({ queryKey: ['admin-receptionists'] })
      setForm(EMPTY)
      setErrors({})
      setOpen(false)
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  const remove = useMutation({
    mutationFn: adminApi.removeReceptionist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-receptionists'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  if (list.isLoading) return <PageLoader />
  if (list.isError) return <ErrorBox message={getErrorMessage(list.error)} onRetry={list.refetch} />

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('nav.receptionists')}</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + {t('admin.addReceptionist')}
        </button>
      </div>

      {list.data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 text-start">{t('admin.name')}</th>
                <th className="text-start">{t('auth.email')}</th>
                <th className="text-start">{t('auth.phone')}</th>
                <th className="text-start">{t('doctors.clinic')}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 font-semibold">{r.fullName}</td>
                  <td dir="ltr" className="text-start">{r.email}</td>
                  <td dir="ltr" className="text-start">{r.phoneNumber ?? '—'}</td>
                  <td>{r.clinicName}</td>
                  <td className="text-end">
                    <button
                      className="text-red-600"
                      disabled={remove.isPending}
                      onClick={() => confirm(t('admin.deleteConfirm', { name: r.fullName })) && remove.mutate(r.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('admin.addReceptionist')}>
        <form
          className="space-y-4"
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
            <input className="input" required minLength={8} dir="ltr" value={form.password} onChange={set('password')} />
            <p className="mt-1 text-xs text-slate-500">{t('auth.passwordRule')}</p>
          </Field>
          <Field label={t('auth.phone')} error={errors.phoneNumber}>
            <input className="input" dir="ltr" value={form.phoneNumber} onChange={set('phoneNumber')} />
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
          <button className="btn-primary w-full" disabled={create.isPending}>
            {create.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
            {t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
