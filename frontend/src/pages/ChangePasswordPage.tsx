import { useState } from 'react'
import { changePassword } from '../api'
import { AppNav } from '../components/layout/AppNav'
import { navigate } from '../lib/navigation'
import './ChangePasswordPage.css'

const passwordRules = ['Ít nhất 8 ký tự', 'Có ít nhất 1 chữ hoa', 'Có ít nhất 1 chữ số']

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value)
}

function getPasswordRuleStates(value: string) {
  return {
    minLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasDigit: /\d/.test(value),
  }
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const ruleStates = getPasswordRuleStates(newPassword)
  const current = currentPassword.trim()
  const next = newPassword.trim()
  const confirm = confirmPassword.trim()
  const isCurrentFilled = current.length > 0
  const isNextStrong = isStrongPassword(next)
  const isNewDifferent = next.length > 0 && next !== current
  const isConfirmFilled = confirm.length > 0
  const isConfirmMatch = confirm.length > 0 && next === confirm
  const canSave =
    !saving &&
    isCurrentFilled &&
    isNextStrong &&
    isNewDifferent &&
    isConfirmFilled &&
    isConfirmMatch

  const handleSubmit = async () => {
    if (!current || !next || !confirm) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (!isStrongPassword(next)) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số')
      return
    }

    if (next === current) {
      setError('Mật khẩu mới không được giống mật khẩu cũ')
      return
    }

    if (next !== confirm) {
      setError('Mật khẩu nhập lại phải giống mật khẩu mới')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await changePassword({ currentPassword: current, newPassword: next })
      setSuccess('Đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể đổi mật khẩu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="myprofile-shell">
      <AppNav />

      <div className="myprofile-content password-page-content">
        <section className="myprofile-card password-page-card">
          <div className="password-page-hero">
            <div>
              <h1>Đổi mật khẩu</h1>
              <p>Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật tài khoản của bạn.</p>
            </div>
          </div>

          <div className="password-page-form">
            <label className="password-page-field">
              <span>Mật khẩu hiện tại</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value)
                  setError(null)
                }}
              />
            </label>

            <label className="password-page-field">
              <span>Mật khẩu mới</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  setError(null)
                  setSuccess(null)
                }}
              />
              {newPassword.trim().length > 0 && current.length > 0 && (
                <div className={`password-page-current-hint ${isNewDifferent ? 'is-good' : 'is-bad'}`}>
                  {isNewDifferent ? 'Mật khẩu mới khác mật khẩu hiện tại' : 'Mật khẩu mới không được giống mật khẩu hiện tại'}
                </div>
              )}
              <div className="password-page-rules">
                {passwordRules.map((rule, index) => (
                  <span
                    key={rule}
                    className={[
                      index === 0 && ruleStates.minLength ? 'is-good' : index === 0 ? 'is-bad' : '',
                      index === 1 && ruleStates.hasUppercase ? 'is-good' : index === 1 ? 'is-bad' : '',
                      index === 2 && ruleStates.hasDigit ? 'is-good' : index === 2 ? 'is-bad' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </label>

            <label className="password-page-field">
              <span>Nhập lại mật khẩu mới</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setError(null)
                }}
              />
              {(isConfirmFilled || isNextStrong) && (
                <div className={`password-page-confirm-hint ${isConfirmMatch ? 'is-good' : 'is-bad'}`}>
                  {isConfirmMatch ? 'Mật khẩu nhập lại khớp' : 'Mật khẩu nhập lại phải giống mật khẩu mới'}
                </div>
              )}
            </label>

            {error && <div className="password-page-error">{error}</div>}
            {success && <div className="password-page-success">{success}</div>}

            <div className="password-page-actions">
              <button type="button" className="cancel-button" onClick={() => navigate('/me')} disabled={saving}>
                Hủy
              </button>
              <button type="button" className="save-button" onClick={handleSubmit} disabled={!canSave}>
                {saving ? 'Đang lưu...' : 'Lưu mật khẩu'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
