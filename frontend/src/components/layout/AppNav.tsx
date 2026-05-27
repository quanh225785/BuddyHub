import { useEffect, useRef, useState } from 'react'
import { clearAccessToken, isAccessTokenValid, loginPath } from '../../lib/auth'
import { navigate } from '../../lib/navigation'
import './AppNav.css'

type AppNavProps = {
  active?: 'activities' | 'my-events'
}

export function AppNav({ active }: AppNavProps) {
  const isLoggedIn = isAccessTokenValid()
  const [accountOpen, setAccountOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const confirmLogout = () => {
    clearAccessToken()
    setLogoutOpen(false)
    setAccountOpen(false)
    navigate(loginPath)
  }

  return (
    <>
      <header className="app-nav">
        <button type="button" className="app-nav-brand" onClick={() => navigate('/activities')}>
          <span className="app-nav-mark" aria-hidden>
            BH
          </span>
          <strong>BuddyHub</strong>
        </button>

        <nav className="app-nav-tabs" aria-label="Điều hướng chính">
          {isLoggedIn && (
            <button type="button" className="app-nav-tab" onClick={() => navigate('/activities/new')}>
              + Tạo hoạt động
            </button>
          )}
          <button
            type="button"
            className={`app-nav-tab ${active === 'activities' ? 'is-active' : ''}`}
            onClick={() => navigate('/activities')}
          >
            Hoạt động
          </button>
          {isLoggedIn && (
            <button
              type="button"
              className={`app-nav-tab ${active === 'my-events' ? 'is-active' : ''}`}
              onClick={() => navigate('/my-events')}
            >
              Hoạt động của tôi
            </button>
          )}
        </nav>

        <div className="app-nav-account-zone">
          {isLoggedIn ? (
            <div className="app-nav-account" ref={accountRef}>
              <button
                type="button"
                className={`app-nav-account-button ${accountOpen ? 'is-open' : ''}`}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((value) => !value)}
              >
                Tài khoản
              </button>
              {accountOpen && (
                <div className="app-nav-account-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="app-nav-account-item"
                    onClick={() => {
                      setAccountOpen(false)
                      navigate('/me')
                    }}
                  >
                    Hồ sơ
                  </button>
                  
                  <button
                    type="button"
                    role="menuitem"
                    className="app-nav-account-item"
                    onClick={() => {
                      setAccountOpen(false)
                      navigate('/me/password')
                    }}
                  >
                    Đổi mật khẩu
                  </button>
                  
                  <button
                    type="button"
                    role="menuitem"
                    className="app-nav-account-item is-danger"
                    onClick={() => {
                      setAccountOpen(false)
                      setLogoutOpen(true)
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="app-nav-login" onClick={() => navigate(loginPath)}>
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {logoutOpen && (
        <div className="logout-modal-backdrop" role="presentation">
          <section className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
            <h2 id="logout-modal-title">Đăng xuất?</h2>
            <p>Bạn có chắc muốn đăng xuất khỏi BuddyHub không?</p>
            <div className="logout-modal-actions">
              <button type="button" className="logout-modal-cancel" onClick={() => setLogoutOpen(false)}>
                Hủy
              </button>
              <button type="button" className="logout-modal-confirm" onClick={confirmLogout}>
                Đăng xuất
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
