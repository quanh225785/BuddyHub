import { type ReactNode, useEffect, useState } from 'react'
import { fetchActivity } from '../api'
import { AppNav } from '../components/layout/AppNav'
import { getApiErrorMessage } from '../lib/errors'
import { formatActivityDateTime, formatActivityGender, formatActivityTimeRange } from '../lib/formatActivity'
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

function hostInitial(name?: string) {
  const char = name?.trim()?.charAt(0)
  return char ? char.toUpperCase() : '?'
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="activity-detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default function ActivityDetailPage({ activityId }: ActivityDetailPageProps) {
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        if (alive) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [activityId])

  const handleBack = () => {
    navigate(source === 'my-events' ? '/my-events' : '/activities')
  }

  const categoryStyle = activity ? getCategoryStyle(activity.categoryName) : null
  const hostDisplayName = activity ? (activity.host?.name ?? 'BuddyHub member') : ''
  const showJoinButton = source !== 'my-events'

  return (
    <div className="activity-detail-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <div className="activity-detail-frame">
        <AppNav active={source === 'my-events' ? 'profile' : 'activities'} />

        <button type="button" className="activity-detail-back" onClick={handleBack}>
          ← Quay lại
        </button>

        {loading && <div className="activity-detail-status">Đang tải chi tiết…</div>}

        {error && !loading && (
          <div className="activity-detail-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && activity && categoryStyle && (
          <article className="activity-detail-card myprofile-card">
            <div className="activity-detail-hero">
              <span
                className="activity-detail-category"
                style={{ background: categoryStyle.bg, color: categoryStyle.color }}
              >
                {activity.categoryName}
              </span>
              <h1>{activity.title}</h1>
            </div>

            <DetailSection title="Thông tin cơ bản">
              <dl className="activity-detail-facts">
                <div>
                  <dt>Địa điểm</dt>
                  <dd>{activity.location}</dd>
                </div>
                <div>
                  <dt>Người tổ chức</dt>
                  <dd className="activity-detail-host-row">
                    {activity.host ? (
                      <button
                        type="button"
                        className="activity-detail-host-link"
                        onClick={() => navigate(`/users/${activity.host!.id}`)}
                      >
                        {activity.host.avatarUrl ? (
                          <img src={activity.host.avatarUrl} alt="" className="activity-detail-host-avatar" />
                        ) : (
                          <span className="activity-detail-host-avatar activity-detail-host-avatar-fallback" aria-hidden>
                            {hostInitial(hostDisplayName)}
                          </span>
                        )}
                        <span>{hostDisplayName}</span>
                      </button>
                    ) : (
                      <span className="activity-detail-host-row-fallback">{hostDisplayName}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </DetailSection>

            <DetailSection title="Thời gian">
              <p className="activity-detail-text">{formatActivityTimeRange(activity.startTime, activity.endTime)}</p>
            </DetailSection>

            <DetailSection title="Hạn đăng ký">
              <p className="activity-detail-text">{formatActivityDateTime(activity.deadline)}</p>
            </DetailSection>

            <DetailSection title="Yêu cầu về giới tính">
              <p className="activity-detail-text">{formatActivityGender(activity.gender)}</p>
            </DetailSection>

            <DetailSection title="Mục đích">
              <p className="activity-detail-text">{activity.purpose?.trim() || '—'}</p>
            </DetailSection>

            <DetailSection title="Người tham gia">
              <p className="activity-detail-participant-count">
                <strong>
                  {activity.currentParticipants}/{activity.maxSlots}
                </strong>{' '}
                người đã tham gia
              </p>

              {activity.participants.length === 0 ? (
                <p className="activity-detail-muted">Chưa có ai tham gia.</p>
              ) : (
                <ul className="activity-detail-participants">
                  {activity.participants.map((participant) => (
                    <li key={participant.id}>
                      <button
                        type="button"
                        className="activity-detail-participant-link"
                        onClick={() => navigate(`/users/${participant.id}`)}
                      >
                        <span className="activity-detail-participant-name">{participant.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            {activity.description?.trim() && (
              <DetailSection title="Mô tả chi tiết">
                <p className="activity-detail-text activity-detail-description">{activity.description.trim()}</p>
              </DetailSection>
            )}

            {showJoinButton && (
              <div className="activity-detail-actions">
                <button
                  type="button"
                  className="activity-detail-join-btn"
                  disabled
                  title="Chức năng tham gia hoạt động sẽ được bổ sung ở task tiếp theo"
                >
                  Tham gia
                </button>
                <p className="activity-detail-muted activity-detail-join-hint">
                  Chức năng tham gia sẽ được bổ sung ở task tiếp theo.
                </p>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  )
}
