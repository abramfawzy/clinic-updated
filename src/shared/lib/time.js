// أدوات الأوقات اللي بيتعامل بيها الباك (TimeOnly / DayOfWeek / DateTime UTC)

// ترتيبهم نفس System.DayOfWeek: 0 = الأحد
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// "09:00:00" ← "09:00"
export const toHHmm = (t) => (t ? String(t).slice(0, 5) : '')

// "09:00" ← "09:00:00" (الباك بيستنى HH:mm:ss)
export const toHHmmss = (t) => (t && String(t).length === 5 ? `${t}:00` : t)

// الباك أحياناً بيرجّع تاريخ UTC من غير Z. من غير Z المتصفح بيفهمه توقيت محلي ويطلع غلط
export const parseUtc = (s) => {
  if (!s) return null
  const str = String(s).trim()
  if (!str) return null
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(str) ? str : `${str}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

// بداية ونهاية اليوم بتوقيت المتصفح، كـ ISO UTC (الباك بيحول لـ UTC ويخزن)
export const dayStartISO = (yyyyMMdd) => new Date(`${yyyyMMdd}T00:00:00`).toISOString()
export const dayEndISO = (yyyyMMdd) => new Date(`${yyyyMMdd}T23:59:00`).toISOString()