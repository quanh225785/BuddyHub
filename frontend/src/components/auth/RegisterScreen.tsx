import type { Banner, FieldErrors } from '../../types/auth'
import { ButtonSpinner } from '../common/LoadingState'
import { MailIcon } from './icons'
import { StepIndicator } from './StepIndicator'

type RegisterScreenProps = {
  email: string
  errors: FieldErrors<'email'>
  loading: boolean
  banner: Banner
  onChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onGoLogin: () => void
}

export function RegisterScreen({
  email,
  errors,
  loading,
  banner,
  onChange,
  onSubmit,
  onGoLogin,
}: RegisterScreenProps) {
  return (
    <>
      <StepIndicator currentStep={1} />

      <div className="screen-icon screen-icon-register" aria-hidden="true">
        <MailIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>ÄÄƒng kÃ½ tÃ i khoáº£n</h1>
        <p>BÆ°á»›c 1: Nháº­p email Ä‘á»ƒ xÃ¡c thá»±c</p>
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
            value={email}
            onChange={(event) => onChange(event.target.value)}
            placeholder="ten.ho225726@sis.hust.edu.vn"
            aria-invalid={Boolean(errors.email)}
            autoFocus
          />
          <small className="field-hint">Chá»‰ cháº¥p nháº­n email cÃ³ Ä‘uÃ´i @sis.hust.edu.vn</small>
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <ButtonSpinner label="Đang gửi mã..." /> : 'Gá»­i mÃ£ xÃ¡c thá»±c'}
        </button>

        <p className="auth-switch">
          <span>Báº¡n Ä‘Ã£ cÃ³ tÃ i khoáº£n? </span>
          <button className="text-link-button" type="button" onClick={onGoLogin}>
            ÄÄƒng nháº­p
          </button>
        </p>
      </form>
    </>
  )
}

