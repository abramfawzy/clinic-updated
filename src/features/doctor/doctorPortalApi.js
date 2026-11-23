import { api } from '@/shared/api/axios'
import { mapDoctor } from '@/features/doctors/doctorMappers'
import { mapAppointment } from '@/features/booking/appointmentMappers'
import { mapHistory } from '@/features/medical/medicalApi'
import { DAY_NAMES, dayEndISO, dayStartISO, parseUtc, toHHmm, toHHmmss } from '@/shared/lib/time'

// فترة عمل في الواجهة: { day: 0..6, start: 'HH:mm', end: 'HH:mm', slot: دقايق, active }
// وفي الباك: { dayOfWeek: 'Sunday', startTime: 'HH:mm:ss', endTime, slotDurationMinutes, isActive }
const fromApi = (i) => ({
  day: DAY_NAMES.indexOf(i.dayOfWeek),
  start: toHHmm(i.startTime),
  end: toHHmm(i.endTime),
  slot: i.slotDurationMinutes,
  active: i.isActive,
})
const toApi = (w) => ({
  dayOfWeek: DAY_NAMES[w.day],
  startTime: toHHmmss(w.start),
  endTime: toHHmmss(w.end),
  slotDurationMinutes: Number(w.slot),
  isActive: w.active,
})

export const doctorPortalApi = {
  // ---- شغالة على الباك الحقيقي ----
  profile: () => api.get('/doctors/me').then((r) => mapDoctor(r.data)),
  saveProfile: (f) =>
    api
      .put('/doctors/me', {
        bio: f.bio || null,
        yearsOfExperience: Number(f.yearsOfExperience),
        consultationFee: Number(f.price),
        followUpFeePercent: Number(f.followUpFeePercent),
        followUpWindowDays: Number(f.followUpWindowDays),
      })
      .then((r) => mapDoctor(r.data)),

  schedule: () => api.get('/doctors/me/schedule').then((r) => r.data.map(fromApi)),
  // بيستبدل الجدول كله
  saveSchedule: (windows) =>
    api.put('/doctors/me/schedule', { items: windows.map(toApi) }).then((r) => r.data.map(fromApi)),

  timeOff: () =>
    api.get('/doctors/me/timeoffs', { params: { upcomingOnly: true } }).then((r) =>
      r.data.map((t) => ({
        id: t.id,
        from: parseUtc(t.startAt)?.toISOString(),
        to: parseUtc(t.endAt)?.toISOString(),
        reason: t.reason,
      })),
    ),
  // from / to بصيغة yyyy-MM-dd (من input type=date)
  addTimeOff: ({ from, to, reason }) =>
    api
      .post('/doctors/me/timeoffs', { startAt: dayStartISO(from), endAt: dayEndISO(to), reason: reason || null })
      .then((r) => r.data),
  removeTimeOff: (id) => api.delete(`/doctors/me/timeoffs/${id}`),

  // ---- مواعيد الدكتور (الباك الحقيقي) ----
  appointments: (date) =>
    api.get('/doctors/me/appointments', { params: { date } }).then((r) => (r.data.items ?? r.data).map(mapAppointment)),
  cancelAppointment: (id, reason = null) =>
    api.post(`/doctors/me/appointments/${id}/cancel`, { reason }).then((r) => r.data),
  checkIn: (id) => api.post(`/appointments/${id}/check-in`).then((r) => r.data),
  complete: (id, notes) => api.post(`/appointments/${id}/complete`, { notes: notes || null }).then((r) => r.data),
  noShow: (id) => api.post(`/appointments/${id}/no-show`).then((r) => r.data),
  // سجل المريض (لو عنده موعد مع الدكتور)
  patientHistory: (patientId) => api.get(`/patients/${patientId}/medical-history`).then((r) => mapHistory(r.data).form),
}