import { useEffect, useState } from "react";
import { getPublicProfile } from "../api";
import { AppNav } from "../components/layout/AppNav";
import { navigate } from "../lib/navigation";
import "./ProfilePage.css";

type PublicProfileResponse = {
  message: string;
  profile: {
    name: string;
    faculty?: string | null;
    schoolYear?: number | null;
    interests: string[];
    avatarUrl?: string | null;
    bio?: string | null;
    gender?: "MALE" | "FEMALE" | "ALL" | null;
    hostedCount: number;
    joinedCount: number;
    isVerified: boolean;
  };
};

function formatGender(value?: "MALE" | "FEMALE" | "ALL" | null) {
  if (value === "MALE") return "Nam";
  if (value === "FEMALE") return "Nữ";
  return "Chưa cập nhật";
}

function makeHandle(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
}

export default function UserProfilePage({ userId }: { userId: string }) {
  const [data, setData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = (await getPublicProfile(userId)) as PublicProfileResponse;
        if (!alive) return;
        setData(res);
      } catch (e: any) {
        if (!alive) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Lỗi khi tải hồ sơ người dùng",
        );
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <main className="myprofile-shell public-profile-shell">
        <AppNav active="profile" />
        <div className="public-profile-state">Đang tải hồ sơ...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="myprofile-shell public-profile-shell">
        <AppNav active="profile" />
        <button type="button" className="profile-back" onClick={() => window.history.back()}>
          ← Quay lại
        </button>
        <div className="public-profile-state public-profile-state-error">Lỗi: {error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="myprofile-shell public-profile-shell">
        <AppNav active="profile" />
        <div className="public-profile-state">Không có hồ sơ</div>
      </main>
    );
  }

  const profile = data.profile;
  const initial = profile.name.trim().charAt(0).toUpperCase() || "?";
  const genderLabel = formatGender(profile.gender);
  const handle = makeHandle(profile.name);

  return (
    <main className="myprofile-shell public-profile-shell">
      <AppNav active="profile" />

      <button type="button" className="profile-back" onClick={() => window.history.back()}>
        ← Quay lại
      </button>

      <section className="myprofile-card public-profile-card">
        <div className="public-profile-cover" />

        <div className="public-profile-header">
          <div className="public-profile-avatar" aria-hidden>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <div className="public-profile-avatar-placeholder">{initial}</div>
            )}
            <span className="public-profile-presence" />
          </div>

          <div className="public-profile-meta">
            <div className="public-profile-name-row">
              <h1>{profile.name}</h1>
              {handle && <span className="handle">@{handle}</span>}
            </div>

            <div className="public-profile-sub">
              {profile.isVerified && <span className="badge">HUST Verified</span>}
              <span className="public-profile-visibility">Hồ sơ công khai</span>
            </div>

            <div className="meta-line">
              {profile.faculty || "Chưa cập nhật khoa / viện"}
              {profile.schoolYear ? ` · Năm ${profile.schoolYear}` : ""}
            </div>
            <div className="meta-line">Giới tính: {genderLabel}</div>
          </div>
        </div>

        <p className="public-profile-bio">{profile.bio || "Chưa có phần giới thiệu."}</p>

        <div className="counts">
          <div className="count">
            <strong>{profile.hostedCount}</strong>
            <span>Đã tổ chức</span>
          </div>
          <div className="count">
            <strong>{profile.joinedCount}</strong>
            <span>Đã tham gia</span>
          </div>
        </div>

        <div className="public-profile-content-grid">
          <div className="interests public-profile-section">
            <div className="section-head">
              <h3>Sở thích</h3>
            </div>
            <div className="chips">
              {profile.interests.length === 0 ? (
                <span className="muted">Chưa cập nhật</span>
              ) : (
                profile.interests.map((interest) => (
                  <span key={interest} className="chip">
                    {interest}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="public-profile-section public-profile-info">
            <h3>Thông tin</h3>
            <div className="public-profile-info-list">
              <div>
                <span>Khoa / Viện</span>
                <strong>{profile.faculty || "Chưa cập nhật"}</strong>
              </div>
              <div>
                <span>Năm học</span>
                <strong>{profile.schoolYear ? `Năm ${profile.schoolYear}` : "Chưa cập nhật"}</strong>
              </div>
              <div>
                <span>Giới tính</span>
                <strong>{genderLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="public-profile-actions">
          <button type="button" className="cancel-button" onClick={() => window.history.back()}>
            Quay lại hoạt động
          </button>
          <button type="button" className="save-button" onClick={() => navigate("/activities")}>
            Khám phá hoạt động
          </button>
        </div>
      </section>
    </main>
  );
}
