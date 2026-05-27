import { useEffect, useState } from 'react'
import { getDashboard } from '../api'
import { LoadingState } from '../components/common/LoadingState'
import { AppNav } from '../components/layout/AppNav'
import { getApiErrorMessage } from '../lib/errors'
import { formatActivityTime } from '../lib/formatActivity'
import { isAccessTokenValid, loginPath } from '../lib/auth'
import { navigate } from '../lib/navigation'
import type { DashboardActivity, DashboardResponse } from '../types/dashboard'
import '../App.css'
import './ProfilePage.css'
import './MyEventsPage.css'

function formatRole(role: 'host' | 'joined') {
  return role === 'host' ? 'Tổ chức' : 'Tham gia'
}

function roleClass(role: 'host' | 'joined') {
  return role === 'host' ? 'is-host' : 'is-joined'
}

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [upcoming, setUpcoming] = useState<DashboardActivity[]>([])
  const [history, setHistory] = useState<DashboardActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAccessTokenValid()) {
      navigate(loginPath)
      return
    }

    let alive = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = (await getDashboard()) as DashboardResponse
        if (!alive) return
        setUpcoming(data.activities?.upcoming ?? [])
        setHistory(data.activities?.history ?? [])
      } catch (err) {
        if (!alive) return
        setError(getApiErrorMessage(err, 'Không thể tải sự kiện của bạn'))
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
  }, [])

  const visibleActivities = activeTab === 'upcoming' ? upcoming : history

  return (
    <div className="my-events-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <div className="my-events-shell">
        <AppNav active="my-events" />

        <div className="my-events-intro">
          <h1>Hoạt động của tôi</h1>
          <p>Các hoạt động bạn đã tạo hoặc đã tham gia trên BuddyHub.</p>
        </div>

        <section className="myprofile-card activity-panel my-events-panel">
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

          {loading && <LoadingState className="empty-state" label="Đang tải sự kiện..." />}

          {error && !loading && <div className="my-events-error">{error}</div>}

          {!loading && !error && (
            <div className="activity-list">
              {visibleActivities.length === 0 ? (
                <div className="empty-state">
                  {activeTab === 'upcoming' ? 'Chưa có sự kiện sắp tới.' : 'Chưa có lịch sử hoạt động.'}
                </div>
              ) : (
                visibleActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    className="activity-item my-events-item"
                    onClick={() => navigate(`/activities/${activity.id}?from=my-events`)}
                  >
                    {activity.imageUrl ? (
                      <img src={activity.imageUrl} alt="" className="activity-thumb" loading="lazy" />
                    ) : (
                      <div className={`activity-icon ${roleClass(activity.role)}`}>□</div>
                    )}
                    <div className="activity-content">
                      <h4>{activity.title}</h4>
                      <p>
                        <span className="my-events-category">{activity.categoryName}</span>
                        {' · '}
                        {formatActivityTime(activity.startTime)} · {activity.location}
                      </p>
                    </div>
                    <div className="activity-meta">
                      <span className={`role-pill ${roleClass(activity.role)}`}>{formatRole(activity.role)}</span>
                      <span className="slots">
                        {activity.currentParticipants}/{activity.maxSlots}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
