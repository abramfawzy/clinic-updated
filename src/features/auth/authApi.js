import { api } from '@/shared/api/axios'

export const authApi = {
  login: async (data) => {
    const r = (await api.post('/auth/login', data)).data
    return { token: r.accessToken, refreshToken: null, expiresAtUtc: r.expiresAtUtc, user: r.user }
  },

  register: (data) => api.post('/auth/register', data).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),

  updateMe: (data) => api.put('/auth/me', data).then((r) => r.data),
}