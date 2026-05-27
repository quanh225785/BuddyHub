import { useEffect, useState } from 'react'
import { fetchActivity, getMe, joinActivity } from '../api'
import { ButtonSpinner, LoadingState } from '../components/common/LoadingState'
import { AppNav } from '../components/layout/AppNav'
import { getApiErrorMessage } from '../lib/errors'
import { formatActivityDateTime, formatActivityGender } from '../lib/formatActivity'
import { getCategoryStyle } from '../lib/categoryStyle'
import { navigate } from '../lib/navigation'
import type { ActivityDetail } from '../types/activity'
import '../App.css'
import './ActivityDetailPage.css'

type ActivityDetailPageProps = {
  activityId: string
}

function getDetailSource() {
  if (typeof window === 'undefined') return 'browse'
  const params = new URLSearchParams(window.location.search)
  return params.get('from') === 'my-events' ? 'my-events' : 'browse'
}

function getCurrentUserId(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64))
    return (payload.sub ?? payload.id ?? null) as string | null
  } catch {
    return null
  }
}

function formatDateOnly(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTimeRange(startTime: string, endTime?: string | null) {
  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return endTime ? `${fmt(startTime)} - ${fmt(endTime)}` : fmt(startTime)
}

export default function ActivityDetailPage({ activityId }: ActivityDetailPageProps) {
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [chatLink, setChatLink] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showJoinConfirm, setShowJoinConfirm] = useState(false)
  const [userGender, setUserGender] = useState<string | null>(null)
  const source = getDetailSource()

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchActivity(activityId)
        if (!alive) return
        setActivity(data)
      } catch (err) {
        if (!alive) return
        setError(getApiErrorMessage(err, 'Không thể tải chi tiết hoạt động'))
        setActivity(null)
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [activityId])

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return
    getMe().then((u) => setUserGender(u?.gender ?? null)).catch(() => {})
  }, [])

  const handleJoin = async () => {
    setShowJoinConfirm(false)
    try {
      setJoining(true)
      setJoinError(null)
      const result = await joinActivity(activityId)
      setChatLink(result.chatLink)
      const updated = await fetchActivity(activityId)
      setActivity(updated)
    } catch (err) {
      setJoinError(getApiErrorMessage(err, 'Không thể tham gia hoạt động'))
    } finally {
      setJoining(false)
    }
  }

  const handleBack = () => {
    navigate(source === 'my-events' ? '/my-events' : '/activities')
  }

  const handleOpenUserProfile = (userId?: string | null) => {
    if (!userId) return
    navigate(userId === getCurrentUserId() ? '/me' : `/users/${userId}`)
  }

  const categoryStyle = activity ? getCategoryStyle(activity.categoryName) : null
  const hostDisplayName = activity ? (activity.host?.name ?? 'BuddyHub member') : ''
  const currentUserId = getCurrentUserId()
  const spotsLeft = activity ? activity.maxSlots - activity.currentParticipants : 0
  const isHost = currentUserId !== null && activity?.host?.id === currentUserId
  const fillPercent =
    activity && activity.maxSlots > 0
      ? Math.min(100, Math.round((activity.currentParticipants / activity.maxSlots) * 100))
      : 0
  const alreadyJoined =
    !isHost &&
    currentUserId !== null &&
    (activity?.participants.some((p) => p.id === currentUserId) ?? false)
  const genderMismatch =
    !isHost &&
    !alreadyJoined &&
    activity?.gender != null &&
    activity.gender !== 'ALL' &&
    userGender !== null &&
    userGender !== activity.gender
  const showJoinButton =
    !isHost &&
    !alreadyJoined &&
    !chatLink &&
    !genderMismatch &&
    source !== 'my-events' &&
    activity?.status === 'OPEN' &&
    spotsLeft > 0 &&
    (activity?.deadline == null || new Date() <= new Date(activity.deadline))
  const resolvedChatLink = chatLink ?? (alreadyJoined ? (activity?.chatLink ?? null) : null)

  return (
    <div className="activity-detail-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <AppNav active={source === 'my-events' ? 'my-events' : 'activities'} />

      <div className="activity-detail-frame">
        <button type="button" className="activity-detail-back" onClick={handleBack}>
          ← Quay lại
        </button>

        {loading && <LoadingState className="activity-detail-status" label="Đang tải chi tiết hoạt động..." />}

        {error && !loading && (
          <div className="activity-detail-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && activity && categoryStyle && (
          <div className="activity-detail-layout">
            {/* Nội dung chính */}
            <article className="activity-detail-main myprofile-card">
              {/* Hero */}
              <div className="activity-detail-hero">
                {activity.imageUrl && (
                  <img src={activity.imageUrl} alt="" className="activity-detail-image" />
                )}

                <span
                  className="activity-detail-category"
                  style={{ background: categoryStyle.bg, color: categoryStyle.color }}
                >
                  {activity.categoryName}
                </span>
                <h1>{activity.title}</h1>
              </div>

              {/* Info grid */}
              <div className="adp-info-grid">
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-orange">📅</span>
                  <div>
                    <p className="adp-info-label">Ngày diễn ra</p>
                    <p className="adp-info-value">{formatDateOnly(activity.startTime)}</p>
                  </div>
                </div>
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-orange">🕐</span>
                  <div>
                    <p className="adp-info-label">Thời gian</p>
                    <p className="adp-info-value">{formatTimeRange(activity.startTime, activity.endTime)}</p>
                  </div>
                </div>
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-pink">📍</span>
                  <div>
                    <p className="adp-info-label">Địa điểm</p>
                    <p className="adp-info-value">{activity.location}</p>
                  </div>
                </div>
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-pink">👥</span>
                  <div>
                    <p className="adp-info-label">Số chỗ còn lại</p>
                    <p className="adp-info-value">
                      {spotsLeft > 0 ? `${spotsLeft} chỗ còn trống` : 'Đã đủ người'}
                    </p>
                  </div>
                </div>
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-amber">🎯</span>
                  <div>
                    <p className="adp-info-label">Mục đích</p>
                    <p className="adp-info-value">{activity.purpose?.trim() || '—'}</p>
                  </div>
                </div>
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-red">⏰</span>
                  <div>
                    <p className="adp-info-label">Hạn chốt đăng ký</p>
                    <p className="adp-info-value">{formatActivityDateTime(activity.deadline)}</p>
                  </div>
                </div>
                <div className="adp-info-card">
                  <span className="adp-info-icon adp-icon-green">⚧</span>
                  <div>
                    <p className="adp-info-label">Yêu cầu giới tính</p>
                    <p className="adp-info-value">{formatActivityGender(activity.gender)}</p>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              {activity.description?.trim() && (
                <div className="adp-desc-card">
                  <h3>Giới thiệu hoạt động</h3>
                  <p>{activity.description.trim()}</p>
                </div>
              )}

              {/* Người tham gia */}
              <div className="adp-participants-section">
                <div className="adp-participants-header">
                  <span>{activity.currentParticipants} người đã tham gia</span>
                  <span>tối đa {activity.maxSlots}</span>
                </div>
                <div className="adp-progress">
                  <div className="adp-progress-fill" style={{ width: `${fillPercent}%` }} />
                </div>

                {activity.participants.length > 0 && (
                  <>
                    <div className="adp-participants-title-row">
                      <h3>Người tham gia</h3>
                      <span>{activity.currentParticipants}/{activity.maxSlots} chỗ</span>
                    </div>
                    <ul className="adp-participants-list">
                      {activity.participants.map((p) => (
                        <li key={p.id} className="adp-participant-card">
                          <button
                            type="button"
                            className="adp-participant-profile-button"
                            onClick={() => handleOpenUserProfile(p.id)}
                          >
                            <span className="adp-participant-avatar" aria-hidden>
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt="" className="adp-participant-avatar-image" />
                              ) : (
                                p.name.trim().charAt(0).toUpperCase() || '?'
                              )}
                            </span>
                            <span className="adp-participant-text">
                              <span className="adp-participant-name">{p.name}</span>
                              <span className="adp-participant-hint">Xem hồ sơ</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {activity.participants.length === 0 && (
                  <p className="activity-detail-muted">Chưa có ai tham gia.</p>
                )}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="activity-detail-sidebar">
              {/* Host view */}
              {isHost && (
                <div className="activity-detail-sidebar-card">
                  <div className="adp-host-own-badge">
                    <span>🏠</span>
                    <p>Hoạt động của bạn</p>
                  </div>
                  <span className={`adp-status-pill adp-status-${(activity.status ?? 'OPEN').toLowerCase()}`}>
                    {
                      {
                        OPEN: 'Đang mở đăng ký',
                        FULL: 'Đã đủ người',
                        CLOSED: 'Đã đóng',
                        CANCELLED: 'Đã hủy',
                        FINISHED: 'Đã kết thúc',
                      }[activity.status ?? 'OPEN']
                    }
                  </span>
                  <button
                    type="button"
                    className="activity-detail-join-btn"
                    onClick={() => navigate(`/activities/${activityId}/edit`)}
                    disabled={activity.status !== 'OPEN'}
                    title={activity.status !== 'OPEN' ? 'Chỉ có thể chỉnh sửa hoạt động đang mở đăng ký' : undefined}
                  >
                    ✏️ Chỉnh sửa hoạt động
                  </button>
                  {activity.status !== 'OPEN' && (
                    <p className="activity-detail-join-error">
                      Hoạt động này không thể chỉnh sửa.
                    </p>
                  )}
                  {activity.chatLink && (
                    <>
                      <a
                        href={activity.chatLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="activity-detail-chat-link"
                      >
                        Nhóm chat
                      </a>
                      <p className="activity-detail-chat-url">{activity.chatLink}</p>
                    </>
                  )}
                </div>
              )}

              {/* Đã tham gia */}
              {(alreadyJoined || chatLink) && (
                <div className="activity-detail-sidebar-card">
                  <p className="activity-detail-joined-label">Bạn đã tham gia</p>
                  {resolvedChatLink && (
                    <>
                      <a
                        href={resolvedChatLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="activity-detail-chat-link"
                      >
                        Vào nhóm chat
                      </a>
                      <p className="activity-detail-chat-url">{resolvedChatLink}</p>
                    </>
                  )}
                </div>
              )}

              {/* Không đủ điều kiện giới tính */}
              {genderMismatch && source !== 'my-events' && (
                <div className="activity-detail-sidebar-card adp-gender-block">
                  <span className="adp-gender-block-icon">🚫</span>
                  <p>
                    Hoạt động này chỉ dành cho{' '}
                    <strong>{activity.gender === 'MALE' ? 'nam' : 'nữ'}</strong>
                  </p>
                </div>
              )}

              {/* Nút tham gia */}
              {showJoinButton && (
                <div className="activity-detail-sidebar-card">
                  <button
                    type="button"
                    className="activity-detail-join-btn"
                    onClick={() => setShowJoinConfirm(true)}
                    disabled={joining}
                  >
                    {joining ? <ButtonSpinner label="Đang xử lý..." /> : 'Tham gia'}
                  </button>
                  {joinError && (
                    <p className="activity-detail-join-error" role="alert">
                      {joinError}
                    </p>
                  )}
                </div>
              )}

              <div className="activity-detail-sidebar-card">
                <h2 className="activity-detail-sidebar-label">Người tổ chức</h2>
                <button
                  type="button"
                  className="activity-detail-host-row activity-detail-host-button"
                  onClick={() => handleOpenUserProfile(activity.host?.id)}
                >
                  {activity.host?.avatarUrl ? (
                    <img
                      src={activity.host.avatarUrl}
                      alt=""
                      className="activity-detail-host-avatar"
                    />
                  ) : (
                    <span
                      className="activity-detail-host-avatar activity-detail-host-avatar-fallback"
                      aria-hidden
                    >
                      {hostDisplayName.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="activity-detail-host-text">
                    <span className="activity-detail-host-name">{hostDisplayName}</span>
                    <span className="activity-detail-host-hint">Xem hồ sơ</span>
                  </span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {showJoinConfirm && (
        <div className="logout-modal-backdrop" role="presentation" onClick={() => setShowJoinConfirm(false)}>
          <section
            className="logout-modal adp-join-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="join-confirm-title">Xác nhận tham gia?</h2>
            <p>
              Sau khi tham gia, bạn <strong>không thể tự hủy</strong>. Hãy chắc chắn bạn có thể tham gia hoạt động này.
            </p>
            <div className="logout-modal-actions">
              <button type="button" className="logout-modal-cancel" onClick={() => setShowJoinConfirm(false)}>
                Để sau
              </button>
              <button type="button" className="logout-modal-confirm" onClick={handleJoin}>
                Xác nhận tham gia
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
