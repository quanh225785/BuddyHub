import { useEffect, useMemo, useState } from 'react'
import { getDashboard, updateProfile } from '../api'
import './ProfilePage.css'

type DashboardActivity = {
  id: string
  title: string
  location: string
  startTime: string
  maxSlots: number
  currentParticipants: number
  role: 'host' | 'joined'
  categoryName: string
}

type DashboardResponse = {
  message: string
  profile: {
    id: string
    email: string
    studentId: string
    name: string
    faculty?: string | null
    schoolYear?: number | null
    gender?: 'MALE' | 'FEMALE' | 'ALL' | null
    avatarUrl?: string | null
    bio?: string | null
    interests: string[]
    hostedCount: number
    joinedCount: number
    isVerified: boolean
  }
  activities: {
    upcoming: DashboardActivity[]
    history: DashboardActivity[]
  }
}

type ProfileDraft = {
  name: string
  faculty: string
  schoolYear: string
  bio: string
  interests: string[]
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  const day = date.getDay()
  const dayLabel = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'][day] ?? 'Th'
  const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`
  const timeLabel = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${dayLabel}, ${dateLabel} • ${timeLabel}`
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
          bio: data.profile.bio ?? '',
          interests: [...data.profile.interests],
        })
      } catch (e: any) {
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

  const profile = dashboard?.profile
  const genderLabel = formatGender(profile?.gender)
  const upcomingActivities = dashboard?.activities.upcoming ?? []
  const historyActivities = dashboard?.activities.history ?? []
  const visibleActivities = activeTab === 'upcoming' ? upcomingActivities : historyActivities

  const handleInitial = useMemo(() => {
    const firstChar = profile?.name?.trim()?.charAt(0)
    return firstChar ? firstChar.toUpperCase() : '?'
  }, [profile?.name])

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

      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        faculty: draft.faculty.trim() || null,
        schoolYear: draft.schoolYear.trim() ? Number(draft.schoolYear) : null,
        bio: draft.bio.trim() || null,
        interests: draft.interests,
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
    return <div className="myprofile-shell">Đang tải hồ sơ…</div>
  }

  if (error) {
    return <div className="myprofile-shell">Lỗi: {error}</div>
  }

  if (!profile || !draft) {
    return <div className="myprofile-shell">Không có hồ sơ</div>
  }

  return (
    <main className="myprofile-shell">
      <section className="myprofile-card myprofile-hero">
        <div className="myprofile-cover" />
        <div className="myprofile-header">
          <div className="avatar" aria-hidden>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" /> : <div className="avatar-placeholder">{handleInitial}</div>}
          </div>

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
                  <input value={draft.name} readOnly disabled />
                </label>

                <label className="edit-field">
                  <span>Năm học</span>
                  <input value={draft.schoolYear} readOnly disabled />
                </label>
              </div>

              <label className="edit-field edit-field-full">
                <span>Khoa / Viện</span>
                <input
                  value={draft.faculty}
                  onChange={(event) => setDraft((current) => (current ? { ...current, faculty: event.target.value } : current))}
                  placeholder="Công nghệ thông tin"
                />
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
                {dashboard.profile.interests.length === 0 ? (
                  <span className="muted">Chưa có dữ liệu sở thích từ DB</span>
                ) : (
                  dashboard.profile.interests.map((interest) => {
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
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
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
              <article key={activity.id} className="activity-item">
                <div className={`activity-icon ${roleClass(activity.role)}`}>▣</div>
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
        <div className="action-card">
          <div className="action-card-icon action-card-icon-orange">📅</div>
          <div>
            <strong>Sự kiện của tôi</strong>
            <span>Đã tham gia &amp; đã tạo</span>
          </div>
        </div>

        <div className="action-card">
          <div className="action-card-icon action-card-icon-teal">＋</div>
          <div>
            <strong>Tạo hoạt động</strong>
            <span>Mời bạn bè cùng tham gia</span>
          </div>
        </div>
      </section>
    </main>
  )
}
