import { useEffect, useState } from "react";
import { getDashboard } from "./api";
import AuthPage from "./pages/AuthPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import ActivityListPage from "./pages/ActivityListPage";
import ChangePasswordPage from "./pages/ChangePasswordPage.tsx";
import CreateActivityPage from "./pages/CreateActivityPage";
import MyEventsPage from "./pages/MyEventsPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import {
  clearAccessToken,
  clearExpiredAccessToken,
  homePath,
  isAccessTokenValid,
  loginPath,
  setAuthRedirectMessage,
} from "./lib/auth";

const protectedRouteMessage = "Bạn phải đăng nhập để xem các trang này.";

function getActivityDetailId(pathname: string) {
  const match = pathname.match(/^\/activities\/([^/]+)$/);
  if (!match) return null;
  const id = match[1];
  if (id === "new") return null;
  return id;
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/me" ||
    pathname === "/me/password" ||
    pathname === "/my-events" ||
    pathname === "/activities" ||
    pathname.startsWith("/activities/") ||
    pathname.startsWith("/users/")
  );
}

function ProtectedRouteRedirect() {
  useEffect(() => {
    setAuthRedirectMessage(protectedRouteMessage);

    const timeoutId = window.setTimeout(() => {
      window.history.replaceState(null, "", loginPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main className="auth-page protected-redirect-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <section className="protected-redirect-card" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden />
        <h1>{protectedRouteMessage}</h1>
        <p>Đang chuyển bạn tới trang đăng nhập...</p>
      </section>
    </main>
  );
}

function App() {
  const [pathname, setPathname] = useState(() => {
    try {
      return typeof window !== "undefined"
        ? window.location.pathname
        : "/auth/register";
    } catch {
      return "/auth/register";
    }
  });

  useEffect(() => {
    const onPop = () => {
      try {
        setPathname(window.location.pathname);
      } catch {
        return;
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    clearExpiredAccessToken();

    if (!(pathname === "/" || pathname.startsWith("/auth")) || !isAccessTokenValid()) {
      return;
    }

    let alive = true;

    const validateAndRedirect = async () => {
      try {
        await getDashboard();
        if (!alive) return;

        window.history.replaceState(null, "", homePath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch {
        if (!alive) return;

        clearAccessToken();
      }
    };

    void validateAndRedirect();

    return () => {
      alive = false;
    };
  }, [pathname]);

  if (isProtectedPath(pathname) && !isAccessTokenValid()) {
    return <ProtectedRouteRedirect />;
  }

  if (pathname === "/me") {
    return <ProfilePage />;
  }

  if (pathname === "/me/password") {
    return <ChangePasswordPage />;
  }

  if (pathname === "/my-events") {
    return <MyEventsPage />;
  }

  if (pathname === "/activities") {
    return <ActivityListPage />;
  }

  if (pathname === "/activities/new") {
    return <CreateActivityPage />;
  }

  const activityId = getActivityDetailId(pathname);
  if (activityId) {
    return <ActivityDetailPage activityId={activityId} />;
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    return <UserProfilePage userId={userMatch[1]} />;
  }

  return <AuthPage />;
}

export default App;
