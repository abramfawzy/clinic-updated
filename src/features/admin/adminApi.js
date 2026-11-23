import { api } from '@/shared/api/axios'
import { mapDoctor, mapPaged } from '@/features/doctors/doctorMappers'
import { mapCoupon } from '@/features/booking/appointmentMappers'

export const adminApi = {
  doctors: (f = {}) =>
    api
      .get('/admin/doctors', {
        params: {
          isApproved: f.isApproved,
          specialtyId: f.specialtyId || undefined,
          clinicId: f.clinicId || undefined,
          q: f.search || undefined,
          page: f.page || 1,
          pageSize: f.pageSize || 100,
        },
      })
      .then((r) => mapPaged(r.data, mapDoctor)),

  createDoctor: (f) =>
    api
      .post('/admin/doctors', {
        email: f.email,
        password: f.password,
        fullName: f.fullName,
        phoneNumber: f.phoneNumber || null,
        specialtyId: Number(f.specialtyId),
        clinicId: Number(f.clinicId),
        bio: f.bio || null,
        yearsOfExperience: Number(f.yearsOfExperience),
        consultationFee: Number(f.consultationFee),
        followUpFeePercent: Number(f.followUpFeePercent),
        followUpWindowDays: Number(f.followUpWindowDays),
      })
      .then((r) => mapDoctor(r.data)),

  approveDoctor: (id) => api.patch(`/admin/doctors/${id}/approve`).then((r) => mapDoctor(r.data)),
  unapproveDoctor: (id) => api.patch(`/admin/doctors/${id}/unapprove`).then((r) => mapDoctor(r.data)),

  clinics: () => api.get('/clinics', { params: { includeInactive: true } }).then((r) => r.data),
  addClinic: (data) => api.post('/clinics', data).then((r) => r.data),
  updateClinic: (id, data) => api.put(`/clinics/${id}`, data).then((r) => r.data),
  removeClinic: (id) => api.delete(`/clinics/${id}`),

  addSpecialty: (data) => api.post('/specialties', data).then((r) => r.data),
  removeSpecialty: (id) => api.delete(`/specialties/${id}`),

  receptionists: () => api.get('/admin/receptionists').then((r) => r.data),
  createReceptionist: (data) => api.post('/admin/receptionists', data).then((r) => r.data),
  removeReceptionist: (id) => api.delete(`/admin/receptionists/${id}`),

  coupons: () => api.get('/admin/coupons').then((r) => (r.data.items ?? r.data).map(mapCoupon)),
  addCoupon: ({ code, percent, discountType = 'Percent', expiresAt, maxUses = 100 }) =>
    api
      .post('/admin/coupons', {
        code: code.trim(),
        discountType,
        discountValue: Number(percent),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString(),
        maxUses: Number(maxUses),
        isActive: true,
      })
      .then((r) => mapCoupon(r.data)),
  removeCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  async stats() {
    const [docs, clinics, recs] = await Promise.all([
      adminApi.doctors({ pageSize: 100 }),
      adminApi.clinics(),
      adminApi.receptionists(),
    ])
    return {
      doctorsCount: docs.totalCount ?? docs.items?.length ?? 0,
      clinicsCount: clinics.length ?? 0,
      receptionistsCount: recs.length ?? 0,
      appointmentsCount: 0,
      revenue: 0,
    }
  },
}