import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './ar.json'
import en from './en.json'
import { queryClient } from '@/shared/api/queryClient'

const saved = localStorage.getItem('lang') || 'ar'

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: saved,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
})

export function applyDirection(lang) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

applyDirection(saved)

export function setLanguage(lang) {
  localStorage.setItem('lang', lang)
  i18n.changeLanguage(lang)
  applyDirection(lang)
  // أسماء التخصصات والعيادات بتتحول للغة الجديدة لما البيانات تتحمل تاني
  queryClient.invalidateQueries()
}

export default i18n
