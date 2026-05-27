import { getCategoryStyle } from '../../lib/categoryStyle'
import { formatActivityDateShort, formatActivityTimeOnly } from '../../lib/formatActivity'
import { navigate } from '../../lib/navigation'
import type { ActivityListItem } from '../../types/activity'

type ActivityBrowseCardProps = {
  activity: ActivityListItem
}

function hostInitial(name?: string) {
  const char = name?.trim()?.charAt(0)
  return char ? char.toUpperCase() : '?'
}

export function ActivityBrowseCard({ activity }: ActivityBrowseCardProps) {
  const categoryStyle = getCategoryStyle(activity.categoryName)
  const fillPercent = activity.maxSlots > 0
    ? Math.min(100, Math.round((activity.currentParticipants / activity.maxSlots) * 100))
    : 0
  const summary = activity.description?.trim() || activity.purpose?.trim() || 'Chưa có mô tả chi tiết.'
  const hostName = activity.host?.name ?? 'BuddyHub member'

  const goDetail = () => navigate(`/activities/${activity.id}`)

  return (
    <article className="activity-browse-card">
      <div className="activity-browse-card-top">
        <span
          className="activity-browse-category"
          style={{ background: categoryStyle.bg, color: categoryStyle.color }}
        >
          {activity.categoryName}
        </span>
        <span className="activity-browse-date">{formatActivityDateShort(activity.startTime)}</span>
      </div>

      <h3 className="activity-browse-title">{activity.title}</h3>

      <div className="activity-browse-host">
        {activity.host?.avatarUrl ? (
          <img src={activity.host.avatarUrl} alt="" className="activity-browse-host-avatar" />
        ) : (
          <span className="activity-browse-host-avatar activity-browse-host-avatar-fallback" aria-hidden>
            {hostInitial(hostName)}
          </span>
        )}
        <span>{hostName}</span>
      </div>

      <ul className="activity-browse-meta">
        <li>🕐 {formatActivityTimeOnly(activity.startTime)}</li>
        <li>📍 {activity.location}</li>
        <li>
          👥 {activity.currentParticipants}/{activity.maxSlots} người tham gia
        </li>
      </ul>

      <div className="activity-browse-progress" aria-hidden>
        <span style={{ width: `${fillPercent}%` }} />
      </div>

      <p className="activity-browse-summary">{summary}</p>

      <div className="activity-browse-actions">
        <button type="button" className="activity-browse-btn activity-browse-btn-primary" onClick={goDetail}>
          Xem chi tiết
        </button>
      </div>
    </article>
  )
}
