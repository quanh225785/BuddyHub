import { useEffect, useMemo, useState } from 'react'
import { getDashboard, updateProfile, uploadUserAvatar, type ProfilePayload } from '../api'
import { ButtonSpinner, LoadingState } from '../components/common/LoadingState'
import { fetchInterests} from '../api'
import { AppNav } from '../components/layout/AppNav'
import { clearAccessToken, loginPath, setAuthRedirectMessage } from '../lib/auth'
import { formatActivityTime } from '../lib/formatActivity'
import { navigate } from '../lib/navigation'
import type { DashboardResponse } from '../types/dashboard'
import './ProfilePage.css'

const facultyOptions = [
  'Khoa giáo dục Quốc Phòng & An Ninh',
  'Khoa giáo dục thể chất',
  'Khoa lý luận chính trị',
  'Trường Cơ Khí',
  'Trường CNTT & TT',
  'Trường Điện - Điện tử',
  'Trường Hóa và Khoa học sự sống',
  'Trường Vật Liệu',
  'Khoa Toán - Tin',
  'Khoa Vật Lý Kỹ Thuật',
  'Trường Kinh Tế',
  'Khoa Ngoại Ngữ',
  'Khoa khoa học và công nghệ giáo dục',
]

const schoolYearOptions = [
  { value: '1', label: 'Năm 1' },
  { value: '2', label: 'Năm 2' },
  { value: '3', label: 'Năm 3' },
  { value: '4', label: 'Năm 4' },
  { value: '5', label: 'Năm 5' },
  { value: '6', label: 'Cao học' },
]

type ProfileDraft = {
  name: string
  faculty: string
  schoolYear: string
  avatarUrl: string
  avatarFile: File | null
  bio: string
  interests: string[]
}

function formatRole(role: 'host' | 'joined') {
  return role === 'host' ? 'Tổ chức' : 'Tham gia'
}

function roleClass(role: 'host' | 'joined') {
  return role === 'host' ? 'is-host' : 'is-joined'
}

function formatGender(value?: 'MALE' | 'FEMALE' | 'ALL' | null) {
  if (value === 'MALE') return 'Nam'
  if (value === 'FEMALE') return 'Nữ'
  return 'Chưa cập nhật'
}

export default function ProfilePage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [interestOptions, setInterestOptions] = useState<string[]>([])

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = (await getDashboard()) as DashboardResponse
        if (!alive) return

        setDashboard(data)
        setDraft({
          name: data.profile.name,
          faculty: data.profile.faculty ?? '',
          schoolYear: data.profile.schoolYear ? String(data.profile.schoolYear) : '',
          avatarUrl: data.profile.avatarUrl ?? '',
          avatarFile: null,
          bio: data.profile.bio ?? '',
          interests: [...data.profile.interests],
        })
      } catch (e: any) {
        const status = e?.response?.status
        if (status === 400 || status === 401) {
          clearAccessToken()
          setAuthRedirectMessage('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
          navigate(loginPath)
          return
        }
        setError(e?.response?.data?.message || e?.message || 'Lỗi khi tải hồ sơ')
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await fetchInterests()
        const interests = data?.interests
        if (!alive || !Array.isArray(interests)) return
        setInterestOptions(
          interests.filter(
            (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0,
          ),
        )
      } catch {
        if (alive) setInterestOptions([])
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const profile = dashboard?.profile
  const genderLabel = formatGender(profile?.gender)
  const upcomingActivities = dashboard?.activities.upcoming ?? []
  const historyActivities = dashboard?.activities.history ?? []
  const visibleActivities = activeTab === 'upcoming' ? upcomingActivities : historyActivities

  const handleInitial = useMemo(() => {
    const firstChar = (editing ? draft?.name : profile?.name)?.trim()?.charAt(0)
    return firstChar ? firstChar.toUpperCase() : '?'
  }, [draft?.name, editing, profile?.name])

  const displayedAvatarUrl = editing ? draft?.avatarUrl : profile?.avatarUrl

  const toggleInterest = (interest: string) => {
    setDraft((current) => {
      if (!current) return current
      const hasInterest = current.interests.includes(interest)
      return {
        ...current,
        interests: hasInterest ? current.interests.filter((item) => item !== interest) : [...current.interests, interest],
      }
    })
  }

  const startEditing = () => {
    if (!profile) return
    setSaveError(null)
    setEditing(true)
    setDraft({
      name: profile.name,
      faculty: profile.faculty ?? '',
      schoolYear: profile.schoolYear ? String(profile.schoolYear) : '',
      avatarUrl: profile.avatarUrl ?? '',
      avatarFile: null,
      bio: profile.bio ?? '',
      interests: [...profile.interests],
    })
  }

  const cancelEditing = () => {
    setEditing(false)
    setSaveError(null)
    if (profile) {
      setDraft({
        name: profile.name,
        faculty: profile.faculty ?? '',
        schoolYear: profile.schoolYear ? String(profile.schoolYear) : '',
        avatarUrl: profile.avatarUrl ?? '',
        avatarFile: null,
        bio: profile.bio ?? '',
        interests: [...profile.interests],
      })
    }
  }

  const saveProfile = async () => {
    if (!draft) return

    try {
      setSaving(true)
      setSaveError(null)

      const payload: ProfilePayload = {
        name: draft.name.trim(),
        faculty: draft.faculty.trim() || null,
        schoolYear: draft.schoolYear.trim() ? Number(draft.schoolYear) : null,
        avatarUrl: draft.avatarUrl.trim() || null,
        bio: draft.bio.trim() || null,
        interests: draft.interests,
      }

      if (draft.avatarFile) {
        const avatarResult = await uploadUserAvatar(draft.avatarFile)
        payload.avatarUrl = avatarResult?.secureUrl?.trim() || payload.avatarUrl || null
      }

      await updateProfile(payload)

      const data = (await getDashboard()) as DashboardResponse
      setDashboard(data)
      setEditing(false)
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || e?.message || 'Không thể lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="myprofile-shell">
        <AppNav />
        <div className="myprofile-content">
          <LoadingState label="Đang tải hồ sơ..." />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="myprofile-shell">
        <AppNav />
        <div className="myprofile-content">Lỗi: {error}</div>
      </main>
    )
  }

  if (!profile || !draft) {
    return (
      <main className="myprofile-shell">
        <AppNav />
        <div className="myprofile-content">Không có hồ sơ</div>
      </main>
    )
  }

  return (
    <main className="myprofile-shell">
      <AppNav />

      <div className="myprofile-content">
        <section className="myprofile-card myprofile-hero">
        <div className="myprofile-cover" />
        <div className="myprofile-header">
          {editing ? (
            <label className="avatar upload-label" title="Nhấn để đổi ảnh">
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  if (!file) {
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    setDraft((current) =>
                      current
                        ? { ...current, avatarFile: file, avatarUrl: String(reader.result ?? '') }
                        : current,
                    )
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {displayedAvatarUrl ? (
                <img src={displayedAvatarUrl} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">{handleInitial}</div>
              )}
              <span className="avatar-edit" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                  <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                </svg>
              </span>
            </label>
          ) : (
            <div className="avatar" aria-hidden>
              {displayedAvatarUrl ? <img src={displayedAvatarUrl} alt="avatar" /> : <div className="avatar-placeholder">{handleInitial}</div>}
            </div>
          )}

          <div className="meta">
            <div className="name-row">
              <h1>{draft.name}</h1>
              <span className="handle">@{profile.studentId?.toLowerCase() ?? profile.email.split('@')[0]}</span>
            </div>
            <div className="sub">
              {profile.isVerified && <span className="badge">HUST Verified</span>}
              <span className="email">{profile.email}</span>
            </div>
            <div className="meta-line">
              {draft.faculty || 'Chưa cập nhật khoa / viện'}
              {draft.schoolYear ? ` · Năm ${draft.schoolYear}` : ''}
            </div>
            <div className="meta-line">Giới tính: {genderLabel}</div>
          </div>

          <div className="action">
            <button className="edit" type="button" onClick={editing ? cancelEditing : startEditing}>
              {editing ? 'Hủy' : 'Chỉnh sửa'}
            </button>
          </div>
        </div>

        {!editing ? (
          <>
            <p className="bio">{draft.bio || 'Chưa có phần giới thiệu.'}</p>

            <div className="counts">
              <div className="count">
                <strong>{profile.hostedCount}</strong>
                <span>Đã tổ chức</span>
              </div>
              <div className="count">
                <strong>{profile.joinedCount}</strong>
                <span>Đã tham gia</span>
              </div>
            </div>

            <div className="interests">
              <div className="section-head">
                <h3>Sở thích</h3>
              </div>
              <div className="chips">
                {draft.interests.length === 0 ? (
                  <span className="muted">Chưa cập nhật</span>
                ) : (
                  draft.interests.map((interest) => (
                    <span key={interest} className="chip">
                      {interest}
                    </span>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="edit-panel">
            <div className="edit-grid">
              <div className="edit-row edit-row-same-line">
                <label className="edit-field">
                  <span>Họ tên</span>
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                    placeholder="Họ và tên"
                  />
                </label>

                <label className="edit-field">
                  <span>Năm học</span>
                  <select
                    value={draft.schoolYear}
                    onChange={(event) => setDraft((current) => (current ? { ...current, schoolYear: event.target.value } : current))}
                  >
                    <option value="">Chọn năm học</option>
                    {schoolYearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="edit-field edit-field-full">
                <span>Khoa / Viện</span>
                <select
                  value={draft.faculty}
                  onChange={(event) => setDraft((current) => (current ? { ...current, faculty: event.target.value } : current))}
                >
                  <option value="">Chọn khoa / viện</option>
                  {facultyOptions.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="edit-field edit-field-full">
              <span>Giới thiệu</span>
              <textarea
                rows={4}
                value={draft.bio}
                onChange={(event) => setDraft((current) => (current ? { ...current, bio: event.target.value } : current))}
                placeholder="Viết đôi lời giới thiệu về bạn"
              />
            </label>

            <div className="interests edit-interests">
              <div className="section-head">
                <h3>Sở thích</h3>
              </div>
              <div className="chips">
                {interestOptions.length === 0 ? (
                  <span className="muted">Chưa có dữ liệu sở thích từ DB</span>
                ) : (
                  interestOptions.map((interest) => {
                    const isSelected = draft.interests.includes(interest)
                    return (
                      <button
                        key={interest}
                        type="button"
                        className={`chip chip-button ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {saveError && <div className="save-error">{saveError}</div>}

            <div className="edit-actions">
              <button type="button" className="save-button" onClick={saveProfile} disabled={saving}>
                {saving ? <ButtonSpinner label="Đang lưu..." /> : 'Lưu thay đổi'}
              </button>
              <button type="button" className="cancel-button" onClick={cancelEditing} disabled={saving}>
                Hủy
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="myprofile-card activity-panel">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sự kiện sắp tới
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'history' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Lịch sử hoạt động
          </button>
        </div>

        <div className="activity-list">
          {visibleActivities.length === 0 ? (
            <div className="empty-state">Chưa có hoạt động nào.</div>
          ) : (
            visibleActivities.map((activity) => (
              <article
                key={activity.id}
                className="activity-item"
                onClick={() => navigate(`/activities/${activity.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/activities/${activity.id}`) }}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label={activity.title}
              >
                {activity.imageUrl ? (
                  <img src={activity.imageUrl} alt="" className="activity-thumb" loading="lazy" />
                ) : (
                  <div className={`activity-icon ${roleClass(activity.role)}`}>▣</div>
                )}
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>
                    {formatActivityTime(activity.startTime)} · {activity.location}
                  </p>
                </div>
                <div className="activity-meta">
                  <span className={`role-pill ${roleClass(activity.role)}`}>{formatRole(activity.role)}</span>
                  <span className="slots">
                    {activity.currentParticipants}/{activity.maxSlots}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="profile-actions-grid">
        <button type="button" className="action-card action-card-button" onClick={() => navigate('/my-events')}>
          <div className="action-card-icon action-card-icon-orange">📅</div>
          <div>
            <strong>Sự kiện của tôi</strong>
            <span>Đã tạo &amp; đã tham gia</span>
          </div>
        </button>

        <button type="button" className="action-card action-card-button" onClick={() => navigate('/activities/new')}>
          <div className="action-card-icon action-card-icon-teal">＋</div>
          <div>
            <strong>Tạo hoạt động</strong>
            <span>Mời bạn bè cùng tham gia</span>
          </div>
        </button>
        </section>
      </div>
    </main>
  )
}
