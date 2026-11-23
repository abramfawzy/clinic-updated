import i18n from '@/shared/i18n'

const locale = () => (i18n.language === 'ar' ? 'ar-EG' : 'en-GB')

export const formatMoney = (n) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(n ?? 0) +
  ' ' +
  i18n.t('common.egp')

export const formatNumber = (n) => new Intl.NumberFormat(locale()).format(n ?? 0)

export const formatDate = (d) =>
  d
    ? new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(
        new Date(d),
      )
    : ''

export const formatTime = (d) =>
  d
    ? new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
    : ''

export const formatDateTime = (d) => (d ? `${formatDate(d)} - ${formatTime(d)}` : '')

// yyyy-MM-dd بتوقيت الجهاز
export const toISODate = (d) => {
  const x = new Date(d)
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${x.getFullYear()}-${m}-${day}`
}

export const nextDays = (count = 7) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
