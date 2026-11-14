import { useState } from "react";
import {
  Activity, AlertOctagon, AlertTriangle, ArrowDownToLine, Bell,
  ChevronRight, CircleHelp, Clock3, FileClock, FileText,
  RefreshCw, Search, Server, Settings2, Share2, ShieldCheck,
  SlidersHorizontal, Sparkles, Terminal
} from "lucide-react";

const LEVEL_COLORS = {
  CRITICAL: "critical",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  DEBUG: "debug"
};
const numberFormat = new Intl.NumberFormat();

export function HistoryPage({ history, error, search, onOpenAnalysis }) {
  const rows = history.filter((item) => `${item.filename} ${item.created_at}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="ARCHIVE" title="Analysis history" description="Browse saved log files and reopen their original AI findings." />
      <section className="surface-card table-card">
        <div className="table-card-heading"><div><h2>Saved analyses</h2><p>{history.length} records returned by the analysis history API</p></div><span className="table-search-indicator"><Search size={14} /> Search from header</span></div>
        {error && <InlineNotice>{error}</InlineNotice>}
        {!rows.length ? <EmptyState icon={FileClock} title={search ? "No matching analyses" : "No saved analyses"} detail={search ? "Try a different search term." : "Completed uploads will be stored here by the backend."} /> : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead><tr><th>FILE NAME</th><th>ANALYZED</th><th>LOG LINES</th><th>ISSUES</th><th>CRITICAL</th><th>STATUS</th><th /></tr></thead>
              <tbody>{rows.map((item) => {
                const issueCount = (item.critical_count || 0) + (item.error_count || 0) + (item.warning_count || 0);
                return (
                  <tr key={item.id}>
                    <td><span className="table-file"><span className="table-file-icon"><FileText size={16} /></span><strong>{item.filename}</strong></span></td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{numberFormat.format(item.total_lines || 0)}</td>
                    <td>{numberFormat.format(issueCount)}</td>
                    <td><span className={item.critical_count ? "critical-count" : ""}>{numberFormat.format(item.critical_count || 0)}</span></td>
                    <td><span className="saved-status"><i /> Saved</span></td>
                    <td><button className="table-action" onClick={() => onOpenAnalysis(item)}>View details <ChevronRight size={14} /></button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function IssuesPage({ analysis, search }) {
  const [severity, setSeverity] = useState("ALL");
  const issues = analysis?.issues || [];
  const filtered = issues.filter((issue) => {
    const text = `${issue.title} ${issue.category} ${issue.evidence} ${issue.root_cause}`.toLowerCase();
    return (severity === "ALL" || issue.severity === severity) && text.includes(search.toLowerCase());
  });
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="INVESTIGATION" title="Issue explorer" description={analysis ? `Explore AI findings from ${analysis.filename}.` : "Review the evidence, probable causes and recommendations returned from an analysis."} />
      {!analysis ? <EmptyPanel icon={AlertOctagon} title="No analysis selected" detail="Upload a log file or open an item from Analysis History to inspect findings." /> : (
        <section className="surface-card table-card">
          <div className="filter-toolbar">
            <div className="filter-buttons">{["ALL", "CRITICAL", "ERROR", "WARNING"].map((item) => <button key={item} className={severity === item ? "filter-active" : ""} onClick={() => setSeverity(item)}>{item === "ALL" ? "All issues" : item}</button>)}</div>
            <span className="filter-search"><Search size={14} /> Filtered by header search</span>
          </div>
          {filtered.length ? <div className="issue-detail-list">{filtered.map((issue, index) => <IssueDetail key={`${issue.line_number}-${index}`} issue={issue} />)}</div> : <EmptyState icon={ShieldCheck} title={issues.length ? "No matching findings" : "No issues identified"} detail={issues.length ? "Adjust the severity filter or search query." : "No AI issues were returned for this analysis."} />}
        </section>
      )}
    </div>
  );
}

export function AlertsPage({ alerts, analysis, search, enabled }) {
  const [severity, setSeverity] = useState("ALL");
  const filtered = alerts.filter((alert) => {
    const text = `${alert.title} ${alert.category} ${alert.root_cause} ${alert.evidence}`.toLowerCase();
    return (severity === "ALL" || alert.severity === severity) && text.includes(search.toLowerCase());
  });
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="OPERATIONS" title="Alerts & notifications" description="Severity signals produced by the selected analysis. This is not a live alert stream." />
      <section className="surface-card table-card">
        <div className="alerts-summary">
          <span className="alerts-summary-icon"><Bell size={18} /></span>
          <div><strong>{alerts.length} analysis {alerts.length === 1 ? "finding" : "findings"}</strong><p>{analysis ? `From ${analysis.filename}${analysis.created_at ? ` · ${formatDate(analysis.created_at)}` : ""}` : "No analysis is currently selected."}</p></div>
          <span className={`status-pill status-${enabled ? "good" : "neutral"}`}>{enabled ? "Notifications enabled locally" : "Notifications muted locally"}</span>
        </div>
        <div className="filter-toolbar">
          <div className="filter-buttons">{["ALL", "CRITICAL", "ERROR", "WARNING", "INFO"].map((item) => <button key={item} className={severity === item ? "filter-active" : ""} onClick={() => setSeverity(item)}>{item === "ALL" ? "All severities" : item}</button>)}</div>
          <span className="filter-search"><SlidersHorizontal size={14} /> Search from header</span>
        </div>
        {filtered.length ? <div className="alert-list">{filtered.map((alert, index) => (
          <article className="alert-row" key={`${alert.title}-${index}`}>
            <span className={`alert-level-icon severity-bg-${severityClass(alert.severity)}`}><AlertTriangle size={17} /></span>
            <div className="alert-copy"><div><strong>{alert.title || "Analysis finding"}</strong><span className={`severity-label severity-text-${severityClass(alert.severity)}`}>{alert.severity || "SIGNAL"}</span></div><p>{alert.root_cause || alert.evidence || alert.message || "No additional detail returned."}</p><small>{analysis?.filename || "Analysis source"}{alert.line_number ? ` · line ${alert.line_number}` : ""}</small></div>
            <span className="analysis-signal-tag">Analysis signal</span>
          </article>
        ))}</div> : <EmptyState icon={Bell} title="No matching signals" detail={analysis ? "No findings match the selected severity and search." : "Upload a log or open a saved analysis to see its findings."} />}
        <div className="table-footnote"><CircleHelp size={13} /> Alert read state and delivery are not supported by the current backend API.</div>
      </section>
    </div>
  );
}

export function ServiceMapPage({ analysis, search = "" }) {
  const services = (analysis?.service_map || []).filter((item) => item.service.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="TOPOLOGY" title="Service map" description="Service names detected in error messages from the selected log analysis." />
      {!services.length ? <EmptyPanel icon={Share2} title={search && analysis?.service_map?.length ? "No matching services" : "No service signals available"} detail={search && analysis?.service_map?.length ? "Try a different search term." : analysis ? "No service= or svc= identifiers were detected. Relationships and live service health are not provided by the current API." : "Select an analysis containing service identifiers to populate this view."} /> : (
        <>
          <div className="map-disclaimer"><CircleHelp size={15} /><span><strong>Observed services, not topology.</strong> The backend returns service names with error counts, but does not provide dependency relationships or live health status. No connections are inferred here.</span></div>
          <section className="surface-card map-card">
            <div className="section-heading"><div><h2>Detected service signals</h2><p>Extracted from {analysis.filename}</p></div><span className="source-tag">Analysis data</span></div>
            <div className="service-node-grid">{services.map((service) => (
              <article className="service-node" key={service.service}>
                <span className="node-mark"><Server size={18} /></span>
                <div><strong>{service.service}</strong><small>Named in error log entries</small></div>
                <span className="node-error-count">{service.error_count} errors</span>
              </article>
            ))}</div>
            <div className="map-source"><Terminal size={14} /> Source: service= or svc= identifiers in parsed error messages</div>
          </section>
        </>
      )}
    </div>
  );
}

export function MonitoringPage({ monitor, monitorError, apiHealth, history, onRefresh }) {
  const status = monitorError ? "Unavailable" : monitor?.status === "healthy" ? "No errors in latest analysis" : monitor?.status === "alert" ? "Analysis reports errors" : monitor?.status === "waiting" ? "Waiting for first upload" : "Checking";
  const statusTone = monitorError ? "neutral" : monitor?.status === "healthy" ? "good" : monitor?.status === "alert" ? "bad" : "neutral";
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="OBSERVABILITY" title="Monitoring" description="Review the backend’s latest-upload monitoring status and available API health signal." action={<button className="button-secondary" onClick={onRefresh}><RefreshCw size={15} /> Refresh status</button>} />
      <div className="monitoring-grid">
        <section className="surface-card monitor-status-card"><span className="monitor-icon"><Activity size={20} /></span><span className="eyebrow">LATEST UPLOAD STATUS</span><h2>{status}</h2><p>{monitorError || monitor?.mode || monitor?.message || "Monitoring status has not been returned by the backend."}</p>{monitor?.filename && <div className="monitor-latest-file"><FileText size={15} />{monitor.filename}</div>}<span className={`status-pill status-${statusTone}`}><i />{status}</span></section>
        <section className="surface-card monitor-metrics">
          <div className="section-heading"><div><h2>Available signals</h2><p>Only checks exposed by the current backend</p></div></div>
          <SignalRow icon={Server} name="FastAPI health endpoint" value={apiHealth === "healthy" ? "Reachable" : apiHealth === "unavailable" ? "Unavailable" : "Checking"} tone={apiHealth === "healthy" ? "good" : apiHealth === "unavailable" ? "bad" : "neutral"} />
          <SignalRow icon={AlertOctagon} name="Critical entries" value={monitor?.critical ?? "Not returned"} tone={Number(monitor?.critical) ? "bad" : "neutral"} />
          <SignalRow icon={AlertTriangle} name="Error entries" value={monitor?.errors ?? "Not returned"} tone={Number(monitor?.errors) ? "warn" : "neutral"} />
          <SignalRow icon={Clock3} name="Last checked" value={monitor?.checked_at ? formatDate(monitor.checked_at) : "Not returned"} />
        </section>
      </div>
      <section className="surface-card monitoring-note"><span className="monitor-note-icon"><CircleHelp size={17} /></span><div><h3>Monitoring scope</h3><p>The current endpoint polls the latest saved upload; it does not tail live log files or provide host metrics. The history endpoint returned {history.length} recent record{history.length === 1 ? "" : "s"}.</p></div></section>
      <EmptyPanel icon={Activity} title="No live activity stream" detail="Live ingestion, CPU/memory monitoring, service probes, and alert delivery are not implemented by the current backend." />
    </div>
  );
}

export function ReportsPage({ analysis, history, onDownload, onOpenAnalysis }) {
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="REPORTING" title="Reports" description="Review saved analysis summaries and export a PDF using the backend report endpoint." />
      <section className="surface-card report-feature">
        <div className="report-feature-icon"><FileText size={22} /></div>
        <div className="report-feature-copy"><span className="eyebrow">PDF EXPORT</span><h2>{analysis?.filename || "No analysis selected"}</h2><p>{analysis ? `${analysis.total_lines ?? "—"} log lines · ${(analysis.issues || []).length} AI findings` : "Open a saved analysis from History to enable its report."}</p></div>
        <button className="button-primary" disabled={!analysis?.analysis_id} onClick={onDownload}><ArrowDownToLine size={16} /> Download PDF</button>
      </section>
      <section className="surface-card table-card">
        <div className="table-card-heading"><div><h2>Available analyses</h2><p>Choose an analysis to prepare its report.</p></div></div>
        {history.length ? <div className="report-list">{history.slice(0, 10).map((item) => (
          <button className="report-row" key={item.id} onClick={() => onOpenAnalysis(item)}><span className="recent-file-icon"><FileText size={17} /></span><span className="recent-file"><strong>{item.filename}</strong><small>{formatDate(item.created_at)}</small></span><span className="recent-issues">{(item.critical_count || 0) + (item.error_count || 0) + (item.warning_count || 0)}<small>issues</small></span><ChevronRight size={16} /></button>
        ))}</div> : <EmptyState icon={FileText} title="No report data available" detail="Run an analysis to generate a downloadable report." />}
      </section>
      <div className="table-footnote"><CircleHelp size={13} /> PDF generation is provided by the backend. If it is unavailable, the endpoint returns a clear error.</div>
    </div>
  );
}

export function SettingsPage({ userName, setUserName, notificationsEnabled, setNotificationsEnabled, compactMode, setCompactMode }) {
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="PREFERENCES" title="Settings" description="Personalize this browser’s workspace preferences." />
      <section className="surface-card settings-card">
        <div className="settings-section-heading"><span className="settings-icon"><Settings2 size={17} /></span><div><h2>Workspace profile</h2><p>These preferences are saved only in this browser.</p></div></div>
        <label className="settings-field"><span>Display name</span><input value={userName} maxLength={50} onChange={(event) => setUserName(event.target.value)} placeholder="Workspace User" /><small>Used in the header profile. No profile endpoint is configured.</small></label>
      </section>
      <section className="surface-card settings-card">
        <div className="settings-section-heading"><span className="settings-icon"><Bell size={17} /></span><div><h2>Notifications</h2><p>Control the in-app analysis signals shown in this workspace.</p></div></div>
        <PreferenceToggle title="Show analysis signals" detail="Display findings from the latest saved analysis in the notification menu." checked={notificationsEnabled} onChange={setNotificationsEnabled} />
      </section>
      <section className="surface-card settings-card">
        <div className="settings-section-heading"><span className="settings-icon"><SlidersHorizontal size={17} /></span><div><h2>Interface</h2><p>Adjust density for the dashboard layout.</p></div></div>
        <PreferenceToggle title="Compact cards" detail="Reduce spacing in dashboard panels on this device." checked={compactMode} onChange={setCompactMode} />
        <div className="settings-static-row"><div><strong>Color theme</strong><small>Dark enterprise theme</small></div><span className="theme-chip"><span /> Dark</span></div>
      </section>
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="workspace-stack">
      <PageIntro eyebrow="SUPPORT" title="Help & documentation" description="Understand what this workspace can do and where its data comes from." />
      <div className="help-grid">
        <HelpCard icon={Terminal} title="Analyze a log" detail="Upload UTF-8 LOG, TXT, JSON or CSV files up to 5 MB. Files are sent to the configured FastAPI service for parsing and AI-assisted diagnosis." />
        <HelpCard icon={FileClock} title="Analysis history" detail="Saved analyses are fetched from /api/history. Open a row to load its complete stored analysis and findings." />
        <HelpCard icon={Sparkles} title="AI investigation" detail="Ask questions about a selected analysis through the backend chat endpoint. Answers are limited to the stored analysis context." />
        <HelpCard icon={ShieldCheck} title="Data and privacy" detail="Log parsing redacts common credential patterns and email addresses before AI analysis. Avoid uploading data you are not permitted to share." />
      </div>
      <section className="surface-card api-doc-card"><div className="settings-icon"><CircleHelp size={17} /></div><div><h2>Backend API documentation</h2><p>Open the FastAPI OpenAPI interface when the local backend is running.</p></div><a className="button-secondary" href={`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/docs`} target="_blank" rel="noreferrer">Open API docs <ChevronRight size={14} /></a></section>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function IssueDetail({ issue }) {
  const tone = severityClass(issue.severity);
  return (
    <article className="issue-detail">
      <div className="issue-detail-heading"><span className={`severity-dot severity-${tone}`} /><div><h3>{issue.title || "Detected issue"}</h3><p>{issue.category || "Uncategorized"}{issue.line_number ? ` · line ${issue.line_number}` : ""}</p></div><span className={`severity-label severity-text-${tone}`}>{issue.severity || "SIGNAL"}</span></div>
      {issue.evidence && <DetailBlock title="Evidence" value={issue.evidence} />}
      {issue.root_cause && <DetailBlock title="Probable root cause" value={issue.root_cause} />}
      {issue.solution && <DetailBlock title="Suggested resolution" value={issue.solution} />}
      {issue.steps?.length > 0 && <ol className="issue-steps">{issue.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
      {issue.confidence && <span className="confidence-tag">AI confidence: {issue.confidence}</span>}
    </article>
  );
}

function DetailBlock({ title, value }) {
  return <div className="issue-detail-block"><h4>{title}</h4><p>{value}</p></div>;
}

function SignalRow({ icon: Icon, name, value, tone = "neutral" }) {
  return <div className="signal-row"><span className="signal-icon"><Icon size={15} /></span><span>{name}</span><strong className={`signal-value signal-${tone}`}>{value}</strong></div>;
}

function PreferenceToggle({ title, detail, checked, onChange }) {
  return <div className="preference-row"><div><strong>{title}</strong><small>{detail}</small></div><button className={`toggle${checked ? " toggle-on" : ""}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked} aria-label={title}><span /></button></div>;
}

function HelpCard({ icon: Icon, title, detail }) {
  return <article className="surface-card help-card"><span className="settings-icon"><Icon size={17} /></span><h2>{title}</h2><p>{detail}</p></article>;
}

function InlineNotice({ children }) {
  return <div className="inline-notice"><AlertTriangle size={15} />{children}</div>;
}

function EmptyState({ icon: Icon, title, detail }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={18} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function EmptyPanel({ icon: Icon, title, detail }) {
  return <section className="surface-card empty-panel"><span className="empty-icon"><Icon size={21} /></span><h2>{title}</h2><p>{detail}</p></section>;
}

function severityClass(value) {
  return LEVEL_COLORS[String(value || "").toUpperCase()] || "error";
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Date unavailable";
}
