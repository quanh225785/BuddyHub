import { useState } from 'react'
import type { Banner, FieldErrors, RegisterForm } from '../../types/auth'
import { MailIcon, EyeIcon, EyeOffIcon } from './icons'

type RegisterScreenProps = {
  form: RegisterForm
  errors: FieldErrors<keyof RegisterForm>
  loading: boolean
  banner: Banner
  onChange: (field: keyof RegisterForm, value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onGoLogin: () => void
}

export function RegisterScreen({
  form,
  errors,
  loading,
  banner,
  onChange,
  onSubmit,
  onGoLogin,
}: RegisterScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  return (
    <>
      <div className="screen-icon screen-icon-register" aria-hidden="true">
        <MailIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>Đăng ký tài khoản</h1>
      </div>

      {banner && (
        <div className={`banner banner-${banner.tone}`} role="alert" aria-live="polite">
          {banner.text}
        </div>
      )}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Họ và tên</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder="Nguyễn Văn A"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </label>

        <label className="field">
          <span>Email HUST</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="ten.ho225726@sis.hust.edu.vn"
            aria-invalid={Boolean(errors.email)}
          />
          <small className="field-hint">Chỉ chấp nhận email có đuôi @sis.hust.edu.vn</small>
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Mật khẩu</span>
          <div className="password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => onChange('password', event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
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

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
        </button>

        <p className="auth-switch">
          <span>Bạn đã có tài khoản? </span>
          <button className="text-link-button" type="button" onClick={onGoLogin}>
            Đăng nhập
          </button>
        </p>
      </form>
    </>
  )
}
