import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { doctorPortalApi } from './doctorPortalApi'
import ChatPanel from '@/features/booking/ChatPanel'
import { EmptyState, ErrorBox, Modal, PageLoader, StatusBadge } from '@/shared/components/ui'
import { formatTime, toISODate } from '@/shared/lib/format'
import { medicalApi } from '@/features/medical/medicalApi'
import { getErrorMessage } from '@/shared/api/axios'

function HistoryModal({ patient, onClose }) {
  const { t } = useTranslation()
  const q = useQuery({
    queryKey: ['patient-history', patient?.id],
    queryFn: () => doctorPortalApi.patientHistory(patient.id),
    enabled: !!patient,
    retry: false,
  })
  return (
    <Modal open={!!patient} onClose={onClose} title={`${t('doctor.patientHistory')}: ${patient?.name ?? ''}`}>
      {q.isLoading ? (
        <PageLoader />
      ) : q.isError ? (
        <ErrorBox message={getErrorMessage(q.error)} />
      ) : q.data ? (
        <dl className="space-y-3 text-sm">
          {[
            ['medical.chronic', q.data.chronic],
            ['medical.allergies', q.data.allergies],
            ['medical.medications', q.data.medications],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-slate-500">{t(k)}</dt>
              <dd className="font-semibold">{v || '—'}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Modal>
  )
}

function CompleteModal({ appt, onClose }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [notes, setNotes] = useState('')
  const m = useMutation({
    mutationFn: () => doctorPortalApi.complete(appt.id, notes),
    onSuccess: () => {
      toast.success(t('medical.saved'))
      qc.invalidateQueries({ queryKey: ['doctor-agenda'] })
      onClose()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  return (
    <Modal open={!!appt} onClose={onClose} title={t('doctor.complete')}>
      <div className="space-y-3">
        <label className="label">{t('doctor.notes')}</label>
        <textarea className="input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className="btn-primary w-full" disabled={m.isPending} onClick={() => m.mutate()}>
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}

export default function DoctorAgendaPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [date, setDate] = useState(toISODate(new Date()))
  const [historyOf, setHistoryOf] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [chatFor, setChatFor] = useState(null)

  const q = useQuery({ queryKey: ['doctor-agenda', date], queryFn: () => doctorPortalApi.appointments(date) })

  const refresh = () => qc.invalidateQueries({ queryKey: ['doctor-agenda'] })
  const onError = (e) => toast.error(getErrorMessage(e))
  const checkIn = useMutation({ mutationFn: doctorPortalApi.checkIn, onSuccess: refresh, onError })
  const noShow = useMutation({ mutationFn: doctorPortalApi.noShow, onSuccess: refresh, onError })
  const cancel = useMutation({ mutationFn: doctorPortalApi.cancelAppointment, onSuccess: refresh, onError })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('doctor.todayAgenda')}</h1>
        <input type="date" className="input !w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {q.isLoading ? (
        <PageLoader />
      ) : q.isError ? (
        <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {q.data.map((a) => (
            <div key={a.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="rounded-xl bg-brand-50 px-3 py-2 text-lg font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {formatTime(a.start)}
                  </span>
                  <div>
                    <p className="font-bold">{a.patientName}</p>
                    <p className="text-xs text-slate-500">{a.isFollowUp ? t('doctors.followUp') : ''}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-outline" onClick={() => setHistoryOf({ id: a.patientId, name: a.patientName })}>
                  📋 {t('doctor.patientHistory')}
                </button>
                {a.status === 'Confirmed' && (
                  <button className="btn-outline" disabled={checkIn.isPending} onClick={() => checkIn.mutate(a.id)}>
                    {t('reception.checkIn')}
                  </button>
                )}
                {['Confirmed', 'CheckedIn'].includes(a.status) && (
                  <button className="btn-primary" onClick={() => setCompleting(a)}>
                    ✔ {t('doctor.complete')}
                  </button>
                )}
                {['Confirmed', 'CheckedIn'].includes(a.status) && new Date(a.start) <= new Date() && (
                  <button className="btn-outline" disabled={noShow.isPending} onClick={() => confirm(t('doctor.noShow') + '?') && noShow.mutate(a.id)}>
                    🚫 {t('doctor.noShow')}
                  </button>
                )}
                {['PendingPayment', 'Confirmed'].includes(a.status) && (
                  <button className="btn-outline !text-red-600" disabled={cancel.isPending} onClick={() => confirm(t('booking.cancel') + '?') && cancel.mutate(a.id)}>
                    {t('booking.cancel')}
                  </button>
                )}
                {a.status === 'Completed' && (
                  <button className="btn-outline" onClick={() => setChatFor(chatFor === a.id ? null : a.id)}>
                    💬 {t('doctor.chatPatient')}
                  </button>
                )}
              </div>
              {a.attachments.length > 0 && (
                <ul className="flex flex-wrap gap-2 text-sm">
                  {a.attachments.map((f) => (
                    <li key={f.id}>
                      <button className="badge bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200" onClick={() => medicalApi.open(f).catch(onError)}>
                        📎 {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {chatFor === a.id && <ChatPanel appointmentId={a.id} />}
            </div>
          ))}
        </div>
      )}

      <HistoryModal patient={historyOf} onClose={() => setHistoryOf(null)} />
      <CompleteModal appt={completing} onClose={() => setCompleting(null)} />
    </div>
  )
}
