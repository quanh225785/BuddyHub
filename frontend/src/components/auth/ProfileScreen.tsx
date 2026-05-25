import type { Banner, FieldErrors, ProfileForm } from '../../types/auth'
import { UserIcon } from './icons'

type ProfileScreenProps = {
  email: string
  verifiedName: string
  studentId: string
  suggestedYearLabel: string
  form: ProfileForm
  errors: FieldErrors<keyof ProfileForm>
  loading: boolean
  banner: Banner
  interestOptions: string[]
  interestLoading: boolean
  onChange: (field: keyof ProfileForm, value: string) => void
  onToggleInterest: (interest: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function ProfileScreen({
  email,
  verifiedName,
  studentId,
  suggestedYearLabel,
  form,
  errors,
  loading,
  banner,
  interestOptions,
  interestLoading,
  onChange,
  onToggleInterest,
  onSubmit,
}: ProfileScreenProps) {
  return (
    <>
      <div className="screen-icon screen-icon-profile" aria-hidden="true">
        <UserIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>Đăng ký hồ sơ</h1>
        <p>Điền thông tin để hoàn tất bước đăng ký tài khoản.</p>
      </div>

      <div className="profile-summary-shell">
        <div className="session-card session-card-profile profile-summary-card">
          <div className="profile-summary-line">
            <span>Email</span>
            <strong>{email}</strong>
          </div>
          <div className="profile-summary-line">
            <span>Tên</span>
            <strong>{verifiedName}</strong>
          </div>
          <div className="profile-summary-meta-row">
            <div>
              <span>MSSV</span>
              <strong>{studentId || '—'}</strong>
            </div>
            <div>
              <span>Năm học</span>
              <strong>{suggestedYearLabel}</strong>
            </div>
          </div>
        </div>
      </div>

      {banner?.tone === 'error' && <div className="banner banner-error">{banner.text}</div>}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="field-grid">
          <label className="field">
            <span>Khoa / Viện</span>
            <input
              type="text"
              value={form.faculty}
              onChange={(event) => onChange('faculty', event.target.value)}
              placeholder="Ví dụ: Công nghệ thông tin"
              aria-invalid={Boolean(errors.faculty)}
            />
            {errors.faculty && <small className="field-error">{errors.faculty}</small>}
          </label>
        </div>

        <div className="field">
          <span>Sở thích</span>
          {!interestLoading && interestOptions.length > 0 && (
            <div className="chip-grid">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`chip ${form.interests.includes(interest) ? 'is-selected' : ''}`}
                  onClick={() => onToggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="field">
          <span>Giới thiệu bản thân</span>
          <textarea
            rows={4}
            maxLength={200}
            value={form.bio}
            onChange={(event) => onChange('bio', event.target.value)}
            placeholder="Kể một chút về bản thân..."
            aria-invalid={Boolean(errors.bio)}
          />
          <div className="field-footer">
            {errors.bio ? <small className="field-error">{errors.bio}</small> : <span />}
            <span className="char-count">{form.bio.length}/200</span>
          </div>
        </label>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Đang lưu thông tin đăng ký...' : 'Hoàn tất đăng ký'}
        </button>
      </form>
    </>
  )
}
