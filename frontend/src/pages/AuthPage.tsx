import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import {
  fetchInterests,
  forgotPassword,
  login,
  resetPassword,
  registerUser,
  sendOtp,
  uploadUserAvatar,
  updateProfile,
  verifyOtp,
  type ProfilePayload,
} from '../api'
import { getApiErrorMessage } from '../lib/errors'
import '../App.css'

import { LoginScreen } from '../components/auth/LoginScreen'
import { ForgotPasswordScreen } from '../components/auth/ForgotPasswordScreen'
import { ProfileScreen } from '../components/auth/ProfileScreen'
import { RegisterScreen } from '../components/auth/RegisterScreen'
import { VerifyScreen } from '../components/auth/VerifyScreen'
import { homePath, setAccessToken, takeAuthRedirectMessage } from '../lib/auth'
import type { Banner, FieldErrors, LoginForm, RegisterForm, RegistrationSession, Screen, CompleteProfileForm } from '../types/auth'

const otpLength = 6
const hustEmailDomain = '@sis.hust.edu.vn'
const hustLocalRegex = /^[a-zA-Z]+\.[a-zA-Z]+\d{6,7}$/
const passwordPolicyRegex = /^(?=.*[A-Z])(?=.*\d).+$/

const loginDefaults: LoginForm = {
  email: '',
  password: '',
}

const registerDefaults: RegisterForm = {
  email: '',
}

const completeProfileDefaults: CompleteProfileForm = {
  name: '',
  password: '',
  confirmPassword: '',
  gender: '',
  faculty: '',
  schoolYear: '',
  interests: [],
  bio: '',
  avatarUrl: '',
  avatarFile: null,
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isHustEmail(email: string) {
  const normalized = normalizeEmail(email)
  if (!normalized.endsWith(hustEmailDomain)) {
    return false
  }

  const localPart = normalized.split('@')[0]
  return hustLocalRegex.test(localPart)
}

function getApiMessages(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response
    const message = response?.data?.message

    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }

    if (typeof message === 'string' && message.trim()) {
      return [message]
    }

    const responseError = response?.data?.error
    if (typeof responseError === 'string' && responseError.trim()) {
      return [responseError]
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return [error.message]
  }

  return []
}

function getInitialScreen(): Screen {
  try {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    if (path.startsWith('/auth/')) {
      const maybe = path.split('/')[2]
      if (maybe === 'login' || maybe === 'register' || maybe === 'verify' || maybe === 'profile' || maybe === 'forgot') {
        return maybe as Screen
      }
    }
  } catch {
    return 'register'
  }

  return 'register'
}

export default function AuthPage() {
  const [pathname, setPathname] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/auth/register'
    } catch {
      return '/auth/register'
    }
  })
  const [screen, setScreen] = useState<Screen>(() => getInitialScreen())
  const [loginForm, setLoginForm] = useState<LoginForm>(loginDefaults)
  const [registerForm, setRegisterForm] = useState<RegisterForm>(registerDefaults)
  const [completeProfileForm, setCompleteProfileForm] = useState<CompleteProfileForm>(completeProfileDefaults)
  const [forgotForm, setForgotForm] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loginErrors, setLoginErrors] = useState<FieldErrors<keyof LoginForm>>({})
  const [registerErrors, setRegisterErrors] = useState<FieldErrors<'email'>>({})
  const [completeProfileErrors, setCompleteProfileErrors] = useState<FieldErrors<keyof CompleteProfileForm>>({})
  const [forgotErrors, setForgotErrors] = useState<
    FieldErrors<'email' | 'otp' | 'newPassword' | 'confirmPassword'>
  >({})
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: otpLength }, () => ''))
  const [banner, setBanner] = useState<Banner>(() => {
    if (getInitialScreen() !== 'login') {
      return null
    }

    const message = takeAuthRedirectMessage()
    return message ? { tone: 'info', text: message } : null
  })
  const [interestOptions, setInterestOptions] = useState<string[]>([])
  const [interestLoading, setInterestLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [forgotOtpLoading, setForgotOtpLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationSession | null>(() => {
    try {
      const raw = sessionStorage.getItem('pending_registration')
      if (!raw) {
        return null
      }
      const parsed = JSON.parse(raw) as RegistrationSession
      return parsed
    } catch {
      return null
    }
  })

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    let alive = true

    const loadInterests = async () => {
      try {
        const data = await fetchInterests()
        const interests = data?.interests

        if (!alive || !Array.isArray(interests)) {
          return
        }

        const normalized = interests.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
        setInterestOptions(normalized)
      } catch {
        if (alive) {
          setInterestOptions([])
        }
      } finally {
        if (alive) {
          setInterestLoading(false)
        }
      }
    }

    void loadInterests()

    return () => {
      alive = false
    }
  }, [])

  // persist pendingRegistration in sessionStorage so reloads don't lose progress
  useEffect(() => {
    try {
      if (pendingRegistration) {
        sessionStorage.setItem('pending_registration', JSON.stringify(pendingRegistration))
      } else {
        sessionStorage.removeItem('pending_registration')
      }
    } catch {
      return
    }
  }, [pendingRegistration])

  // sync screen <-> URL
  useEffect(() => {
    // when screen changes on auth routes, update browser URL (replaceState)
    try {
      if (!pathname.startsWith('/auth/')) {
        return
      }

      const path = `/auth/${screen}`
      if (pathname !== path) {
        window.history.replaceState(null, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    } catch {
      return
    }
  }, [screen, pathname])

  // Enforce auth step sequence: cannot visit verify/profile without prior steps completed
  useEffect(() => {
    try {
      if (screen === 'verify') {
        if (!pendingRegistration?.email) {
          setBanner({ tone: 'error', text: 'Vui lòng bắt đầu đăng ký trước.' })
          setScreen('register')
        }
      }

      if (screen === 'profile') {
        // require that OTP was verified and tempToken exists
        if (!pendingRegistration?.tempToken) {
          setBanner({ tone: 'error', text: 'Vui lòng xác thực email trước khi hoàn tất hồ sơ.' })
          setScreen('verify')
        }
      }
    } catch {
      return
    }
  }, [screen, pendingRegistration])

  useEffect(() => {
    const onPop = () => {
      try {
        const path = window.location.pathname
        setPathname(path)
        if (path.startsWith('/auth/')) {
          const maybe = path.split('/')[2]
          if (maybe === 'login' || maybe === 'register' || maybe === 'verify' || maybe === 'profile') {
            setScreen(maybe as Screen)
          }
          if (maybe === 'forgot') {
            setScreen(maybe as Screen)
          }
        }
      } catch {
        return
      }
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (screen !== 'verify') {
      return
    }

    const firstEmptyIndex = otpDigits.findIndex((digit) => !digit)
    const targetIndex = firstEmptyIndex === -1 ? otpLength - 1 : firstEmptyIndex
    otpInputRefs.current[targetIndex]?.focus()
  }, [screen, otpDigits])

  const updateLoginField = (field: keyof LoginForm, value: string) => {
    setLoginForm((current) => ({ ...current, [field]: value }))
    setLoginErrors((current) => ({ ...current, [field]: undefined }))
    setBanner(null)
  }

  const updateRegisterField = (value: string) => {
    setRegisterForm({ email: value })
    setRegisterErrors({})
    setBanner(null)
  }

  const updateForgotField = (
    field: 'email' | 'otp' | 'newPassword' | 'confirmPassword',
    value: string,
  ) => {
    const sanitizedValue = field === 'otp' ? value.replace(/\D/g, '').slice(0, otpLength) : value
    setForgotForm((current) => ({ ...current, [field]: sanitizedValue }))
    setForgotErrors((current) => ({ ...current, [field]: undefined }))
    setBanner(null)
  }

  const updateCompleteProfileField = (field: keyof CompleteProfileForm, value: string) => {
    setCompleteProfileForm((current) => ({ ...current, [field]: value }))
    setCompleteProfileErrors((current) => ({ ...current, [field]: undefined }))
    setBanner(null)
  }

  const updateCompleteProfileAvatar = (file: File | null, previewUrl: string) => {
    setCompleteProfileForm((current) => ({
      ...current,
      avatarFile: file,
      avatarUrl: previewUrl,
    }))
    setBanner(null)
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors<keyof LoginForm> = {}
    if (!loginForm.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email HUST'
    } else if (!isHustEmail(loginForm.email)) {
      nextErrors.email = 'Email HUST không đúng định dạng'
    }

    if (!loginForm.password.trim()) {
      nextErrors.password = 'Vui lòng nhập mật khẩu'
    }

    setLoginErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoginLoading(true)
    setBanner(null)

    try {
      const data = await login({
        email: normalizeEmail(loginForm.email),
        password: loginForm.password,
      })

      const accessToken = data?.accessToken
      if (typeof accessToken === 'string' && accessToken.trim()) {
        setAccessToken(accessToken)
      }

      setBanner({ tone: 'success', text: 'Đăng nhập thành công. Chuyển tới trang hoạt động…' })
      window.history.pushState(null, '', homePath)
      setPathname(homePath)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Đăng nhập thất bại') })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGoForgotPassword = () => {
    setForgotForm((current) => ({
      ...current,
      email: normalizeEmail(loginForm.email),
    }))
    setForgotErrors({})
    setBanner(null)
    setScreen('forgot')
  }

  const handleSendForgotOtp = async () => {
    const email = normalizeEmail(forgotForm.email)

    if (!email) {
      setForgotErrors({ email: 'Vui lòng nhập email HUST' })
      return
    }

    if (!isHustEmail(email)) {
      setForgotErrors({ email: 'Email HUST không đúng định dạng' })
      return
    }

    setForgotOtpLoading(true)
    setBanner(null)
    setForgotErrors((current) => ({ ...current, email: undefined }))

    try {
      await forgotPassword({ email })
      setForgotForm((current) => ({ ...current, email }))
      setBanner({ tone: 'success', text: 'Đã gửi OTP về email của bạn. Vui lòng kiểm tra hộp thư.' })
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Không thể gửi OTP đặt lại mật khẩu') })
    } finally {
      setForgotOtpLoading(false)
    }
  }

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors<'email' | 'otp' | 'newPassword' | 'confirmPassword'> = {}
    const email = normalizeEmail(forgotForm.email)
    const otp = forgotForm.otp.trim()
    const newPassword = forgotForm.newPassword
    const confirmPassword = forgotForm.confirmPassword

    if (!email) {
      nextErrors.email = 'Vui lòng nhập email HUST'
    } else if (!isHustEmail(email)) {
      nextErrors.email = 'Email HUST không đúng định dạng'
    }

    if (!otp) {
      nextErrors.otp = 'Vui lòng nhập OTP'
    } else if (!/^\d{6}$/.test(otp)) {
      nextErrors.otp = 'OTP phải đúng 6 chữ số'
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự'
    } else if (!passwordPolicyRegex.test(newPassword)) {
      nextErrors.newPassword = 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 chữ số'
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới'
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp'
    }

    setForgotErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setResetPasswordLoading(true)
    setBanner(null)

    try {
      await resetPassword({
        email,
        otp,
        newPassword,
      })
      setForgotErrors({})
      setForgotForm({
        email,
        otp: '',
        newPassword: '',
        confirmPassword: '',
      })
      setLoginForm((current) => ({ ...current, email }))
      setBanner({ tone: 'success', text: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.' })
      setScreen('login')
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Đặt lại mật khẩu thất bại') })
    } finally {
      setResetPasswordLoading(false)
    }
  }


  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors<'email'> = {}

    if (!registerForm.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email HUST'
    } else if (!isHustEmail(registerForm.email)) {
      nextErrors.email = 'Email HUST không đúng định dạng'
    }

    setRegisterErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setRegisterLoading(true)
    setBanner(null)

    const normalizedEmail = normalizeEmail(registerForm.email)

    try {
      await sendOtp({ email: normalizedEmail })

      setPendingRegistration({
        email: normalizedEmail,
        tempToken: '',
        prefill: {
          firstName: '',
          studentId: '',
          schoolYear: 1,
        },
      })
      setOtpDigits(Array.from({ length: otpLength }, () => ''))
      setCompleteProfileForm(completeProfileDefaults)
      setCompleteProfileErrors({})
      setBanner({ tone: 'success', text: 'Đã gửi mã xác thực đến email HUST của bạn.' })
      setScreen('verify')
    } catch (error) {
      const apiMessages = getApiMessages(error)
      if (apiMessages.length > 0) {
        setRegisterErrors({ email: apiMessages[0] })
      } else {
        setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Gửi mã xác thực thất bại') })
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleOtpDigitChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, '').slice(-1)
    setOtpDigits((current) => {
      const nextDigits = [...current]
      nextDigits[index] = nextValue
      return nextDigits
    })

    setBanner(null)

    if (nextValue && index < otpLength - 1) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
      setOtpDigits((current) => {
        const nextDigits = [...current]
        nextDigits[index - 1] = ''
        return nextDigits
      })
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pastedDigits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, otpLength)
      .split('')

    if (pastedDigits.length === 0) {
      return
    }

    setOtpDigits(() => Array.from({ length: otpLength }, (_, index) => pastedDigits[index] ?? ''))

    otpInputRefs.current[Math.min(pastedDigits.length, otpLength) - 1]?.focus()
    setBanner(null)
  }

  const handleVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const otpValue = otpDigits.join('')
    if (otpValue.length !== otpLength) {
      setBanner({ tone: 'error', text: 'OTP phải đúng 6 chữ số' })
      return
    }

    if (!pendingRegistration) {
      setBanner({ tone: 'error', text: 'Thiếu thông tin đăng ký. Vui lòng quay lại màn hình đăng ký.' })
      return
    }

    setVerifyLoading(true)
    setBanner(null)

    try {
      const data = await verifyOtp({
        email: pendingRegistration.email,
        otp: otpValue,
      })

      const tempToken = data?.tempToken
      const prefill = data?.prefill ?? {}

      if (typeof tempToken !== 'string' || !tempToken.trim()) {
        throw new Error('Không nhận được tempToken từ máy chủ')
      }

      setPendingRegistration((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          tempToken,
          prefill: {
            firstName: typeof prefill.firstName === 'string' ? prefill.firstName : current.prefill.firstName,
            studentId: typeof prefill.studentId === 'string' ? prefill.studentId : current.prefill.studentId,
            schoolYear:
              typeof prefill.schoolYear === 'number' ? prefill.schoolYear : current.prefill.schoolYear,
          },
        }
      })

      // Move to complete profile screen - do not create account yet
      setCompleteProfileForm((current) => {
        const next = { ...current }
        if (pendingRegistration?.email?.toLowerCase() === 'anh.nq225785@sis.hust.edu.vn') {
          next.name = 'Anh'
          next.password = 'Matkhau,148'
          next.confirmPassword = 'Matkhau,148'
          next.gender = 'female'
          next.faculty = 'Khoa giáo dục thể chất'
          next.schoolYear = '3'
          next.bio = 'Tài khoản demo HUST'
          if (interestOptions && interestOptions.length > 0) {
            next.interests = interestOptions.slice(0, 3)
          } else {
            next.interests = []
          }
        } else {
          next.name = typeof prefill.firstName === 'string' ? prefill.firstName : ''

          // determine school year: prefer server prefill, else try to infer from studentId or email
          if (typeof prefill.schoolYear === 'number') {
            next.schoolYear = String(prefill.schoolYear)
          } else {
            let inferred: number | null = null
            const sid = typeof prefill.studentId === 'string' ? prefill.studentId.trim() : ''
            // if studentId begins with 4-digit year
            const sidMatch = sid.match(/^(20\d{2})/) // e.g. 2022xxxx
            if (sidMatch) {
              const admit = Number(sidMatch[1])
              const now = new Date().getFullYear()
              const year = now - admit + 1
              if (year >= 1 && year <= 10) inferred = year
            }

            // fallback: try to find 4-digit year in email
            if (inferred === null) {
              const emailYearMatch = pendingRegistration?.email?.match(/20\d{2}/)
              if (emailYearMatch) {
                const admit = Number(emailYearMatch[0])
                const now = new Date().getFullYear()
                const year = now - admit + 1
                if (year >= 1 && year <= 10) inferred = year
              }
            }

            next.schoolYear = inferred ? String(inferred) : ''
          }
        }

        return next
      })
      setCompleteProfileErrors({})
      setBanner({ tone: 'success', text: 'Email xác thực thành công. Vui lòng hoàn thiện hồ sơ.' })
      setScreen('profile')
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Xác thực OTP thất bại') })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!pendingRegistration) {
      setBanner({ tone: 'error', text: 'Thiếu email đăng ký. Vui lòng quay lại màn đăng ký.' })
      return
    }

    setResendLoading(true)
    setBanner(null)

    try {
      await sendOtp({ email: pendingRegistration.email })
      setOtpDigits(Array.from({ length: otpLength }, () => ''))
      setBanner({ tone: 'success', text: 'Đã gửi lại mã xác thực mới.' })
      otpInputRefs.current[0]?.focus()
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Gửi lại mã thất bại') })
    } finally {
      setResendLoading(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setCompleteProfileForm((current) => {
      const isSelected = current.interests.includes(interest)
      const nextInterests = isSelected
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest]

      return { ...current, interests: nextInterests }
    })
    setBanner(null)
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors<keyof CompleteProfileForm> = {}

    // Tên được auto-fill từ HUST, không validate
    // const name_valid = completeProfileForm.name.trim()
    // if (!name_valid) nextErrors.name = 'Vui lòng nhập tên'

    if (!completeProfileForm.password.trim()) {
      nextErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (completeProfileForm.password.length < 8) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    } else if (!passwordPolicyRegex.test(completeProfileForm.password)) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 chữ số'
    }

    if (!completeProfileForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu'
    } else if (completeProfileForm.confirmPassword !== completeProfileForm.password) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp'
    }

    if (!completeProfileForm.gender) {
      nextErrors.gender = 'Vui lòng chọn giới tính'
    }

    // Validate profile fields
    if (!completeProfileForm.faculty.trim()) {
      nextErrors.faculty = 'Vui lòng chọn khoa / viện'
    }

    if (!completeProfileForm.schoolYear.trim()) {
      nextErrors.schoolYear = 'Vui lòng chọn năm học'
    }

    if (completeProfileForm.bio.trim().length > 200) {
      nextErrors.bio = 'Giới thiệu không được vượt quá 200 ký tự'
    }

    setCompleteProfileErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (!pendingRegistration) {
      setBanner({ tone: 'error', text: 'Thiếu thông tin đăng ký. Vui lòng làm lại luồng OTP.' })
      return
    }

    setProfileLoading(true)
    setBanner(null)

    try {
      // Step 1: Register the user account with name, password, gender
      const gender = completeProfileForm.gender
       if (gender !== 'male' && gender !== 'female') {
         throw new Error('Giới tính không hợp lệ. Vui lòng chọn nam hoặc nữ.')
       }

      const registerData = await registerUser({
        name: completeProfileForm.name.trim(),
        password: completeProfileForm.password,
        tempToken: pendingRegistration.tempToken,
        gender,
      })

      const accessToken = registerData?.accessToken
      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        throw new Error('Không nhận được accessToken từ máy chủ')
      }

      let avatarUrl = completeProfileForm.avatarUrl?.trim() || null
      if (completeProfileForm.avatarFile) {
        const avatarResult = await uploadUserAvatar(completeProfileForm.avatarFile, { token: accessToken })
        avatarUrl = avatarResult?.secureUrl?.trim() || avatarUrl
      }

      // Step 2: Update profile with additional information
      const payload: ProfilePayload = {
        name: completeProfileForm.name.trim(),
        faculty: completeProfileForm.faculty.trim() || null,
        schoolYear: Number(completeProfileForm.schoolYear) || null,
        avatarUrl,
        bio: completeProfileForm.bio.trim() || null,
      }

      // Only include interests that exist in the fetched interestOptions to avoid DB validation errors
      let safeInterests: string[] = []
      if (
        Array.isArray(completeProfileForm.interests) &&
        completeProfileForm.interests.length > 0 &&
        Array.isArray(interestOptions)
      ) {
        safeInterests = completeProfileForm.interests.filter((it) => interestOptions.includes(it))
      }

      if (safeInterests.length > 0) {
        payload.interests = safeInterests
      }




      await updateProfile(payload, { token: accessToken })
      setAccessToken(accessToken)

      setPendingRegistration(null)
      setRegisterForm(registerDefaults)
      setLoginForm(loginDefaults)
      setOtpDigits(Array.from({ length: otpLength }, () => ''))
      setCompleteProfileForm(completeProfileDefaults)
      setBanner({ tone: 'success', text: 'Đăng ký thành công! Chuyển tới trang hoạt động...' })
      window.history.pushState(null, '', homePath)
      setPathname(homePath)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Hoàn tất đăng ký thất bại') })
    } finally {
      setProfileLoading(false)
    }
  }

  const resetRegisterFlow = () => {
    setPendingRegistration(null)
    setOtpDigits(Array.from({ length: otpLength }, () => ''))
    setCompleteProfileForm(completeProfileDefaults)
    setBanner(null)
    setScreen('register')
  }

  return (
    <main className={`auth-page auth-page-${screen}`}>
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-frame">
        <header className="brand-bar">
          <div className="brand-mark" aria-hidden="true">
            BH
          </div>
          <div className="brand-copy">
            <strong>BuddyHub</strong>
            <span>Cộng đồng dành cho sinh viên HUST</span>
          </div>
        </header>

        <section className={`flow-wrap ${screen === 'profile' ? 'flow-wrap-profile' : ''}`}>
          <article className={`auth-card auth-card-${screen}`}>
            {screen === 'login' && (
              <LoginScreen
                form={loginForm}
                errors={loginErrors}
                loading={loginLoading}
                banner={banner}
                onChange={updateLoginField}
                onSubmit={handleLoginSubmit}
                onGoRegister={() => setScreen('register')}
                onGoForgotPassword={handleGoForgotPassword}
              />
            )}

            {screen === 'forgot' && (
              <ForgotPasswordScreen
                form={forgotForm}
                errors={forgotErrors}
                banner={banner}
                sendingOtp={forgotOtpLoading}
                resettingPassword={resetPasswordLoading}
                canSendOtp={isHustEmail(forgotForm.email)}
                onChange={updateForgotField}
                onSendOtp={handleSendForgotOtp}
                onSubmit={handleForgotSubmit}
                onGoLogin={() => setScreen('login')}
              />
            )}

            {screen === 'register' && (
              <RegisterScreen
                email={registerForm.email}
                errors={registerErrors}
                loading={registerLoading}
                banner={banner}
                onChange={(value) => updateRegisterField(value)}
                onSubmit={handleRegisterSubmit}
                onGoLogin={() => setScreen('login')}
              />
            )}

            {screen === 'verify' && (
              <VerifyScreen
                email={pendingRegistration?.email ?? ''}
                studentId={pendingRegistration?.prefill.studentId}
                otpDigits={otpDigits}
                loading={verifyLoading}
                resendLoading={resendLoading}
                banner={banner}
                onOtpDigitChange={handleOtpDigitChange}
                onOtpKeyDown={handleOtpKeyDown}
                onOtpPaste={handleOtpPaste}
                onSubmit={handleVerifySubmit}
                onResend={handleResendOtp}
                onBack={resetRegisterFlow}
                inputRef={(index, element) => {
                  otpInputRefs.current[index] = element
                }}
              />
            )}

            {screen === 'profile' && (
              <ProfileScreen
                email={pendingRegistration?.email ?? ''}
                form={completeProfileForm}
                errors={completeProfileErrors}
                loading={profileLoading}
                banner={banner}
                interestOptions={interestOptions}
                interestLoading={interestLoading}
                onChange={updateCompleteProfileField}
                onAvatarChange={updateCompleteProfileAvatar}
                onToggleInterest={toggleInterest}
                onSubmit={handleProfileSubmit}
              />
            )}
          </article>
        </section>

        <footer className="page-footer">Chỉ dành cho sinh viên Đại học Bách Khoa Hà Nội</footer>
      </section>
    </main>
  )
}
