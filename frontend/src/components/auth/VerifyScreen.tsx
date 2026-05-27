import type { Banner } from '../../types/auth'
import { ShieldCheckIcon } from './icons'
import { StepIndicator } from './StepIndicator'

type VerifyScreenProps = {
  email: string
  studentId?: string
  otpDigits: string[]
  loading: boolean
  resendLoading: boolean
  banner: Banner
  onOtpDigitChange: (index: number, value: string) => void
  onOtpKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void
  onOtpPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onResend: () => void
  onBack: () => void
  inputRef: (index: number, element: HTMLInputElement | null) => void
}

export function VerifyScreen({
  email,
  studentId,
  otpDigits,
  loading,
  resendLoading,
  banner,
  onOtpDigitChange,
  onOtpKeyDown,
  onOtpPaste,
  onSubmit,
  onResend,
  onBack,
  inputRef,
}: VerifyScreenProps) {
  return (
    <>
      <StepIndicator currentStep={2} />

      <div className="screen-icon screen-icon-verify" aria-hidden="true">
        <ShieldCheckIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>Nhập mã xác thực</h1>
        <p>
          Bước 2: Mã 6 chữ số đã được gửi đến <strong>{email || 'email HUST của bạn'}</strong>
        </p>
      </div>

      {studentId ? (
        <div className="session-card">
          <span>Số sinh viên</span>
          <strong>{studentId}</strong>
        </div>
      ) : null}

      {banner && <div className={`banner banner-${banner.tone}`}>{banner.text}</div>}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="otp-grid" onPaste={onOtpPaste}>
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => inputRef(index, element)}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => onOtpDigitChange(index, event.target.value)}
              onKeyDown={(event) => onOtpKeyDown(index, event)}
              aria-label={`OTP số ${index + 1}`}
            />
          ))}
        </div>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Đang xác thực...' : 'Xác nhận'}
        </button>

        <div className="inline-actions">
          <button className="text-button text-button-left" type="button" onClick={onBack}>
            Quay lại
          </button>
          <button className="text-button text-button-right" type="button" onClick={onResend} disabled={resendLoading}>
            {resendLoading ? 'Đang gửi lại...' : 'Gửi lại mã'}
          </button>
        </div>
      </form>
    </>
  )
}
