import { useTranslation } from 'react-i18next'
import { setLanguage } from '@/shared/i18n'
import { useTheme } from '@/shared/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} className="btn-outline px-3" aria-label="theme" title="Dark / Light">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

export function LangToggle() {
  const { i18n } = useTranslation()
  const next = i18n.language === 'ar' ? 'en' : 'ar'
  return (
    <button onClick={() => setLanguage(next)} className="btn-outline px-3 font-bold">
      {next === 'en' ? 'EN' : 'ع'}
    </button>
  )
}

export function Logo() {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-2 text-lg font-bold text-brand-700 dark:text-brand-400">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">+</span>
      {t('app.name')}
    </span>
  )
}
