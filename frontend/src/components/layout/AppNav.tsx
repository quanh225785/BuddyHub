import { navigate } from '../../lib/navigation'
import './AppNav.css'

type AppNavProps = {
  active: 'activities' | 'profile'
}

export function AppNav({ active }: AppNavProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  return (
    <header className="app-nav">
      <button type="button" className="app-nav-brand" onClick={() => navigate('/me')}>
        <span className="app-nav-mark" aria-hidden>
          BH
        </span>
        <strong>BuddyHub</strong>
      </button>

      <nav className="app-nav-links" aria-label="Điều hướng chính">
        <button
          type="button"
          className={`app-nav-link ${active === 'activities' ? 'is-active' : ''}`}
          onClick={() => navigate('/activities')}
        >
          Hoạt động
        </button>
        <button
          type="button"
          className={`app-nav-link ${active === 'profile' ? 'is-active' : ''}`}
          onClick={() => navigate('/me')}
        >
          Hồ sơ
        </button>
      </nav>

      <div className="app-nav-actions">
        {token && (
          <button type="button" className="app-nav-create" onClick={() => navigate('/activities/new')}>
            + Tạo hoạt động
          </button>
        )}
        {token ? (
          <button type="button" className="app-nav-cta app-nav-cta-muted" onClick={() => navigate('/me')}>
            Tài khoản
          </button>
        ) : (
          <button type="button" className="app-nav-cta" onClick={() => navigate('/auth/login')}>
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  )
}
