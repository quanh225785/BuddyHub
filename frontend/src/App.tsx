import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const [pathname, setPathname] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/auth/register'
    } catch {
      return '/auth/register'
    }
  })

  useEffect(() => {
    const onPop = () => {
      try {
        setPathname(window.location.pathname)
      } catch {}
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (pathname === '/me') {
    return <ProfilePage />
  }

  return <AuthPage />
}

export default App
