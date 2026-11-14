import {
  Activity, AlertOctagon, AlertTriangle, ArrowDownRight, ArrowUpRight,
  Check, ChevronRight, CircleHelp, Clock3, FileClock, FileText,
  Layers3, Server, ShieldAlert, Sparkles, Upload
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Line, Pie,
  PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import UploadPanel from "./UploadPanel.jsx";

const LEVELS = [
  { key: "info", name: "INFO", color: "#21d4fd" },
  { key: "debug", name: "DEBUG", color: "#8b5cf6" },
  { key: "warnings", name: "WARNING", color: "#f5b942" },
  { key: "errors", name: "ERROR", color: "#fb7185" },
  { key: "critical", name: "CRITICAL", color: "#f04468" }
];

const NUMBER_FORMAT = new Intl.NumberFormat();

export default function Dashboard({
  analysis, history, historyError, search, range, apiHealth,
  monitor, monitorError, onNavigate, selectedFile, chooseFile, fileRef,
  dragging, setDragging, uploading, uploadProgress, analyzeFile,
  onOpenAnalysis, onClearFile
}) {
  const latest = history[0] || null;
  const latestCounts = {
    total: latest?.total_lines ?? analysis?.total_lines ?? null,
    errors: analysis?.summary?.errors ?? latest?.error_count ?? null,
    warnings: analysis?.summary?.warnings ?? latest?.warning_count ?? null,
    critical: analysis?.summary?.critical ?? latest?.critical_count ?? null
  };
  const previous = history[1] || null;
  const stats = [
    { title: "Total log lines", key: "total", icon: Layers3, tone: "blue", current: latestCounts.total, previous: previous?.total_lines, seriesKey: "total_lines" },
    { title: "Errors", key: "errors", icon: AlertTriangle, tone: "rose", current: latestCounts.errors, previous: previous?.error_count, seriesKey: "error_count" },
    { title: "Warnings", key: "warnings", icon: ShieldAlert, tone: "amber", current: latestCounts.warnings, previous: previous?.warning_count, seriesKey: "warning_count" },
    { title: "Critical incidents", key: "critical", icon: AlertOctagon, tone: "red", current: latestCounts.critical, previous: previous?.critical_count, seriesKey: "critical_count" }
  ];
  const filteredHistory = history.filter((item) => inRange(item.created_at, range)).slice().reverse();
  const trendData = filteredHistory.map((item) => ({
    label: formatShortDate(item.created_at),
    total: item.total_lines || 0,
    errors: item.error_count || 0,
    warnings: item.warning_count || 0
  }));
  const distribution = LEVELS.map((level) => ({
    ...level,
    value: analysis?.summary?.[level.key] ?? 0
  }));
  const hasDistribution = Boolean(analysis?.summary) && distribution.some((item) => item.value > 0);

  return (
    <div className="dashboard-stack">
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-pulse" /> COMMAND CENTER</div>
          <h1>Welcome back! <span className="welcome-wave">👋</span></h1>
          <p>Here's what's happening with your systems today.</p>
        </div>
        <button className="button-primary" onClick={() => onNavigate("Log Analysis")}><Upload size={16} /> Analyze logs</button>
      </section>

      <section className="stats-grid" aria-label="Latest analysis metrics">
        {stats.map(({ key, ...item }) => (
          <StatCard key={key} {...item} values={history.slice(0, 7).map((entry) => entry[item.seriesKey] || 0).reverse()} />
        ))}
      </section>

      <div className="dashboard-grid dashboard-grid-charts">
        <section className="surface-card chart-card trend-card">
          <div className="section-heading">
            <div><h2>Log trends</h2><p>Activity across saved analyses in the selected period</p></div>
            <div className="chart-legend"><span><i className="legend-line legend-blue" /> Total lines</span><span><i className="legend-line legend-pink" /> Errors</span></div>
          </div>
          {trendData.length ? (
            <div className="chart-wrap chart-wrap-trend">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#268bff" stopOpacity={0.25} /><stop offset="95%" stopColor="#268bff" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="#202d43" strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#8290a6", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={{ fill: "#8290a6", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total" name="Total lines" stroke="#268bff" strokeWidth={2.2} fill="url(#totalFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="errors" name="Errors" stroke="#f4729b" strokeWidth={2} dot={{ r: 2.5, fill: "#f4729b", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon={Activity} title="No activity in this period" detail={historyError || "Saved analyses will appear here. This chart uses history returned by your backend."} />}
          <div className="chart-source-note"><FileClock size={13} /> {filteredHistory.length} saved {filteredHistory.length === 1 ? "analysis" : "analyses"} in this range</div>
        </section>

        <section className="surface-card chart-card distribution-card">
          <div className="section-heading">
            <div><h2>Log level distribution</h2><p>Most recent analysis · {analysis?.filename || "no analysis selected"}</p></div>
            <button className="subtle-icon-button" onClick={() => onNavigate("AI Investigation")} aria-label="Open analysis details"><ChevronRight size={17} /></button>
          </div>
          {hasDistribution ? (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution.filter((item) => item.value > 0)} dataKey="value" nameKey="name" innerRadius={68} outerRadius={91} paddingAngle={3} stroke="none" animationDuration={650}>
                      {distribution.filter((item) => item.value > 0).map((item) => <Cell key={item.key} fill={item.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center"><strong>{NUMBER_FORMAT.format(Object.values(analysis.summary).reduce((sum, value) => sum + (Number(value) || 0), 0))}</strong><span>entries</span></div>
              </div>
              <div className="distribution-legend">
                {distribution.map((item) => {
                  const total = distribution.reduce((sum, row) => sum + row.value, 0);
                  return <div key={item.key}><i style={{ backgroundColor: item.color }} /><span>{item.name}</span><strong>{NUMBER_FORMAT.format(item.value)}</strong><small>{total ? `${Math.round((item.value / total) * 100)}%` : "—"}</small></div>;
                })}
              </div>
            </>
          ) : <EmptyState icon={Layers3} title="Level breakdown unavailable" detail="Upload a log to see parser counts. No levels are inferred from history alone." />}
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid-health">
        <SystemHealth apiHealth={apiHealth} monitor={monitor} monitorError={monitorError} analysis={analysis} />
        <IncidentTimeline analysis={analysis} onOpen={() => onNavigate("AI Investigation")} />
      </div>

      <div className="dashboard-grid dashboard-grid-bottom">
        <ServiceOverview analysis={analysis} onNavigate={() => onNavigate("Service Map")} />
        <RecentAnalyses history={history} error={historyError} search={search} onViewAll={() => onNavigate("Analysis History")} onOpenAnalysis={onOpenAnalysis} />
      </div>

      <section className="ai-upload-banner">
        <div className="ai-banner-orb ai-banner-orb-one" /><div className="ai-banner-orb ai-banner-orb-two" />
        <div className="ai-banner-copy">
          <div className="ai-banner-label"><Sparkles size={14} /> AI-POWERED LOG ANALYSIS</div>
          <h2>Analyze logs with AI</h2>
          <p>Upload your log files and get instant root-cause analysis, anomalies, timelines, and actionable fixes.</p>
        </div>
        <div className="ai-banner-upload">
          <UploadPanel
            compact
            selectedFile={selectedFile}
            chooseFile={chooseFile}
            fileRef={fileRef}
            dragging={dragging}
            setDragging={setDragging}
            uploading={uploading}
            progress={uploadProgress}
            onAnalyze={analyzeFile}
            onClear={onClearFile}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, icon: Icon, tone, current, previous, values }) {
  const comparison = getComparison(current, previous);
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top"><span>{title}</span><div className="stat-icon"><Icon size={17} /></div></div>
      <div className="stat-value">{current == null ? "—" : NUMBER_FORMAT.format(current)}</div>
      <div className="stat-bottom"><span className={`stat-comparison${comparison.direction ? ` comparison-${comparison.direction}` : ""}`}>
        {comparison.direction === "up" ? <ArrowUpRight size={14} /> : comparison.direction === "down" ? <ArrowDownRight size={14} /> : <Check size={13} />}
        {comparison.label}
      </span><span className="stat-context">{comparison.context}</span></div>
      <Sparkline values={values} />
    </article>
  );
}

function Sparkline({ values }) {
  const width = 112;
  const height = 34;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = values.length < 2 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - 3 - (value / max) * (height - 7);
    return `${x},${y}`;
  }).join(" ");
  return <svg className="stat-sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true"><polyline points={points} /></svg>;
}

function getComparison(current, previous) {
  if (current == null) return { label: "No data", context: "awaiting analysis" };
  if (previous == null) return { label: "First run", context: "no earlier analysis" };
  if (previous === 0) return current === 0
    ? { label: "0%", context: "vs previous analysis", direction: "flat" }
    : { label: "New", context: "vs previous analysis", direction: "up" };
  const change = ((current - previous) / previous) * 100;
  return {
    label: `${change > 0 ? "+" : ""}${Math.round(change)}%`,
    context: "vs previous analysis",
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat"
  };
}

function SystemHealth({ apiHealth, monitor, monitorError, analysis }) {
  const monitoringStatus = monitorError ? "Unavailable" : monitor?.status === "healthy" ? "No current errors" : monitor?.status === "alert" ? "Analysis alert" : monitor?.status === "waiting" ? "Awaiting logs" : "Unknown";
  const rows = [
    { name: "API service", description: apiHealth === "healthy" ? "FastAPI health endpoint responded" : apiHealth === "unavailable" ? "Health endpoint did not respond" : "Checking backend", status: apiHealth === "healthy" ? "Reachable" : apiHealth === "unavailable" ? "Unavailable" : "Checking", tone: apiHealth === "healthy" ? "good" : apiHealth === "unavailable" ? "bad" : "neutral", icon: Server },
    { name: "Log ingestion", description: apiHealth === "healthy" ? "Shares API host; no separate ingest check" : "Ingestion endpoint health is not independently checked", status: "Not checked", tone: "neutral", icon: Upload },
    { name: "Log monitoring", description: monitor?.mode || monitor?.message || monitorError || "Monitoring status has not been returned", status: monitoringStatus, tone: monitorError ? "neutral" : monitor?.status === "healthy" ? "good" : monitor?.status === "alert" ? "bad" : "neutral", icon: Activity },
    { name: "AI analysis", description: analysis?.analysis_id ? `Latest analysis saved · ${analysis.filename}` : "No successful analysis loaded yet", status: analysis?.analysis_id ? "Last run succeeded" : "Not verified", tone: analysis?.analysis_id ? "good" : "neutral", icon: Sparkles },
    { name: "Reporting", description: "PDF generation has no health-check endpoint", status: "Not checked", tone: "neutral", icon: FileText }
  ];
  return (
    <section className="surface-card health-card">
      <div className="section-heading"><div><h2>System health</h2><p>Based on available backend signals</p></div><span className="health-verified"><Check size={12} /> Backend signals</span></div>
      <div className="health-list">
        {rows.map(({ name, description, status, tone, icon: Icon }) => (
          <div className="health-row" key={name}>
            <div className="health-service-icon"><Icon size={16} /></div>
            <div className="health-row-copy"><strong>{name}</strong><small>{description}</small></div>
            <span className={`status-pill status-${tone}`}><i />{status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function IncidentTimeline({ analysis, onOpen }) {
  const events = (analysis?.timeline || []).map((point) => ({
    time: point.time,
    title: `${point.errors} error or critical entries recorded`,
    source: analysis.filename,
    severity: "SIGNAL",
    severityTone: "signal",
    severityLabel: "ERROR / CRITICAL",
    status: "Detected"
  })).slice(-5).reverse();
  const displayEvents = events.length ? events : (analysis?.issues || []).slice(0, 5).map((issue) => ({
    time: issue.line_number ? `Line ${issue.line_number}` : "Analysis finding",
    title: issue.title || "Issue detected",
    source: analysis.filename,
    severity: issue.severity || "ERROR",
    status: "AI finding"
  }));
  return (
    <section className="surface-card timeline-card">
      <div className="section-heading"><div><h2>Incident timeline</h2><p>Events extracted from the latest analysis</p></div><button className="text-link" onClick={onOpen}>Details <ChevronRight size={14} /></button></div>
      {displayEvents.length ? (
        <div className="incident-list">
          {displayEvents.map((event, index) => (
            <button className="incident-row" key={`${event.time}-${index}`} onClick={onOpen}>
              <span className={`incident-marker severity-${event.severityTone || event.severity.toLowerCase()}`} />
              <span className="incident-time">{event.time}</span>
              <span className="incident-copy"><strong>{event.title}</strong><small>{event.source} · {event.status}</small></span>
              <span className={`severity-label${event.severityTone === "signal" ? " incident-signal-label" : ` severity-text-${event.severity.toLowerCase()}`}`}>{event.severityLabel || event.severity}</span>
            </button>
          ))}
        </div>
      ) : <EmptyState icon={Clock3} title="No incidents to show" detail="Timeline entries are created from timestamps in the latest uploaded log." />}
      <div className="timeline-note"><CircleHelp size={13} /> No independent live incident feed is configured.</div>
    </section>
  );
}

function ServiceOverview({ analysis, onNavigate }) {
  const services = analysis?.service_map || [];
  return (
    <section className="surface-card service-overview">
      <div className="section-heading">
        <div><h2>Service signals</h2><p>Services inferred from error log messages</p></div>
        <button className="text-link" onClick={onNavigate}>View map <ChevronRight size={14} /></button>
      </div>
      {services.length ? (
        <div className="service-list">
          {services.slice(0, 5).map((service) => (
            <div className="service-row" key={service.service}>
              <span className="service-icon"><Server size={15} /></span>
              <span className="service-name">{service.service}<small>Detected in {analysis.filename}</small></span>
              <span className="service-signal-count">{service.error_count} error signals</span>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={Server} title="No service identifiers found" detail="Add service= or svc= identifiers to log messages to populate this view." />}
      <div className="service-data-note">These are observed error counts, not a live service health check.</div>
    </section>
  );
}

function RecentAnalyses({ history, error, search, onViewAll, onOpenAnalysis }) {
  const filtered = history.filter((item) => item.filename.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="surface-card recent-card">
      <div className="section-heading"><div><h2>Recent analyses</h2><p>Latest files processed by this workspace</p></div><button className="text-link" onClick={onViewAll}>View all <ChevronRight size={14} /></button></div>
      {filtered.length ? (
        <div className="recent-list">
          {filtered.slice(0, 4).map((item) => {
            const issueCount = (item.critical_count || 0) + (item.error_count || 0) + (item.warning_count || 0);
            return (
              <button className="recent-row" key={item.id} onClick={() => onOpenAnalysis(item)}>
                <span className="recent-file-icon"><FileText size={17} /></span>
                <span className="recent-file"><strong>{item.filename}</strong><small>{formatDate(item.created_at)}</small></span>
                <span className="recent-issues">{NUMBER_FORMAT.format(issueCount)}<small>issues</small></span>
                <span className="saved-status"><i /> Saved</span>
                <ChevronRight className="recent-chevron" size={15} />
              </button>
            );
          })}
        </div>
      ) : <EmptyState icon={FileText} title={error ? "History unavailable" : search ? "No matching analyses" : "No analyses yet"} detail={error || (search ? "Try a different search term." : "Your saved analyses will appear here after the first upload.")} />}
    </section>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip">{label && <strong>{label}</strong>}{payload.map((item) => <div key={item.name}><i style={{ backgroundColor: item.color }} />{item.name}: <b>{NUMBER_FORMAT.format(item.value)}</b></div>)}</div>;
}

function EmptyState({ icon: Icon, title, detail }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={18} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function inRange(dateValue, range) {
  if (range === "all") return true;
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const duration = range === "24h" ? 24 * 60 * 60 * 1000 : range === "30d" ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return timestamp >= Date.now() - duration;
}

function formatShortDate(dateValue) {
  const date = new Date(dateValue);
  return Number.isFinite(date.getTime())
    ? `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    : "Unknown";
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Date unavailable";
}
