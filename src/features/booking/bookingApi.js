import { api } from '@/shared/api/axios'
import { mapAppointment, mapCoupon } from './appointmentMappers'

const METHOD = { Online: 'Online', Clinic: 'AtClinic' }

export const bookingApi = {
  create: ({ doctorId, start, paymentMethod, isFollowUp }) =>
    api
      .post('/appointments', {
        doctorId: Number(doctorId),
        startAtUtc: new Date(start).toISOString(),
        type: isFollowUp ? 'FollowUp' : 'New',
        paymentMethod: METHOD[paymentMethod] ?? 'Online',
      })
      .then((r) => mapAppointment(r.data)),

  mine: () => api.get('/appointments/me').then((r) => (r.data.items ?? r.data).map(mapAppointment)),

  cancel: (id, reason = null) =>
    api.post(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),

  validateCoupon: (code, appointmentId) =>
    api
      .post('/coupons/validate', {
        code: code.trim(),
        ...(appointmentId ? { appointmentId: Number(appointmentId) } : {}),
      })
      .then((r) => mapCoupon({ code: code.trim(), ...r.data })),

  async followUpEligibility(doctorId, windowDays) {
    const limit = Date.now() - Number(windowDays ?? 0) * 86400000
    const list = await bookingApi.mine()
    return list.some(
      (a) =>
        Number(a.doctorId) === Number(doctorId) &&
        a.status === 'Completed' &&
        new Date(a.completedAt ?? a.start).getTime() >= limit,
    )
  },

  joinWaitlist: (doctorId, desiredDate) =>
    api.post('/waitlist', { doctorId: Number(doctorId), desiredDate }).then((r) => r.data),
}

const urlOf = (d) => d?.iframeUrl ?? d?.paymentUrl ?? d?.redirectUrl ?? d?.checkoutUrl ?? d?.url ?? null

export const paymentsApi = {
  initiate: (appointmentId, couponCode = null) =>
    api
      .post('/payments/online', {
        appointmentId: Number(appointmentId),
        ...(couponCode ? { couponCode } : {}),
      })
      .then((r) => ({ ...r.data, paymentUrl: urlOf(r.data) })),

  confirmClinic: (appointmentId, couponCode = null) =>
    api
      .post(`/payments/clinic/${appointmentId}/confirm`, {
        ...(couponCode ? { couponCode } : {}),
      })
      .then((r) => r.data),
}