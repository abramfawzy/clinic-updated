import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { doctorPortalApi } from './doctorPortalApi'
import { ErrorBox, Field, PageLoader } from '@/shared/components/ui'
import { formatDate } from '@/shared/lib/format'
import { getErrorMessage } from '@/shared/api/axios'

const DAYS = [0, 1, 2, 3, 4, 5, 6]
const SLOT_OPTIONS = [15, 20, 30, 45, 60]
let keySeq = 0
const withKey = (w) => ({ ...w, key: ++keySeq })

export default function DoctorSchedulePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [windows, setWindows] = useState([])
  const [off, setOff] = useState({ from: '', to: '', reason: '' })

  const schedule = useQuery({ queryKey: ['doctor-schedule'], queryFn: doctorPortalApi.schedule })
  const timeOff = useQuery({ queryKey: ['doctor-timeoff'], queryFn: doctorPortalApi.timeOff })

  useEffect(() => {
    if (schedule.data) setWindows(schedule.data.map(withKey))
  }, [schedule.data])

  const saveSchedule = useMutation({
    mutationFn: () => doctorPortalApi.saveSchedule(windows),
    onSuccess: (saved) => {
      toast.success(t('medical.saved'))
      setWindows(saved.map(withKey))
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const addOff = useMutation({
    mutationFn: () => doctorPortalApi.addTimeOff(off),
    onSuccess: () => {
      setOff({ from: '', to: '', reason: '' })
      qc.invalidateQueries({ queryKey: ['doctor-timeoff'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const removeOff = useMutation({
    mutationFn: doctorPortalApi.removeTimeOff,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-timeoff'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const addWindow = (day) =>
    setWindows((w) => [...w, withKey({ day, start: '10:00', end: '16:00', slot: 30, active: true })])
  const patch = (key, k, v) => setWindows((w) => w.map((x) => (x.key === key ? { ...x, [k]: v } : x)))
  const remove = (key) => setWindows((w) => w.filter((x) => x.key !== key))

  // فحص بسيط قبل الإرسال. الباك بيفحص كل حاجة تاني (التقاطع وطول الفترة)
  const save = () => {
    for (const w of windows) {
      if (!w.start || !w.end || w.end <= w.start) return toast.error(t('doctor.errWindow'))
    }
    saveSchedule.mutate()
  }

  if (schedule.isLoading || timeOff.isLoading) return <PageLoader />
  if (schedule.isError) return <ErrorBox message={getErrorMessage(schedule.error)} onRetry={schedule.refetch} />

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="card space-y-4">
        <h2 className="text-lg font-bold">{t('doctor.workingHours')}</h2>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const list = windows.filter((w) => w.day === day)
            return (
              <div key={day} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{t(`doctor.days.${day}`)}</span>
                  <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => addWindow(day)}>
                    + {t('doctor.addWindow')}
                  </button>
                </div>
                {list.length === 0 && <p className="mt-2 text-sm text-slate-400">{t('doctor.dayOff')}</p>}
                <div className="mt-2 space-y-2">
                  {list.map((w) => (
                    <div key={w.key} className="flex flex-wrap items-center gap-2">
                      <input type="time" className="input !w-auto" value={w.start} onChange={(e) => patch(w.key, 'start', e.target.value)} />
                      <span>→</span>
                      <input type="time" className="input !w-auto" value={w.end} onChange={(e) => patch(w.key, 'end', e.target.value)} />
                      <select className="input !w-auto" value={w.slot} onChange={(e) => patch(w.key, 'slot', e.target.value)}>
                        {[...new Set([...SLOT_OPTIONS, Number(w.slot)])].sort((a, b) => a - b).map((m) => (
                          <option key={m} value={m}>
                            {m} {t('doctor.min')}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-sm">
                        <input type="checkbox" className="accent-brand-600" checked={w.active} onChange={(e) => patch(w.key, 'active', e.target.checked)} />
                        {t('doctor.active')}
                      </label>
                      <button type="button" className="text-red-600" aria-label="remove" onClick={() => remove(w.key)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <button className="btn-primary" disabled={saveSchedule.isPending} onClick={save}>
          {t('common.save')}
        </button>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-bold">{t('doctor.timeOff')}</h2>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            addOff.mutate()
          }}
        >
          <Field label={t('doctor.from')}>
            <input type="date" required className="input" value={off.from} onChange={(e) => setOff({ ...off, from: e.target.value })} />
          </Field>
          <Field label={t('doctor.to')}>
            <input type="date" required min={off.from} className="input" value={off.to} onChange={(e) => setOff({ ...off, to: e.target.value })} />
          </Field>
          <Field label={t('doctor.reason')}>
            <input className="input" maxLength={200} value={off.reason} onChange={(e) => setOff({ ...off, reason: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={addOff.isPending}>
              {t('doctor.addTimeOff')}
            </button>
          </div>
        </form>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {timeOff.data?.map((x) => (
            <li key={x.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                {formatDate(x.from)} → {formatDate(x.to)} {x.reason && `· ${x.reason}`}
              </span>
              <button className="text-red-600" onClick={() => removeOff.mutate(x.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
