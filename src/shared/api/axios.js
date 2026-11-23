import axios from 'axios'
import { API_URL } from '@/shared/config/env'
import { useAuthStore } from '@/features/auth/authStore'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// يضيف الـ JWT واللغة على كل طلب
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = localStorage.getItem('lang') || 'ar'
  return config
})

// 401 = الجلسة خلصت، نرجّع المستخدم لصفحة الدخول
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout()
      if (!location.pathname.startsWith('/login')) {
        location.assign('/login?expired=1')
      }
    }
    return Promise.reject(error)
  },
)

// يطلّع رسالة خطأ مفهومة من ProblemDetails (detail / title) أو من errors (validation)
export function getErrorMessage(error, fallback = 'حصل خطأ غير متوقع') {
  const res = error?.response
  const data = res?.data
  if (!data || (typeof data === 'string' && !data.trim())) {
    // من غير body: الباك مش شغال (الـ proxy بيرجّع 500 فاضي) أو مفيش شبكة
    if (!res || res.status >= 500) return 'مش قادر أوصل للسيرفر. اتأكد إن الـ API شغال'
    return fallback
  }
  if (typeof data === 'string') return data
  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0]
    if (first) return first
  }
  return data.detail ?? data.message ?? data.title ?? fallback
}

// أخطاء كل حقل من الـ validation: { email: '...', password: '...' } (المفاتيح camelCase)
export function getFieldErrors(error) {
  const errs = error?.response?.data?.errors
  if (!errs || typeof errs !== 'object') return {}
  const out = {}
  for (const [k, v] of Object.entries(errs)) {
    const key = k.replace(/^\$\./, '')
    out[key.charAt(0).toLowerCase() + key.slice(1)] = Array.isArray(v) ? v[0] : String(v)
  }
  return out
}
