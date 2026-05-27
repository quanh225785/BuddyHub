import { useDeferredValue, useEffect, useState } from 'react'
import { fetchActivities, fetchCategories, getDashboard } from '../api'
import { ActivityBrowseCard } from '../components/activities/ActivityBrowseCard'
import { AppNav } from '../components/layout/AppNav'
import { getApiErrorMessage } from '../lib/errors'
import { navigate } from '../lib/navigation'

import type { ActivityListItem } from '../types/activity'
import type { DashboardResponse } from '../types/dashboard'
import '../App.css'
import './ActivityListPage.css'

const TIME_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'tomorrow', label: 'Ngày mai' },
  { value: 'this_week', label: 'Tuần này' },
] as const

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 4.75a5.75 5.75 0 1 0 0 11.5a5.75 5.75 0 0 0 0-11.5Zm0-2a7.75 7.75 0 1 1 4.84 13.81l4.55 4.56a1 1 0 1 1-1.41 1.41l-4.56-4.55A7.75 7.75 0 0 1 10.5 2.75Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ActivityListPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([])
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [time, setTime] = useState('')
  const [matchMyInterests, setMatchMyInterests] = useState(false)
  const [myInterests, setMyInterests] = useState<string[]>([])
  const [myInterestsLoading, setMyInterestsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const deferredKeyword = useDeferredValue(keyword)

  const hasActiveFilters = Boolean(keyword.trim() || category || time || matchMyInterests)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await fetchCategories()
        const items = data?.categories
        if (!alive || !Array.isArray(items)) return
        setCategories(
          items.filter(
            (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0,
          ),
        )
      } catch {
        if (alive) setCategories([])
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
        setLoading(true)
        setError(null)

        const categoryParam: string | string[] | undefined = matchMyInterests
          ? myInterests.length > 0
            ? myInterests
            : ['__none__']
          : category || undefined

        const params = {
          keyword: deferredKeyword.trim() || undefined,
          category: categoryParam,
          time: time || undefined,
        }

        if (matchMyInterests && myInterests.length === 0 && !myInterestsLoading) {
          setActivities([])
          return
        }

        const data = await fetchActivities(params)
        if (!alive) return
        setActivities(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!alive) return
        setError(getApiErrorMessage(err, 'Không thể tải danh sách hoạt động'))
        setActivities([])
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
  }, [category, deferredKeyword, time, matchMyInterests, myInterests, myInterestsLoading])

  const toggleMatchMyInterests = async () => {
    if (matchMyInterests) {
      setMatchMyInterests(false)
      return
    }

    setCategory('')
    setMyInterestsLoading(true)
    try {
      const data = (await getDashboard()) as DashboardResponse
      const interests = Array.isArray(data?.profile?.interests) ? data.profile.interests : []
      setMyInterests(interests)
      setMatchMyInterests(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải sở thích cá nhân. Vui lòng đăng nhập lại.'))
    } finally {
      setMyInterestsLoading(false)
    }
  }

  const clearFilters = () => {
    setKeyword('')
    setCategory('')
    setTime('')
    setMatchMyInterests(false)
  }

  return (
    <div className="activity-browse-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <div className="activity-browse-shell">
        <AppNav active="activities" />

        <div className="activity-browse-intro">
          <div>
            <h1>Hoạt động có thể tham gia</h1>
            <p>Khám phá các hoạt động do sinh viên HUST tạo và tham gia cùng nhóm phù hợp với bạn.</p>
          </div>
          <button type="button" className="activity-browse-create-btn" onClick={() => navigate('/activities/new')}>
            + Tạo hoạt động
          </button>
        </div>

        <section className="activity-browse-filters" aria-label="Bộ lọc hoạt động">
          <div className="activity-browse-filters-body">
            <label className="activity-browse-search">
              <span className="activity-browse-field-label">Tìm kiếm</span>
              <span className="activity-browse-search-input">
                <span className="activity-browse-field-icon">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tên hoạt động, địa điểm, mục tiêu..."
                />
              </span>
            </label>

            <div className="activity-browse-filter-group">
              <label className="activity-browse-select">
                <span className="activity-browse-field-label">Loại hoạt động</span>
                <span className="activity-browse-select-shell">
                  <select
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value)
                      if (event.target.value) setMatchMyInterests(false)
                    }}
                    disabled={matchMyInterests}
                  >
                    <option value="">Tất cả loại</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="activity-browse-select">
                <span className="activity-browse-field-label">Thời gian</span>
                <span className="activity-browse-select-shell">
                  <select value={time} onChange={(event) => setTime(event.target.value)}>
                    {TIME_FILTER_OPTIONS.map((item) => (
                      <option key={item.value || 'all'} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <div className="activity-browse-filter-group">
              <button
                type="button"
                className={`activity-browse-match-button ${matchMyInterests ? 'is-active' : ''}`}
                onClick={toggleMatchMyInterests}
                disabled={myInterestsLoading}
              >
                {myInterestsLoading
                  ? 'Đang tải sở thích…'
                  : matchMyInterests
                    ? 'Đang lọc theo sở thích của tôi · Bỏ lọc'
                    : 'Lọc theo sở thích của tôi'}
              </button>
              {matchMyInterests && myInterests.length === 0 && !myInterestsLoading && (
                <small className="activity-browse-match-hint">
                  Bạn chưa chọn sở thích nào ở hồ sơ.
                </small>
              )}
              {matchMyInterests && myInterests.length > 0 && (
                <small className="activity-browse-match-hint">
                  Khớp với loại hoạt động: {myInterests.join(', ')}
                </small>
              )}
            </div>
          </div>
        </section>

        <div className="activity-browse-toolbar">
          <p className="activity-browse-count">
            {loading ? 'Đang tìm hoạt động phù hợp…' : `${activities.length} hoạt động`}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="activity-browse-clear activity-browse-clear-inline"
              onClick={clearFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {loading && <div className="activity-browse-status">Đang tải danh sách…</div>}

        {error && !loading && (
          <div className="activity-browse-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="activity-browse-empty">Không có hoạt động phù hợp</div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="activity-browse-grid">
            {activities.map((activity) => (
              <ActivityBrowseCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
