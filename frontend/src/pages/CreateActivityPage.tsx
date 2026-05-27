import { type FormEvent, useEffect, useRef, useState } from 'react'
import { createActivity } from '../api'
import { CreateActivityScreen } from '../components/activities/CreateActivityScreen'
import { AppNav } from '../components/layout/AppNav'
import { getApiErrorMessage } from '../lib/errors'
import { isAccessTokenValid, loginPath } from '../lib/auth'
import { navigate } from '../lib/navigation'
import { hasValidCategory, validateCreateActivityForm } from '../lib/validateActivity'
import type { Banner, CreateActivityForm, FieldErrors } from '../types/activity'
import '../App.css'
import './CreateActivityPage.css'

const initialForm: CreateActivityForm = {
  category: '',
  title: '',
  location: '',
  imageFile: null,
  date: '',
  startTime: '',
  endTime: '',
  maxSlots: '',
  purpose: '',
  gender: 'all',
  deadline: '',
  chatLink: '',
  description: '',
}

export default function CreateActivityPage() {
  const [form, setForm] = useState<CreateActivityForm>(initialForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<Banner>(null)
  const [loading, setLoading] = useState(false)
  const redirectTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => {
    if (!isAccessTokenValid()) {
      navigate(loginPath)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = <K extends keyof CreateActivityForm>(field: K, value: CreateActivityForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    if (banner?.tone === 'error') {
      setBanner(null)
    }
  }

  const handleCancel = () => {
    navigate('/me')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBanner(null)

    const nextErrors = validateCreateActivityForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    if (!hasValidCategory(form)) {
      return
    }

    setLoading(true)
    try {
      await createActivity({
        type: form.category,
        name: form.title.trim(),
        location: form.location.trim(),
        image: form.imageFile ?? undefined,
        date: form.date,
        start: form.startTime,
        end: form.endTime.trim() || undefined,
        maxPeople: Number(form.maxSlots),
        purpose: form.purpose.trim(),
        deadline: new Date(form.deadline).toISOString(),
        groupChatLink: form.chatLink.trim(),
        gender: form.gender,
        description: form.description.trim() || undefined,
      })

      setBanner({ tone: 'success', text: 'Tạo hoạt động thành công! Đang chuyển về danh sách...' })
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
      redirectTimeoutRef.current = window.setTimeout(() => navigate('/me'), 900)
    } catch (error) {
      const status = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined

      setBanner({
        tone: 'error',
        text:
          status === 401
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : getApiErrorMessage(
                error,
                'Không thể tạo hoạt động. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.',
              ),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-activity-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <div className="create-activity-frame">
        <AppNav />

        <div className="create-hero-card">
          <div className="create-hero-icon" aria-hidden>
            ＋
          </div>
          <div>
            <h1>Tạo hoạt động</h1>
            <p>Điền thông tin bên dưới để mời bạn bè cùng tham gia. Dữ liệu sẽ được kiểm tra trước khi gửi lên hệ thống.</p>
          </div>
        </div>

        <div className="create-form-card auth-card">
          <CreateActivityScreen
            form={form}
            errors={errors}
            loading={loading}
            banner={banner}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
