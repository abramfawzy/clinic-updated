const isDev = import.meta.env.DEV

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (isDev ? '/api' : 'https://depi-e-commerce.runasp.net/api')

export const HUB_URL =
  import.meta.env.VITE_HUB_URL ??
  (isDev ? '' : 'https://depi-e-commerce.runasp.net')

export const ROLES = {
  Admin: 'Admin',
  Doctor: 'Doctor',
  Patient: 'Patient',
  Receptionist: 'Receptionist',
}

export const ROLE_HOME = {
  Admin: '/admin',
  Doctor: '/doctor',
  Patient: '/',
  Receptionist: '/reception',
}