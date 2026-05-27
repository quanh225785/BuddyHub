import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import {
  fetchInterests,
  getMe,
  login,
  registerUser,
  sendOtp,
  updateProfile,
  verifyOtp,
  type ProfilePayload,
} from '../api'
import { getApiErrorMessage } from '../lib/errors'
import '../App.css'

import { LoginScreen } from '../components/auth/LoginScreen'
import { ProfileScreen } from '../components/auth/ProfileScreen'
import { RegisterScreen } from '../components/auth/RegisterScreen'
import { VerifyScreen } from '../components/auth/VerifyScreen'
import type { Banner, FieldErrors, LoginForm, ProfileForm, RegisterForm, RegistrationSession, Screen } from '../types/auth'

const otpLength = 6
const hustEmailDomain = '@sis.hust.edu.vn'
const hustLocalRegex = /^[a-zA-Z]+\.[a-zA-Z]+\d{6,7}$/
const passwordPolicyRegex = /^(?=.*[A-Z])(?=.*\d).+$/

const loginDefaults: LoginForm = {
  email: '',
  password: '',
}

const registerDefaults: RegisterForm = {
  name: '',
  email: '',
  gender: '',
  password: '',
  confirmPassword: '',
}

const profileDefaults: ProfileForm = {
  name: '',
  faculty: '',
  schoolYear: '',
  interests: [],
  bio: '',
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

function mapRegisterApiErrors(error: unknown): FieldErrors<keyof RegisterForm> {
  const apiMessages = getApiMessages(error)
  const nextErrors: FieldErrors<keyof RegisterForm> = {}

  for (const message of apiMessages) {
    const lower = message.toLowerCase()

    if (!nextErrors.confirmPassword && (lower.includes('nhập lại') || lower.includes('không khớp') || lower.includes('confirm'))) {
      nextErrors.confirmPassword = message
      continue
    }

    if (!nextErrors.password && (lower.includes('mật khẩu') || lower.includes('password'))) {
      nextErrors.password = message
      continue
    }

    if (!nextErrors.email && lower.includes('email')) {
      nextErrors.email = message
      continue
    }

    if (!nextErrors.name && (lower.includes('tên') || lower.includes('name'))) {
      nextErrors.name = message
    }
  }

  return nextErrors
}

function formatSchoolYearLabel(value: number) {
  if (value <= 0) {
    return 'Năm học'
  }

  return value === 1 ? 'Năm 1' : value <= 5 ? `Năm ${value}` : 'Cao học'
}

export default function AuthPage() {
  const [pathname, setPathname] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/auth/register'
    } catch {
      return '/auth/register'
    }
  })
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (path.startsWith('/auth/')) {
        const maybe = path.split('/')[2]
        if (maybe === 'login' || maybe === 'register' || maybe === 'verify' || maybe === 'profile') {
          return maybe as Screen
        }
      }
    } catch {}

    return 'register'
  })
  const [loginForm, setLoginForm] = useState<LoginForm>(loginDefaults)
  const [registerForm, setRegisterForm] = useState<RegisterForm>(registerDefaults)
  const [profileForm, setProfileForm] = useState<ProfileForm>(profileDefaults)
  const [loginErrors, setLoginErrors] = useState<FieldErrors<keyof LoginForm>>({})
  const [registerErrors, setRegisterErrors] = useState<FieldErrors<keyof RegisterForm>>({})
  const [profileErrors, setProfileErrors] = useState<FieldErrors<keyof ProfileForm>>({})
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: otpLength }, () => ''))
  const [banner, setBanner] = useState<Banner>(null)
  const [interestOptions, setInterestOptions] = useState<string[]>([])
  const [interestLoading, setInterestLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationSession | null>(() => {
    try {
      const raw = sessionStorage.getItem('pending_registration')
      if (!raw) {
        return null
      }
      const parsed = JSON.parse(raw) as RegistrationSession
      if (parsed.gender !== 'male' && parsed.gender !== 'female') {
        return null
      }
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
    } catch {}
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
        setPathname(path)
      }
    } catch {}
  }, [screen, pathname])

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
        }
      } catch {}
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

  const updateRegisterField = (field: keyof RegisterForm, value: string) => {
    setRegisterForm((current) => ({ ...current, [field]: value }))
    setRegisterErrors((current) => ({ ...current, [field]: undefined }))
    setBanner(null)
  }

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
    setProfileErrors((current) => ({ ...current, [field]: undefined }))
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
        localStorage.setItem('access_token', accessToken)
      }

      setBanner({ tone: 'success', text: 'Đăng nhập thành công. Chuyển tới trang hồ sơ…' })
      window.history.pushState(null, '', '/me')
      setPathname('/me')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Đăng nhập thất bại') })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors<keyof RegisterForm> = {}

    if (!registerForm.name.trim()) {
      nextErrors.name = 'Vui lòng nhập tên'
    } else if (registerForm.name.trim().length < 2) {
      nextErrors.name = 'Tên phải có ít nhất 2 ký tự'
    }

    if (!registerForm.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email HUST'
    } else if (!isHustEmail(registerForm.email)) {
      nextErrors.email = 'Email HUST không đúng định dạng'
    }

    if (!registerForm.gender) {
      nextErrors.gender = 'Vui lòng chọn giới tính'
    }

    if (!registerForm.password.trim()) {
      nextErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (registerForm.password.length < 8) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    } else if (!passwordPolicyRegex.test(registerForm.password)) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 chữ số'
    }

    if (!registerForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu'
    } else if (registerForm.confirmPassword !== registerForm.password) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp'
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
        password: registerForm.password,
        name: registerForm.name.trim(),
        gender: registerForm.gender as 'male' | 'female',
        tempToken: '',
        prefill: {
          firstName: registerForm.name.trim().split(/\s+/)[0] ?? registerForm.name.trim(),
          studentId: '',
          schoolYear: 1,
        },
      })
      setOtpDigits(Array.from({ length: otpLength }, () => ''))
      setBanner({ tone: 'success', text: 'Đã gửi mã xác thực đến email HUST của bạn.' })
      setScreen('verify')
    } catch (error) {
      const mappedErrors = mapRegisterApiErrors(error)
      if (Object.keys(mappedErrors).length > 0) {
        setRegisterErrors((current) => ({ ...current, ...mappedErrors }))
        setBanner(null)
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

      // Immediately create the account now that OTP is verified so the user exists
      // and we can use the returned access token to update profile safely.
      try {
        const registerData = await registerUser({
          name: pendingRegistration.name || (typeof prefill.firstName === 'string' ? prefill.firstName : ''),
          password: pendingRegistration.password,
          tempToken,
          gender: pendingRegistration.gender,
        })

        const accessToken = registerData?.accessToken
        if (typeof accessToken !== 'string' || !accessToken.trim()) {
          throw new Error('Không nhận được accessToken từ máy chủ')
        }

        // persist access token for subsequent profile update and API calls
        localStorage.setItem('access_token', accessToken)

        setPendingRegistration((current) => (current ? { ...current, tempToken, accessToken } : current))

        setProfileForm({
          name: pendingRegistration.name || (typeof prefill.firstName === 'string' ? prefill.firstName : ''),
          faculty: '',
          schoolYear:
            typeof prefill.schoolYear === 'number' ? String(prefill.schoolYear) : String(profileDefaults.schoolYear),
          interests: [],
          bio: '',
        })
        setProfileErrors({})
        setBanner({ tone: 'success', text: 'Tài khoản đã được tạo. Hãy hoàn tất hồ sơ.' })
        setScreen('profile')
      } catch (regErr) {
        // If immediate registration fails, surface the error and stay on verify screen
        setBanner({ tone: 'error', text: getApiErrorMessage(regErr, 'Tạo tài khoản thất bại') })
        setVerifyLoading(false)
        return
      }
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
    setProfileForm((current) => {
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

    const nextErrors: FieldErrors<keyof ProfileForm> = {}

    if (!profileForm.name.trim()) {
      nextErrors.name = 'Vui lòng nhập tên'
    }

    if (!profileForm.faculty.trim()) {
      nextErrors.faculty = 'Vui lòng chọn khoa / viện'
    }

    if (!profileForm.schoolYear.trim()) {
      nextErrors.schoolYear = 'Vui lòng chọn năm học'
    }

    if (profileForm.bio.trim().length > 200) {
      nextErrors.bio = 'Giới thiệu không được vượt quá 200 ký tự'
    }

    setProfileErrors(nextErrors)
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
      let accessToken = pendingRegistration.accessToken

      if (!accessToken) {
        if (!pendingRegistration.tempToken) {
          throw new Error('Phiên xác thực hết hạn. Vui lòng đăng ký lại.')
        }

        const registerData = await registerUser({
          name: profileForm.name.trim(),
          password: pendingRegistration.password,
          tempToken: pendingRegistration.tempToken,
          gender: pendingRegistration.gender,
        })

        accessToken = registerData?.accessToken
        if (typeof accessToken !== 'string' || !accessToken.trim()) {
          throw new Error('Không nhận được accessToken từ máy chủ')
        }

        setPendingRegistration((current) => (current ? { ...current, accessToken } : current))
      }

      localStorage.setItem('access_token', accessToken)

      // Build payload and omit `interests` when empty to avoid nested-write issues on the backend
      const payload: Record<string, unknown> = {
        name: profileForm.name.trim(),
        faculty: profileForm.faculty,
        schoolYear: Number(profileForm.schoolYear),
        bio: profileForm.bio.trim() || null,
      }

      if (Array.isArray(profileForm.interests) && profileForm.interests.length > 0) {
        payload.interests = profileForm.interests
      }

      // Harden payload and token usage to avoid frontend-caused server errors
      const storedToken = localStorage.getItem('access_token') || accessToken
      if (!storedToken) {
        throw new Error('Không tìm thấy access token. Vui lòng đăng nhập lại hoặc thực hiện lại xác thực OTP.')
      }

      // Sanitize and normalize fields
      const safeName = String(profileForm.name || '').trim()
      const safeFaculty = String(profileForm.faculty || '').trim() || null
      const safeSchoolYear = Number(profileForm.schoolYear) || null
      const safeBio = String(profileForm.bio || '').trim() || null

      // Only include interests that exist in the fetched interestOptions to avoid DB validation errors
      let safeInterests: string[] = []
      if (Array.isArray(profileForm.interests) && profileForm.interests.length > 0 && Array.isArray(interestOptions)) {
        safeInterests = profileForm.interests.filter((it) => interestOptions.includes(it))
      }

      const safePayload: ProfilePayload = { name: safeName }
      if (safeFaculty !== null) safePayload.faculty = safeFaculty
      if (safeSchoolYear !== null) safePayload.schoolYear = safeSchoolYear
      safePayload.bio = safeBio
      if (safeInterests.length > 0) safePayload.interests = safeInterests

      // final debug log for browser console
      // eslint-disable-next-line no-console
      console.debug('[ProfileSubmit] safePayload:', safePayload, 'using token:', Boolean(storedToken))

      // Verify token and current user before attempting profile update to avoid backend errors
      const meData = await getMe({ token: storedToken })
      const currentUserId = meData?.id
      // eslint-disable-next-line no-console
      console.debug('[ProfileSubmit] /users/me response id:', currentUserId)

      if (!currentUserId) {
        throw new Error('Token không hợp lệ hoặc server không trả về thông tin người dùng. Vui lòng đăng nhập lại.')
      }

      await updateProfile(safePayload, { token: storedToken })

      localStorage.removeItem('access_token')
      setPendingRegistration(null)
      setRegisterForm(registerDefaults)
      setLoginForm({
        email: pendingRegistration.email,
        password: '',
      })
      setOtpDigits(Array.from({ length: otpLength }, () => ''))
      setProfileForm(profileDefaults)
      setBanner({ tone: 'success', text: 'Hồ sơ đã hoàn tất. Vui lòng đăng nhập lại để tiếp tục.' })
      setScreen('login')
    } catch (error) {
      setBanner({ tone: 'error', text: getApiErrorMessage(error, 'Lưu profile thất bại') })
    } finally {
      setProfileLoading(false)
    }
  }

  const resetRegisterFlow = () => {
    setPendingRegistration(null)
    setOtpDigits(Array.from({ length: otpLength }, () => ''))
    setProfileForm(profileDefaults)
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
              />
            )}

            {screen === 'register' && (
              <RegisterScreen
                form={registerForm}
                errors={registerErrors}
                loading={registerLoading}
                banner={banner}
                onChange={updateRegisterField}
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
                verifiedName={pendingRegistration?.name ?? profileForm.name}
                studentId={pendingRegistration?.prefill.studentId ?? ''}
                suggestedYearLabel={
                  pendingRegistration ? formatSchoolYearLabel(pendingRegistration.prefill.schoolYear) : 'Năm học'
                }
                form={profileForm}
                errors={profileErrors}
                loading={profileLoading}
                banner={banner}
                interestOptions={interestOptions}
                interestLoading={interestLoading}
                onChange={updateProfileField}
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
