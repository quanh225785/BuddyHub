import type { CreateActivityForm, FieldErrors } from '../types/activity'

export function hasValidCategory(form: CreateActivityForm): form is CreateActivityForm & { category: string } {
  return form.category.trim().length > 0
}

const DESCRIPTION_MAX = 500
const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

/** YYYY-MM-DD theo giờ local */
export function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Giá trị min cho input type="date" */
export function getTodayDateMin() {
  return toLocalDateString(new Date())
}

/** Giá trị min cho input type="datetime-local" */
export function getNowDateTimeLocalMin() {
  const now = new Date()
  return `${toLocalDateString(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

export function isValidChatLink(value: string) {
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return false

    const hostname = url.hostname.toLowerCase()
    const pathname = url.pathname.toLowerCase()

    return (
      hostname === 't.me' ||
      hostname.endsWith('.t.me') ||
      hostname === 'telegram.me' ||
      hostname.endsWith('.telegram.me') ||
      hostname === 'zalo.me' ||
      hostname.endsWith('.zalo.me') ||
      hostname === 'm.me' ||
      hostname.endsWith('.m.me') ||
      hostname === 'messenger.com' ||
      hostname.endsWith('.messenger.com') ||
      ((hostname === 'facebook.com' || hostname.endsWith('.facebook.com')) && pathname.startsWith('/messages'))
    )
  } catch {
    return false
  }
}

function parseStartDateTime(form: CreateActivityForm) {
  if (!form.date || !form.startTime) return null
  const value = new Date(`${form.date}T${form.startTime}:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

function parseEndDateTime(form: CreateActivityForm) {
  if (!form.date || !form.endTime) return null
  const value = new Date(`${form.date}T${form.endTime}:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

function parseDeadlineDateTime(value: string) {
  if (!value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function validateCreateActivityForm(form: CreateActivityForm): FieldErrors {
  const errors: FieldErrors = {}
  const now = new Date()
  const today = toLocalDateString(now)

  if (!form.category) {
    errors.category = 'Vui lòng chọn loại hoạt động'
  }

  if (!form.title.trim()) {
    errors.title = 'Vui lòng nhập tên hoạt động'
  }

  if (!form.location.trim()) {
    errors.location = 'Vui lòng nhập địa điểm'
  }

  if (form.imageFile) {
    if (!ALLOWED_IMAGE_TYPES.has(form.imageFile.type)) {
      errors.imageFile = 'Ảnh chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF'
    } else if (form.imageFile.size > IMAGE_MAX_BYTES) {
      errors.imageFile = 'Ảnh hoạt động tối đa 5MB'
    }
  }

  if (!form.date) {
    errors.date = 'Vui lòng chọn ngày'
  } else if (form.date < today) {
    errors.date = 'Ngày hoạt động không thể là ngày trong quá khứ'
  }

  if (!form.startTime) {
    errors.startTime = 'Vui lòng chọn giờ bắt đầu'
  }

  const maxSlots = Number(form.maxSlots)
  if (!form.maxSlots.trim() || !Number.isInteger(maxSlots) || maxSlots <= 0) {
    errors.maxSlots = 'Số người tối đa phải là số nguyên dương'
  }

  if (!form.purpose.trim()) {
    errors.purpose = 'Vui lòng nhập mục đích'
  }

  if (!form.deadline) {
    errors.deadline = 'Vui lòng chọn hạn đăng ký'
  }

  if (!form.chatLink.trim()) {
    errors.chatLink = 'Vui lòng nhập link nhóm chat'
  } else if (!isValidChatLink(form.chatLink)) {
    errors.chatLink = 'Chỉ chấp nhận link Telegram, Zalo hoặc Messenger (https://...).'
  }

  if (form.description.length > DESCRIPTION_MAX) {
    errors.description = `Mô tả tối đa ${DESCRIPTION_MAX} ký tự`
  }

  const start = parseStartDateTime(form)
  if (form.date && form.startTime && !start) {
    errors.startTime = 'Thời gian bắt đầu không hợp lệ'
  }

  if (start && start.getTime() <= now.getTime()) {
    if (form.date === today) {
      errors.startTime = 'Giờ bắt đầu phải sau thời điểm hiện tại'
    } else if (!errors.date) {
      errors.date = 'Thời gian bắt đầu phải ở tương lai'
    }
  }

  if (start && form.endTime) {
    const end = parseEndDateTime(form)
    if (!end) {
      errors.endTime = 'Giờ kết thúc không hợp lệ'
    } else if (end.getTime() <= start.getTime()) {
      errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu'
    }
  }

  const deadline = form.deadline ? parseDeadlineDateTime(form.deadline) : null
  if (form.deadline && !deadline) {
    errors.deadline = 'Hạn đăng ký không hợp lệ'
  } else if (deadline) {
    if (deadline.getTime() <= now.getTime()) {
      errors.deadline = 'Hạn đăng ký phải sau thời điểm hiện tại'
    } else if (start && deadline.getTime() >= start.getTime()) {
      errors.deadline = 'Hạn đăng ký phải trước thời gian bắt đầu hoạt động'
    }
  }

  return errors
}
