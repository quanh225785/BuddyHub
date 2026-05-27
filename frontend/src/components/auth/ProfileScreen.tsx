import { useState } from 'react'
import type { Banner, FieldErrors, CompleteProfileForm } from '../../types/auth'
import { ButtonSpinner, LoadingState } from '../common/LoadingState'
import { UserIcon, EyeIcon, EyeOffIcon } from './icons'
import { StepIndicator } from './StepIndicator'

type ProfileScreenProps = {
  email: string
  form: CompleteProfileForm
  errors: FieldErrors<keyof CompleteProfileForm>
  loading: boolean
  banner: Banner
  interestOptions: string[]
  interestLoading: boolean
  onChange: (field: keyof CompleteProfileForm, value: string) => void
  onAvatarChange: (file: File | null, previewUrl: string) => void
  onToggleInterest: (interest: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function ProfileScreen({
  email,
  form,
  errors,
  loading,
  banner,
  interestOptions,
  interestLoading,
  onChange,
  onAvatarChange,
  onToggleInterest,
  onSubmit,
}: ProfileScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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

  return (
    <>
      <StepIndicator currentStep={3} />

      <div className="screen-icon screen-icon-profile" aria-hidden="true">
        <UserIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>Hoàn tất hồ sơ</h1>
        <p>Bước 3: Điền thông tin cá nhân để hoàn tất đăng ký</p>
      </div>

      <div className="session-card">
        <span>Email</span>
        <strong>{email}</strong>
      </div>

      {banner?.tone === 'error' && <div className="banner banner-error">{banner.text}</div>}
      {banner?.tone === 'success' && <div className="banner banner-success">{banner.text}</div>}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend className="fieldset-legend">Thông tin xác thực</legend>

          <label className="field">
            <span>Họ và tên</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="Tên sinh viên"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => onChange('password', event.target.value)}
                placeholder="Tối thiểu 8 ký tự, có chữ hoa và chữ số"
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
            <div className="password-hints" aria-live="polite">
              {(() => {
                const val = form.password || ''
                const hasMin = val.length >= 8
                const hasUpper = /[A-Z]/.test(val)
                const hasDigit = /\d/.test(val)
                return (
                  <>
                    <div className={`hint-item ${hasMin ? 'good' : 'bad'}`}>● Ít nhất 8 ký tự</div>
                    <div className={`hint-item ${hasUpper ? 'good' : 'bad'}`}>● Ít nhất 1 chữ hoa</div>
                    <div className={`hint-item ${hasDigit ? 'good' : 'bad'}`}>● Ít nhất 1 chữ số</div>
                  </>
                )
              })()}
            </div>
          </label>

          <label className="field">
            <span>Nhập lại mật khẩu</span>
            <div className="password-row">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => onChange('confirmPassword', event.target.value)}
                placeholder="Nhập lại mật khẩu"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-pressed={showConfirm}
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowConfirm((s) => !s)}
              >
                {showConfirm ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
              </button>
            </div>
            {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
            {(() => {
              const a = form.password || ''
              const b = form.confirmPassword || ''
              const show = b.length > 0 || a.length > 0
              const match = a === b && b.length > 0
              if (!show) return null
              return (
                <div className={`confirm-hint ${match ? 'good' : 'bad'}`} role="status" aria-live="polite">
                  {match ? 'Mật khẩu trùng khớp' : 'Mật khẩu không khớp'}
                </div>
              )
            })()}
          </label>

          <label className="field">
            <span>Giới tính</span>
            <select value={form.gender} onChange={(e) => onChange('gender', e.target.value)} aria-invalid={Boolean(errors.gender)}>
              <option value="">Chọn</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
            {errors.gender && <small className="field-error">{errors.gender}</small>}
          </label>
        </fieldset>

        <fieldset>
          <legend className="fieldset-legend">Thông tin hồ sơ</legend>

          <div className="field">
            <span>Ảnh đại diện</span>
            <div>
              <label className="avatar upload-label" title="Nhấn để đổi ảnh">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (!file) {
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => onAvatarChange(file, reader.result as string)
                    reader.readAsDataURL(file)
                  }}
                />
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="avatar preview" />
                ) : (
                  <div className="avatar-placeholder">{(form.name && form.name.trim().charAt(0).toUpperCase()) || email.trim().charAt(0).toUpperCase()}</div>
                )}
                <span className="avatar-edit" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                    <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                  </svg>
                </span>
              </label>
            </div>
          </div>

          <label className="field">
            <span>Khoa / Viện</span>
            <select
              value={form.faculty}
              onChange={(event) => onChange('faculty', event.target.value)}
              aria-invalid={Boolean(errors.faculty)}
            >
              <option value="">Chọn khoa / viện</option>
              {facultyOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errors.faculty && <small className="field-error">{errors.faculty}</small>}
          </label>

          <label className="field">
            <span>Năm học</span>
            <select
              value={form.schoolYear}
              onChange={(event) => onChange('schoolYear', event.target.value)}
              aria-invalid={Boolean(errors.schoolYear)}
            >
              <option value="">Chọn năm học</option>
              <option value="1">Năm 1</option>
              <option value="2">Năm 2</option>
              <option value="3">Năm 3</option>
              <option value="4">Năm 4</option>
              <option value="5">Năm 5</option>
              <option value="6">Cao học</option>
            </select>
            {errors.schoolYear && <small className="field-error">{errors.schoolYear}</small>}
          </label>

          <div className="field">
            <span>Sở thích</span>
            {interestLoading && <LoadingState className="field-loading-state" label="Đang tải sở thích..." />}
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
        </fieldset>

        <button
          className="primary-button"
          type="submit"
          disabled={
            loading || ((form.password.length > 0 || form.confirmPassword.length > 0) && form.password !== form.confirmPassword)
          }
        >
          {loading ? <ButtonSpinner label="Đang hoàn tất..." /> : 'Hoàn tất đăng ký'}
        </button>
      </form>
    </>
  )
}

