import { api } from '@/shared/api/axios'
import { first, mapAttachment } from '@/features/booking/appointmentMappers'

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
const STORAGE_KEY = 'clinic_uploaded_attachments'

const KEYS = {
  chronic: ['chronicConditions', 'chronicDiseases', 'chronic'],
  allergies: ['allergies'],
  medications: ['currentMedications', 'medications'],
}

export function mapHistory(d = {}) {
  const keys = {}
  const form = {}
  for (const [k, names] of Object.entries(KEYS)) {
    keys[k] = names.find((n) => d?.[n] !== undefined) ?? names[0]
    form[k] = first(...names.map((n) => d?.[n])) ?? ''
  }
  return { form, keys }
}

function getSavedAttachments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAttachmentLocally(att) {
  const list = getSavedAttachments().filter((x) => x.id !== att.id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([att, ...list]))
}

export const medicalApi = {
  me: () => api.get('/medical-history/me').then((r) => mapHistory(r.data)),
  save: (form, keys) =>
    api
      .put('/medical-history/me', {
        [keys.chronic]: form.chronic || null,
        [keys.allergies]: form.allergies || null,
        [keys.medications]: form.medications || null,
      })
      .then((r) => r.data),

  savedAttachments: () => getSavedAttachments(),

  upload: ({ appointmentId, file }) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post(`/appointments/${appointmentId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => {
        const mapped = mapAttachment({ appointmentId: Number(appointmentId), ...r.data })
        saveAttachmentLocally(mapped)
        return mapped
      })
  },

  async open(attachment) {
    const res = await api.get(`/attachments/${attachment.id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.download = attachment.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },
}