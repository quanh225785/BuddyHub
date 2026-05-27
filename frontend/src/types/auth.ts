export type Screen = 'login' | 'register' | 'verify' | 'profile'

export type LoginForm = {
  email: string
  password: string
}

export type RegisterForm = {
  email: string
}

export type VerifyForm = {
  otp: string
}

export type CompleteProfileForm = {
  name: string
  password: string
  confirmPassword: string
  gender: 'male' | 'female' | ''
  faculty: string
  schoolYear: string
  interests: string[]
  bio: string
  avatarUrl?: string | null
  avatarFile?: File | null
}

export type ProfileForm = {
  name: string
  faculty: string
  schoolYear: string
  interests: string[]
  bio: string
}

export type RegistrationSession = {
  email: string
  tempToken: string
  prefill: {
    firstName: string
    studentId: string
    schoolYear: number
  }
  accessToken?: string
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export type Banner = {
  tone: 'info' | 'error' | 'success'
  text: string
} | null
