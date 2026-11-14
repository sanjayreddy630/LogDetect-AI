import { useState } from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";

export default function Header({
  page, search, onSearch, range, onRangeChange, onMenuClick,
  notifications, onOpenNotifications, userName
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const initials = userName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LD";
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="mobile-menu" onClick={onMenuClick} aria-label="Toggle navigation"><Menu size={20} /></button>
        <div>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{page}</strong></div>
          <h1>{page}</h1>
        </div>
      </div>
      <div className="topbar-tools">
        <label className={`global-search${searchOpen ? " global-search-open" : ""}`}>
          <Search size={16} />
          <input aria-label="Search logs, analyses, and services" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search logs, analyses..." />
          <kbd>⌘ K</kbd>
          <button type="button" className="global-search-trigger" onClick={() => setSearchOpen((open) => !open)} aria-label="Toggle search"><Search size={16} /></button>
        </label>
        {page === "Dashboard" && (
          <label className="range-select">
            <span>Period</span>
            <select value={range} onChange={(event) => onRangeChange(event.target.value)} aria-label="Dashboard time range">
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All activity</option>
            </select>
            <ChevronDown size={14} />
          </label>
        )}
        <div className="notification-wrap">
          <button
            className={`icon-button${notifications.length ? " has-notifications" : ""}`}
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={18} />
            {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="notification-popover">
              <div className="popover-heading"><strong>Latest signals</strong><button onClick={onOpenNotifications}>View all</button></div>
              {notifications.length ? notifications.map((item, index) => (
                <button className="notification-item" key={`${item.title}-${index}`} onClick={() => { setNotificationsOpen(false); onOpenNotifications(); }}>
                  <span className={`severity-dot severity-${(item.severity || "error").toLowerCase()}`} />
                  <span><strong>{item.title || "Analysis alert"}</strong><small>{item.root_cause || item.message || "From the latest saved analysis"}</small></span>
                </button>
              )) : <p className="popover-empty">No analysis signals to show.</p>}
              <p className="popover-footnote">Signals are findings from the latest analysis, not a live alert feed.</p>
            </div>
          )}
        </div>
        <div className="profile-chip">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-text"><strong>{userName}</strong><small>Workspace</small></div>
          <ChevronDown size={14} />
        </div>
      </div>
    </header>
  );
}
