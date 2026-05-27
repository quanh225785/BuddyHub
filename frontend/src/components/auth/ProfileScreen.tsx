import { useState } from 'react'
import type { Banner, FieldErrors, CompleteProfileForm } from '../../types/auth'
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
  onToggleInterest,
  onSubmit,
}: ProfileScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
        {/* Thông tin xác thực */}
        <fieldset>
          <legend className="fieldset-legend">Thông tin xác thực</legend>

          <label className="field">
            <span>Họ và tên</span>
            <input
              type="text"
              value={form.name}
              disabled
              placeholder="Tên sinh viên"
              className="field-disabled"
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
          </label>

          <label className="field">
            <span>Giới tính</span>
            <div className="choice-row choice-row-gender">
              <button
                type="button"
                className={`choice-pill choice-pill-gender ${form.gender === 'male' ? 'is-selected' : ''}`}
                onClick={() => onChange('gender', 'male')}
              >
                Nam
              </button>
              <button
                type="button"
                className={`choice-pill choice-pill-gender ${form.gender === 'female' ? 'is-selected' : ''}`}
                onClick={() => onChange('gender', 'female')}
              >
                Nữ
              </button>
            </div>
            {errors.gender && <small className="field-error">{errors.gender}</small>}
          </label>
        </fieldset>

        {/* Thông tin hồ sơ */}
        <fieldset>
          <legend className="fieldset-legend">Thông tin hồ sơ</legend>

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

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Đang hoàn tất đăng ký...' : 'Hoàn tất đăng ký'}
        </button>
      </form>
    </>
  )
}
