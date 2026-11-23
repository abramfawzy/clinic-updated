import { api } from '@/shared/api/axios'
import { mapAppointment } from '@/features/booking/appointmentMappers'
import { paymentsApi } from '@/features/booking/bookingApi'

export const receptionApi = {
  today: async () => {
    try {
      const r = await api.get('/reception/appointments')
      return (r.data.items ?? r.data).map(mapAppointment)
    } catch {
      return []
    }
  },
  checkIn: (id) => api.post(`/appointments/${id}/check-in`).then((r) => r.data),
  confirmPayment: (id, couponCode = null) => paymentsApi.confirmClinic(id, couponCode),
}