import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ALLOWED_TYPES, MAX_FILE_SIZE, medicalApi } from './medicalApi'
import { bookingApi } from '@/features/booking/bookingApi'
import { ErrorBox, Field, PageLoader, Spinner } from '@/shared/components/ui'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { getErrorMessage } from '@/shared/api/axios'

export default function MedicalPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [form, setForm] = useState({ chronic: '', allergies: '', medications: '' })
  const [appointmentId, setAppointmentId] = useState('')

  const q = useQuery({ queryKey: ['medical'], queryFn: medicalApi.me })
  const appts = useQuery({ queryKey: ['my-appointments'], queryFn: bookingApi.mine })

  useEffect(() => {
    if (q.data) setForm(q.data.form)
  }, [q.data])

  const save = useMutation({
    mutationFn: () => medicalApi.save(form, q.data.keys),
    onSuccess: () => toast.success(t('medical.saved')),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const upload = useMutation({
    mutationFn: medicalApi.upload,
    onSuccess: () => {
      toast.success(t('medical.saved'))
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // تحقق مبدئي في الفرونت. التحقق الحقيقي من النوع والحجم في الباك
  const onFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_SIZE) return toast.error(t('medical.fileTooBig'))
    if (!ALLOWED_TYPES.includes(file.type)) return toast.error(t('medical.fileType'))
    upload.mutate({ appointmentId, file })
  }

  if (q.isLoading) return <PageLoader />
  if (q.isError) return <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const usable = (appts.data ?? []).filter((a) => a.status !== 'Cancelled')
  const withFiles = usable.filter((a) => a.attachments.length > 0)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('medical.title')}</h1>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <Field label={t('medical.chronic')}>
          <textarea className="input" rows={2} value={form.chronic} onChange={set('chronic')} />
        </Field>
        <Field label={t('medical.allergies')}>
          <textarea className="input" rows={2} value={form.allergies} onChange={set('allergies')} />
        </Field>
        <Field label={t('medical.medications')}>
          <textarea className="input" rows={2} value={form.medications} onChange={set('medications')} />
        </Field>
        <button className="btn-primary" disabled={save.isPending}>
          {save.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
          {t('common.save')}
        </button>
      </form>

      <div className="card space-y-4">
        <div>
          <h2 className="font-bold">{t('medical.attachments')}</h2>
          <p className="text-xs text-slate-500">{t('medical.uploadHint')}</p>
        </div>

        {usable.length === 0 ? (
          <p className="text-sm text-slate-500">{t('medical.noAppointments')}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select className="input !w-auto min-w-48 flex-1" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)}>
              <option value="">{t('medical.pickAppointment')}</option>
              {usable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.doctorName} · {formatDateTime(a.start)}
                </option>
              ))}
            </select>
            <button className="btn-outline" disabled={!appointmentId || upload.isPending} onClick={() => fileRef.current?.click()}>
              {upload.isPending ? <Spinner /> : '⬆'} {t('medical.upload')}
            </button>
            <input ref={fileRef} type="file" hidden accept=".pdf,image/png,image/jpeg,image/webp" onChange={onFile} />
          </div>
        )}

        {withFiles.map((a) => (
          <div key={a.id}>
            <p className="mb-1 text-xs font-semibold text-slate-500">
              {a.doctorName} · {formatDateTime(a.start)}
            </p>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {a.attachments.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <button className="min-w-0 truncate text-start text-brand-700 hover:underline dark:text-brand-400" onClick={() => medicalApi.open(f).catch((e) => toast.error(getErrorMessage(e)))}>
                    📎 {f.name}
                  </button>
                  <span className="shrink-0 text-xs text-slate-500">
                    {f.size ? `${(f.size / 1024).toFixed(0)} KB` : ''} {f.uploadedAt ? `· ${formatDate(f.uploadedAt)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
