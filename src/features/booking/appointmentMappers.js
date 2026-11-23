import { parseUtc } from '@/shared/lib/time'

export const first = (...v) => v.find((x) => x !== undefined && x !== null)

const iso = (v) => parseUtc(v)?.toISOString() ?? null
const isPaid = (v) => String(v ?? '').toLowerCase() === 'paid'

export const mapAttachment = (f) => ({
  id: f.id,
  appointmentId: f.appointmentId ?? null,
  name: first(f.fileName, f.name, f.originalFileName, f.title) ?? `#${f.id}`,
  size: Number(first(f.sizeBytes, f.fileSizeBytes, f.size, f.length) ?? 0),
  uploadedAt: iso(first(f.uploadedAtUtc, f.createdAtUtc, f.uploadedAt, f.createdAt)),
  contentType: first(f.contentType, f.mimeType),
})

export function mapAppointment(a) {
  const method = first(a.paymentMethod, a.payment?.method)
  const type = first(a.type, a.appointmentType)
  return {
    id: a.id,
    doctorId: first(a.doctorId, a.doctor?.id),
    doctorName: first(a.doctorName, a.doctorFullName, a.doctor?.fullName) ?? '',
    patientId: first(a.patientId, a.patient?.id),
    patientName: first(a.patientName, a.patientFullName, a.patient?.fullName) ?? '',
    start: iso(first(a.startAtUtc, a.startAt, a.startTimeUtc, a.start)),
    end: iso(first(a.endAtUtc, a.endAt, a.endTimeUtc, a.end)),
    status: String(first(a.status, a.appointmentStatus) ?? ''),
    isFollowUp: first(a.isFollowUp, type === 'FollowUp' || type === 1) === true,
    paymentMethod:
      method === 1 ||
      String(method).toLowerCase() === 'atclinic' ||
      String(method).toLowerCase() === 'clinic'
        ? 'Clinic'
        : 'Online',
    paymentStatus: isPaid(first(a.paymentStatus, a.payment?.status)) || a.isPaid === true ? 'Paid' : 'Unpaid',
    price: Number(first(a.priceSnapshot, a.price, a.totalAmount, a.amount, a.finalPrice, a.fee) ?? 0),
    expiresAt: iso(first(a.expiresAtUtc, a.paymentExpiresAtUtc, a.holdExpiresAtUtc, a.expiresAt)),
    completedAt: iso(first(a.completedAtUtc, a.completedAt)),
    notes: first(a.notes, a.doctorNotes),
    rated: first(a.isRated, a.rated, a.hasReview) === true,
    attachments: (a.attachments ?? []).map(mapAttachment),
  }
}

export function mapSlots(data, dateStr = '') {
  const list = Array.isArray(data) ? data : (data?.slots ?? data?.items ?? [])
  return list
    .map((s) => {
      if (typeof s === 'string') {
        const full = s.includes('T') || !dateStr ? s : `${dateStr}T${s}Z`
        return { start: iso(full), available: true }
      }
      const available = first(s.isAvailable, s.available, s.isFree)
      return {
        start: iso(first(s.startAtUtc, s.startAt, s.startTimeUtc, s.start)),
        end: iso(first(s.endAtUtc, s.endAt, s.endTimeUtc, s.end)),
        available: available === undefined ? true : available === true,
      }
    })
    .filter((s) => s.start)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
}

export const mapCoupon = (c) => {
  const type = String(first(c.discountType, 'Percent'))
  const value = Number(first(c.discountValue, c.discountPercent, c.percent, c.value) ?? 0)
  return {
    id: c.id,
    code: c.code,
    discountType: type,
    discountValue: value,
    percent: type === 'Percent' ? value : 0,
    originalAmount: c.originalAmount != null ? Number(c.originalAmount) : null,
    discountAmount: c.discountAmount != null ? Number(c.discountAmount) : null,
    finalAmount: c.finalAmount != null ? Number(c.finalAmount) : null,
    usedCount: Number(first(c.usedCount, c.timesUsed, c.usageCount) ?? 0),
    isActive: first(c.isActive, c.active) !== false,
  }
}