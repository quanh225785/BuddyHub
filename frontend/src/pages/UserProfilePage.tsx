import { useEffect, useState } from 'react'
import { getPublicProfile } from '../api'
import { AppNav } from '../components/layout/AppNav'
import { navigate } from '../lib/navigation'
import './ProfilePage.css'

type PublicProfileResponse = {
  message: string
  profile: {
    name: string
    faculty?: string | null
    schoolYear?: number | null
    interests: string[]
    avatarUrl?: string | null
    bio?: string | null
    gender?: 'MALE' | 'FEMALE' | 'ALL' | null
    hostedCount: number
    joinedCount: number
    isVerified: boolean
  }
}

function formatGender(value?: 'MALE' | 'FEMALE' | 'ALL' | null) {
  if (value === 'MALE') return 'Nam'
  if (value === 'FEMALE') return 'Nữ'
  return 'Chưa cập nhật'
}

export default function UserProfilePage({ userId }: { userId: string }) {
  const [data, setData] = useState<PublicProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = (await getPublicProfile(userId)) as PublicProfileResponse
        if (!alive) return
        setData(res)
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Lỗi khi tải hồ sơ người dùng')
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [userId])

  if (loading) return <div className="myprofile-shell">Đang tải hồ sơ…</div>
  if (error) return <div className="myprofile-shell">Lỗi: {error}</div>
  if (!data) return <div className="myprofile-shell">Không có hồ sơ</div>

  const profile = data.profile
  const initial = (profile.name && profile.name.trim().charAt(0).toUpperCase()) || '?'
  const genderLabel = formatGender(profile.gender)

  return (
    <main className="myprofile-shell">
      <AppNav active="profile" />

      <button type="button" className="profile-back" onClick={() => window.history.back()}>
        ← Quay lại
      </button>

      <section className="myprofile-card myprofile-hero">
        <div className="myprofile-cover" />
        <div className="myprofile-header">
          <div className="avatar" aria-hidden>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" /> : <div className="avatar-placeholder">{initial}</div>}
          </div>

          <div className="meta">
            <div className="name-row">
              <h1>{profile.name}</h1>
            </div>
            <div className="sub">
              {profile.isVerified && <span className="badge">HUST Verified</span>}
            </div>
            <div className="meta-line">
              {profile.faculty || 'Chưa cập nhật khoa / viện'}{profile.schoolYear ? ` · Năm ${profile.schoolYear}` : ''}
            </div>
            <div className="meta-line">Giới tính: {genderLabel}</div>
          </div>

          <div className="action">
            {/* public profile: no edit button */}
          </div>
        </div>

        <p className="bio">{profile.bio || 'Chưa có phần giới thiệu.'}</p>

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
            {profile.interests.length === 0 ? (
              <span className="muted">Chưa cập nhật</span>
            ) : (
              profile.interests.map((interest) => (
                <span key={interest} className="chip">
                  {interest}
                </span>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
