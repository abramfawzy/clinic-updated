import { create } from 'zustand'

function apply(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* ignore */
  }
}

const initial = document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export const useTheme = create((set, get) => ({
  theme: initial,
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    apply(next)
    set({ theme: next })
  },
}))
