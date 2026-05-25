import api from './lib/axios'

type AuthLoginPayload = {
  email: string
  password: string
}

type SendOtpPayload = {
  email: string
}

type VerifyOtpPayload = {
  email: string
  otp: string
}

type RegisterPayload = {
  name: string
  password: string
  tempToken: string
  gender: 'male' | 'female'
}

type ProfilePayload = {
  name: string
  faculty?: string | null
  schoolYear?: number | null
  bio?: string | null
  interests?: string[]
}

type AuthHeaderOptions = {
  token?: string
}

function withAuthHeader(options?: AuthHeaderOptions) {
  if (options?.token) {
    return { headers: { Authorization: `Bearer ${options.token}` } }
  }

  return undefined
}

export async function fetchInterests() {
  const response = await api.get('/interests')
  return response.data
}

export async function login(payload: AuthLoginPayload) {
  const response = await api.post('/auth/login', payload)
  return response.data
}

export async function sendOtp(payload: SendOtpPayload) {
  const response = await api.post('/auth/send-otp', payload)
  return response.data
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await api.post('/auth/verify-otp', payload)
  return response.data
}

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post('/auth/register', payload)
  return response.data
}

export async function getMe(options?: AuthHeaderOptions) {
  const response = await api.get('/users/me', withAuthHeader(options))
  return response.data
}

export async function updateProfile(payload: ProfilePayload, options?: AuthHeaderOptions) {
  const response = await api.put('/users/me/profile', payload, withAuthHeader(options))
  return response.data
}

export async function getDashboard() {
  const response = await api.get('/users/me/dashboard')
  return response.data
}
