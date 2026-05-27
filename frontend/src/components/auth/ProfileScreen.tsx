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
        <h1>HoÃ n táº¥t há»“ sÆ¡</h1>
        <p>BÆ°á»›c 3: Äiá»n thÃ´ng tin cÃ¡ nhÃ¢n Ä‘á»ƒ hoÃ n táº¥t Ä‘Äƒng kÃ½</p>
      </div>

      <div className="session-card">
        <span>Email</span>
        <strong>{email}</strong>
      </div>

      {banner?.tone === 'error' && <div className="banner banner-error">{banner.text}</div>}
      {banner?.tone === 'success' && <div className="banner banner-success">{banner.text}</div>}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {/* ThÃ´ng tin xÃ¡c thá»±c */}
        <fieldset>
          <legend className="fieldset-legend">ThÃ´ng tin xÃ¡c thá»±c</legend>

          <label className="field">
            <span>Há» vÃ  tÃªn</span>
            <input
              type="text"
              value={form.name}
              disabled
              placeholder="TÃªn sinh viÃªn"
              className="field-disabled"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </label>

          <label className="field">
            <span>Máº­t kháº©u</span>
            <div className="password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => onChange('password', event.target.value)}
                placeholder="Tá»‘i thiá»ƒu 8 kÃ½ tá»±, cÃ³ chá»¯ hoa vÃ  chá»¯ sá»‘"
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'áº¨n máº­t kháº©u' : 'Hiá»‡n máº­t kháº©u'}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <label className="field">
            <span>Nháº­p láº¡i máº­t kháº©u</span>
            <div className="password-row">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => onChange('confirmPassword', event.target.value)}
                placeholder="Nháº­p láº¡i máº­t kháº©u"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-pressed={showConfirm}
                aria-label={showConfirm ? 'áº¨n máº­t kháº©u' : 'Hiá»‡n máº­t kháº©u'}
                onClick={() => setShowConfirm((s) => !s)}
              >
                {showConfirm ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
              </button>
            </div>
            {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
          </label>

          <label className="field">
            <span>Giá»›i tÃ­nh</span>
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
                Ná»¯
              </button>
            </div>
            {errors.gender && <small className="field-error">{errors.gender}</small>}
          </label>
        </fieldset>

        {/* ThÃ´ng tin há»“ sÆ¡ */}
        <fieldset>
          <legend className="fieldset-legend">ThÃ´ng tin há»“ sÆ¡</legend>

          <label className="field">
            <span>Khoa / Viá»‡n</span>
            <input
              type="text"
              value={form.faculty}
              onChange={(event) => onChange('faculty', event.target.value)}
              placeholder="VÃ­ dá»¥: CÃ´ng nghá»‡ thÃ´ng tin"
              aria-invalid={Boolean(errors.faculty)}
            />
            {errors.faculty && <small className="field-error">{errors.faculty}</small>}
          </label>

          <label className="field">
            <span>NÄƒm há»c</span>
            <select
              value={form.schoolYear}
              onChange={(event) => onChange('schoolYear', event.target.value)}
              aria-invalid={Boolean(errors.schoolYear)}
            >
              <option value="">Chá»n nÄƒm há»c</option>
              <option value="1">NÄƒm 1</option>
              <option value="2">NÄƒm 2</option>
              <option value="3">NÄƒm 3</option>
              <option value="4">NÄƒm 4</option>
              <option value="5">NÄƒm 5</option>
              <option value="6">Cao há»c</option>
            </select>
            {errors.schoolYear && <small className="field-error">{errors.schoolYear}</small>}
          </label>

          <div className="field">
            <span>Sá»Ÿ thÃ­ch</span>
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
            <span>Giá»›i thiá»‡u báº£n thÃ¢n</span>
            <textarea
              rows={4}
              maxLength={200}
              value={form.bio}
              onChange={(event) => onChange('bio', event.target.value)}
              placeholder="Ká»ƒ má»™t chÃºt vá» báº£n thÃ¢n..."
              aria-invalid={Boolean(errors.bio)}
            />
            <div className="field-footer">
              {errors.bio ? <small className="field-error">{errors.bio}</small> : <span />}
              <span className="char-count">{form.bio.length}/200</span>
            </div>
          </label>
        </fieldset>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <ButtonSpinner label="Đang hoàn tất..." /> : 'HoÃ n táº¥t Ä‘Äƒng kÃ½'}
        </button>
      </form>
    </>
  )
}

