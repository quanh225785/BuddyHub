import { type FormEvent, useEffect, useRef, useState } from 'react'
import { fetchActivity, fetchCategories, updateActivity } from '../api'
import { CreateActivityScreen } from '../components/activities/CreateActivityScreen'
import { AppNav } from '../components/layout/AppNav'
import { LoadingState } from '../components/common/LoadingState'
import { getApiErrorMessage } from '../lib/errors'
import { isAccessTokenValid, loginPath } from '../lib/auth'
import { navigate } from '../lib/navigation'
import { resizeActivityImage } from '../lib/activityImage'
import { hasValidCategory, validateCreateActivityForm } from '../lib/validateActivity'
import type { ActivityDetail, Banner, CreateActivityForm, FieldErrors } from '../types/activity'
import '../App.css'
import './CreateActivityPage.css'

type Props = {
  activityId: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toLocalTime(iso: string) {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function toDateTimeLocal(iso: string) {
  return `${toLocalDate(iso)}T${toLocalTime(iso)}`
}

function activityToForm(activity: ActivityDetail): CreateActivityForm {
  return {
    category: activity.categoryName,
    title: activity.title,
    location: activity.location,
    imageFile: null,
    date: toLocalDate(activity.startTime),
    startTime: toLocalTime(activity.startTime),
    endTime: activity.endTime ? toLocalTime(activity.endTime) : '',
    maxSlots: String(activity.maxSlots),
    purpose: activity.purpose ?? '',
    gender: (activity.gender?.toLowerCase() ?? 'all') as CreateActivityForm['gender'],
    deadline: toDateTimeLocal(activity.deadline),
    chatLink: activity.chatLink ?? '',
    description: activity.description ?? '',
  }
}

export default function EditActivityPage({ activityId }: Props) {
  const [form, setForm] = useState<CreateActivityForm | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<Banner>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const redirectTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => {
    if (!isAccessTokenValid()) {
      navigate(loginPath)
    }
  }, [])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [activityData, categoriesData] = await Promise.all([
          fetchActivity(activityId),
          fetchCategories(),
        ])
        if (!alive) return
        setForm(activityToForm(activityData))
        const items = categoriesData?.categories
        if (Array.isArray(items)) {
          setCategories(items.filter((v: unknown): v is string => typeof v === 'string' && v.trim().length > 0))
        }
      } catch (err) {
        if (alive) setPageError(getApiErrorMessage(err, 'Không thể tải hoạt động'))
      } finally {
        if (alive) setPageLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [activityId])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = <K extends keyof CreateActivityForm>(field: K, value: CreateActivityForm[K]) => {
    setForm((current) => current ? { ...current, [field]: value } : current)
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    if (banner?.tone === 'error') setBanner(null)
  }

  const handleCancel = () => {
    navigate(`/activities/${activityId}`)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    setBanner(null)

    setLoading(true)
    let imageFile = form.imageFile
    try {
      if (imageFile) {
        imageFile = await resizeActivityImage(imageFile)
      }
    } catch {
      setBanner({ tone: 'error', text: 'KhÃ´ng thá»ƒ xá»­ lÃ½ áº£nh. Vui lÃ²ng chá»n áº£nh khÃ¡c.' })
      setLoading(false)
      return
    }

    const nextForm = { ...form, imageFile }
    const nextErrors = validateCreateActivityForm(nextForm)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setLoading(false)
      return
    }
    if (!hasValidCategory(nextForm)) {
      setLoading(false)
      return
    }

    try {
      await updateActivity(activityId, {
        type: nextForm.category,
        name: nextForm.title.trim(),
        location: nextForm.location.trim(),
        image: nextForm.imageFile ?? undefined,
        date: nextForm.date,
        start: nextForm.startTime,
        end: nextForm.endTime.trim() || undefined,
        maxPeople: Number(nextForm.maxSlots),
        purpose: nextForm.purpose.trim(),
        deadline: new Date(nextForm.deadline).toISOString(),
        groupChatLink: nextForm.chatLink.trim(),
        gender: nextForm.gender,
        description: nextForm.description.trim() || undefined,
      })

      setBanner({ tone: 'success', text: 'Cập nhật thành công! Đang chuyển tới trang chi tiết...' })
      if (redirectTimeoutRef.current !== null) window.clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = window.setTimeout(() => navigate(`/activities/${activityId}`), 900)
    } catch (error) {
      const status = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined

      setBanner({
        tone: 'error',
        text:
          status === 401
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : status === 403
              ? 'Bạn không có quyền chỉnh sửa hoạt động này.'
              : getApiErrorMessage(error, 'Không thể cập nhật hoạt động. Vui lòng thử lại.'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-activity-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <AppNav />

      <div className="create-activity-frame">
        <div className="create-hero-card">
          <div className="create-hero-icon" aria-hidden>✏️</div>
          <div>
            <h1>Chỉnh sửa hoạt động</h1>
            <p>Cập nhật thông tin hoạt động của bạn.</p>
          </div>
        </div>

        <div className="create-form-card auth-card">
          {pageLoading && <LoadingState label="Đang tải..." />}
          {pageError && <div className="banner banner-error">{pageError}</div>}
          {!pageLoading && !pageError && form && (
            <CreateActivityScreen
              form={form}
              errors={errors}
              loading={loading}
              banner={banner}
              categories={categories}
              submitLabel="Lưu thay đổi"
              loadingLabel="Đang lưu..."
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
