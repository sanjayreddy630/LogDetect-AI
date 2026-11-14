import {
  Activity, BookOpen, FileText, X
} from "lucide-react";
import { NAV_ITEMS } from "./navigation.js";

export default function Sidebar({ activePage, onNavigate, open, issueCount }) {
  const groups = [...new Set(NAV_ITEMS.map((item) => item.group))];
  return (
    <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
      <div className="brand-lockup">
        <div className="brand-mark"><Activity size={21} strokeWidth={2.2} /></div>
        <div className="brand-copy">
          <strong>LogDetect <span>AI</span></strong>
          <small>Log Analytics &amp; Observability</small>
        </div>
        <button className="sidebar-close" onClick={() => onNavigate(activePage)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <div className="workspace-switcher">
        <div className="workspace-avatar">LD</div>
        <div><strong>LogDetect Workspace</strong><small>Personal workspace</small></div>
        <span className="switcher-chevron">⌄</span>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {groups.map((group) => (
          <div className="nav-group" key={group}>
            <p className="nav-group-label">{group}</p>
            {NAV_ITEMS.filter((item) => item.group === group).map(({ name, icon: Icon, badge }) => (
              <button
                key={name}
                className={`nav-item${activePage === name ? " nav-item-active" : ""}`}
                onClick={() => onNavigate(name)}
                aria-current={activePage === name ? "page" : undefined}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{name}</span>
                {badge && issueCount > 0 && <span className="nav-badge">{issueCount > 99 ? "99+" : issueCount}</span>}
                {name === "AI Investigation" && <span className="nav-new">AI</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-ai-card">
          <div className="sidebar-ai-icon"><BookOpen size={16} /></div>
          <div><strong>Need a hand?</strong><p>Explore guides for your workspace.</p></div>
          <button onClick={() => onNavigate("Help & Docs")} aria-label="Open help documentation">↗</button>
        </div>
        <div className="sidebar-version"><FileText size={13} /> LOGDETECT AI <span>2.0</span></div>
      </div>
    </aside>
  );
}
