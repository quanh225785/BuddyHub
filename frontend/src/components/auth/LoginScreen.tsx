import { useState } from 'react'
import { ButtonSpinner } from '../common/LoadingState'
import type { Banner, FieldErrors, LoginForm } from '../../types/auth'
import { EyeIcon, EyeOffIcon, MailIcon } from './icons'

type LoginScreenProps = {
  form: LoginForm
  errors: FieldErrors<keyof LoginForm>
  loading: boolean
  banner: Banner
  onChange: (field: keyof LoginForm, value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onGoRegister: () => void
}

export function LoginScreen({
  form,
  errors,
  loading,
  banner,
  onChange,
  onSubmit,
  onGoRegister,
}: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <div className="screen-icon screen-icon-login" aria-hidden="true">
        <MailIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>ÄÄƒng nháº­p</h1>
        <p>Nháº­p email HUST vÃ  máº­t kháº©u Ä‘á»ƒ tiáº¿p tá»¥c.</p>
      </div>

      {banner && (
        <div className={`banner banner-${banner.tone}`} role="alert" aria-live="polite">
          {banner.text}
        </div>
      )}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Email HUST</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="ten.ho225726@sis.hust.edu.vn"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Máº­t kháº©u</span>
          <div className="password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => onChange('password', event.target.value)}
              placeholder="Nháº­p máº­t kháº©u"
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'áº¨n máº­t kháº©u' : 'Hiá»‡n máº­t kháº©u'}
            >
              {showPassword ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
            </button>
          </div>
          {errors.password && <small className="field-error">{errors.password}</small>}
        </label>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <ButtonSpinner label="Đang đăng nhập..." /> : 'ÄÄƒng nháº­p'}
        </button>

        <p className="auth-switch">
          <span>ChÆ°a cÃ³ tÃ i khoáº£n? </span>
          <button className="text-link-button" type="button" onClick={onGoRegister}>
            ÄÄƒng kÃ½ ngay
          </button>
        </p>
      </form>
    </>
  )
}

