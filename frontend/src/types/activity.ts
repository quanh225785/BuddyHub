export type ActivityCategory = string

/** Giới hạn giới tính khi đăng ký (payload tạo hoạt động) */
export type ActivityGenderRequirement = 'male' | 'female' | 'all'

/** Giới hạn giới tính từ API */
export type ActivityGender = 'MALE' | 'FEMALE' | 'ALL'

export type CreateActivityForm = {
  category: ActivityCategory | ''
  title: string
  location: string
  imageFile: File | null
  date: string
  startTime: string
  endTime: string
  maxSlots: string
  purpose: string
  gender: ActivityGenderRequirement
  deadline: string
  chatLink: string
  description: string
}

export type FieldErrors = Partial<Record<keyof CreateActivityForm, string>>

export type Banner = {
  tone: 'error' | 'success'
  text: string
} | null

export type ActivityHost = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type ActivityListItem = {
  id: string
  title: string
  categoryName: string
  location: string
  startTime: string
  maxSlots: number
  currentParticipants: number
  description?: string | null
  purpose?: string | null
  host?: ActivityHost
  imageUrl?: string | null
}

export type ActivityParticipant = {
  id: string
  name: string
}

export type ActivityStatus = 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED' | 'FINISHED'

export type ActivityDetail = {
  id: string
  title: string
  categoryName: string
  purpose?: string | null
  location: string
  startTime: string
  endTime?: string | null
  deadline: string
  maxSlots: number
  currentParticipants: number
  gender?: ActivityGender
  status?: ActivityStatus
  chatLink?: string | null
  description?: string | null
  imageUrl?: string | null
  host?: ActivityHost
  participants: ActivityParticipant[]
}
