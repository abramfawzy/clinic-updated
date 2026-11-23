import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// يفك الـ payload بتاع الـ JWT (من غير التحقق من التوقيع، ده شغل الباك)
export function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

export function userFromToken(token) {
  const p = parseJwt(token)
  if (!p) return null
  const role = p.role ?? p[ROLE_CLAIM]
  return {
    id: p.sub ?? p.nameid,
    name: p.name ?? p[NAME_CLAIM] ?? p.email,
    email: p.email,
    role: Array.isArray(role) ? role[0] : role,
    patientId: p.patient_id ?? null,
    doctorId: p.doctor_id ?? null,
    clinicId: p.clinic_id ?? null,
    exp: p.exp,
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,

      setSession: ({ token, refreshToken }) =>
        set({ token, refreshToken: refreshToken ?? null, user: userFromToken(token) }),

      logout: () => set({ token: null, refreshToken: null, user: null }),

      isAuthenticated: () => {
        const { token, user } = get()
        if (!token || !user) return false
        return !user.exp || user.exp * 1000 > Date.now()
      },
    }),
    { name: 'clinic-auth' },
  ),
)
