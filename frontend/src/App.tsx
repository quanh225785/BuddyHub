import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import ActivityDetailPage from './pages/ActivityDetailPage'
import ActivityListPage from './pages/ActivityListPage'
import CreateActivityPage from './pages/CreateActivityPage'
import MyEventsPage from './pages/MyEventsPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'

function getActivityDetailId(pathname: string) {
  const match = pathname.match(/^\/activities\/([^/]+)$/)
  if (!match) return null
  const id = match[1]
  if (id === 'new') return null
  return id
}

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

  if (pathname === '/my-events') {
    return <MyEventsPage />
  }

  if (pathname === '/activities') {
    return <ActivityListPage />
  }

  if (pathname === '/activities/new') {
    return <CreateActivityPage />
  }

  const activityId = getActivityDetailId(pathname)
  if (activityId) {
    return <ActivityDetailPage activityId={activityId} />
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/)
  if (userMatch) {
    return <UserProfilePage userId={userMatch[1]} />
  }

  return <AuthPage />
}

export default App
