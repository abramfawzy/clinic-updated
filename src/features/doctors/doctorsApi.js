import { api } from '@/shared/api/axios'
import { mapDoctor, mapPaged, mapSpecialty } from './doctorMappers'
import { mapSlots } from '@/features/booking/appointmentMappers'

const SORT = {
  rating: { sortBy: 'rating' },
  priceAsc: { sortBy: 'price', sortDir: 'asc' },
  priceDesc: { sortBy: 'price', sortDir: 'desc' },
}

export const doctorsApi = {
  specialties: () => api.get('/specialties').then((r) => r.data.map(mapSpecialty)),
  clinics: () => api.get('/clinics').then((r) => r.data),

  list: (f = {}) =>
    api
      .get('/doctors', {
        params: {
          q: f.search || undefined,
          specialtyId: f.specialtyId || undefined,
          clinicId: f.clinicId || undefined,
          minRating: f.minRating || undefined,
          maxPrice: f.maxPrice || undefined,
          ...(SORT[f.sort] ?? SORT.rating),
          page: f.page || 1,
          pageSize: f.pageSize || 9,
        },
      })
      .then((r) => mapPaged(r.data, mapDoctor)),

  get: (id) => api.get(`/doctors/${id}`).then((r) => mapDoctor(r.data)),
  schedule: (id) => api.get(`/doctors/${id}/schedule`).then((r) => r.data),
slots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }).then((r) => mapSlots(r.data, date)),
}