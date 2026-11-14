import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  AlertTriangle, Bell, X
} from "lucide-react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { NAV_ITEMS } from "./components/navigation.js";
import {
  AlertsPage, HelpPage, HistoryPage, IssuesPage, MonitoringPage,
  ReportsPage, ServiceMapPage, SettingsPage
} from "./components/WorkspacePages.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import "./App.css";

const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const AdvancedFeatures = lazy(() => import("./AdvancedFeatures.jsx"));
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const ALLOWED_EXTENSIONS = [".log", ".txt", ".json", ".csv"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_PAGE = "Dashboard";

function App() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [apiHealth, setApiHealth] = useState("checking");
  const [monitor, setMonitor] = useState(null);
  const [monitorError, setMonitorError] = useState("");
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("7d");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem("logdetect-user-name") || "Workspace User");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("logdetect-notifications") !== "false");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("logdetect-compact") === "true");
  const fileRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/history`);
      const items = data.history || [];
      setHistory(items);
      setHistoryError("");
      return items;
    } catch (error) {
      setHistoryError(error.response?.data?.detail || "Analysis history is unavailable. Check the backend connection.");
      return null;
    }
  }, []);

  const loadMonitor = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/monitor/status`);
      setMonitor(data);
      setMonitorError("");
    } catch (error) {
      setMonitorError(error.response?.data?.detail || "Monitoring status is unavailable.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      const [healthResult, historyResult, monitorResult] = await Promise.allSettled([
        axios.get(`${API}/health`),
        axios.get(`${API}/api/history`),
        axios.get(`${API}/api/monitor/status`)
      ]);
      if (!active) return;
      setApiHealth(healthResult.status === "fulfilled" ? "healthy" : "unavailable");
      if (historyResult.status === "fulfilled") {
        const items = historyResult.value.data.history || [];
        setHistory(items);
        setHistoryError("");
        if (items[0]) {
          try {
            const detail = await axios.get(`${API}/api/history/${items[0].id}`);
            if (active) setAnalysis(detail.data);
          } catch {
            if (active) setHistoryError("The latest analysis details could not be loaded.");
          }
        }
      } else {
        setHistoryError("Analysis history is unavailable. Check the backend connection.");
      }
      if (monitorResult.status === "fulfilled") {
        setMonitor(monitorResult.value.data);
        setMonitorError("");
      } else {
        setMonitorError("Monitoring status is unavailable.");
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem("logdetect-user-name", userName);
    localStorage.setItem("logdetect-notifications", String(notificationsEnabled));
    localStorage.setItem("logdetect-compact", String(compactMode));
  }, [userName, notificationsEnabled, compactMode]);

  function chooseFile(file) {
    if (!file) return;
    const extension = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setNotice({ type: "error", message: "Unsupported file type. Choose LOG, TXT, JSON or CSV." });
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setNotice({ type: "error", message: "File size exceeds the 5 MB upload limit." });
      setSelectedFile(null);
      return;
    }
    setNotice(null);
    setSelectedFile(file);
  }

  async function analyzeFile() {
    if (!selectedFile) {
      setNotice({ type: "error", message: "Select a log file before starting analysis." });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setNotice(null);
    const body = new FormData();
    body.append("file", selectedFile);
    try {
      const { data } = await axios.post(`${API}/api/analyze`, body, {
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      setAnalysis(data);
      setSelectedFile(null);
      setUploadProgress(100);
      setNotice({ type: "success", message: `${data.filename} was analyzed and saved to history.` });
      const items = await loadHistory();
      if (items) {
        setAnalysis((current) => current ? { ...current, created_at: items[0]?.created_at || current.created_at } : current);
        await loadMonitor();
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.detail || "Analysis failed. Make sure the FastAPI backend is running."
      });
    } finally {
      setUploading(false);
    }
  }

  async function openAnalysis(item) {
    setNotice(null);
    try {
      const { data } = await axios.get(`${API}/api/history/${item.id}`);
      setAnalysis(data);
      navigate("AI Investigation");
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.detail || "Could not load this historical analysis." });
    }
  }

  async function downloadReport() {
    if (!analysis?.analysis_id) return;
    try {
      const response = await axios.get(`${API}/api/report/${analysis.analysis_id}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `LogDetect_Report_${analysis.analysis_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice({ type: "success", message: "The PDF report was downloaded." });
    } catch (error) {
      let detail = error.response?.data?.detail;
      if (error.response?.data instanceof Blob) {
        const responseText = await error.response.data.text();
        try {
          detail = JSON.parse(responseText).detail || responseText;
        } catch {
          detail = responseText;
        }
      }
      setNotice({
        type: "error",
        message: detail || "PDF report could not be generated. Confirm reportlab is installed in the backend."
      });
    }
  }

  const alerts = useMemo(() => {
    if (!analysis) return [];
    const issues = analysis.issues || [];
    if (issues.length) return issues;
    return (analysis.alerts || []).map((alert) => ({
      ...alert,
      severity: alert.severity === "critical" ? "CRITICAL" : "ERROR",
      title: alert.title,
      root_cause: alert.message
    }));
  }, [analysis]);

  const pageTitle = NAV_ITEMS.find((item) => item.name === page)?.name || page;

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileNavOpen(false);
    setNotice(null);
  }

  return (
    <div className={`app-shell${compactMode ? " compact-mode" : ""}`}>
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <Sidebar activePage={page} onNavigate={navigate} open={mobileNavOpen} issueCount={analysis?.issues?.length || 0} />
      <main className="main-content">
        <Header
          page={pageTitle}
          search={search}
          onSearch={setSearch}
          range={range}
          onRangeChange={setRange}
          onMenuClick={() => setMobileNavOpen((open) => !open)}
          notifications={notificationsEnabled ? alerts.slice(0, 3) : []}
          onOpenNotifications={() => navigate("Alerts & Notifications")}
          userName={userName}
        />
        <div className="page-content">
          {notice && (
            <div className={`notice notice-${notice.type}`} role="status">
              {notice.type === "error" ? <AlertTriangle size={17} /> : <Bell size={17} />}
              <span>{notice.message}</span>
              <button onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={16} /></button>
            </div>
          )}

          <Suspense fallback={<div className="workspace-loading">Loading workspace…</div>}>
            {page === "Dashboard" && (
              <Dashboard
                analysis={analysis}
                history={history}
                search={search}
                historyError={historyError}
                range={range}
                apiHealth={apiHealth}
                monitor={monitor}
                monitorError={monitorError}
                onNavigate={navigate}
                selectedFile={selectedFile}
                chooseFile={chooseFile}
                fileRef={fileRef}
                dragging={dragging}
                setDragging={setDragging}
                uploading={uploading}
                uploadProgress={uploadProgress}
                analyzeFile={analyzeFile}
                onOpenAnalysis={openAnalysis}
                onClearFile={() => setSelectedFile(null)}
              />
            )}
            {page === "Log Analysis" && (
              <div className="workspace-stack">
                <PageIntro eyebrow="LOG ANALYSIS" title="Turn log files into clear next steps" description="Upload an application or system log to extract severity statistics, AI diagnosis, patterns and recommendations." />
                <UploadPanel
                  selectedFile={selectedFile}
                  chooseFile={chooseFile}
                  fileRef={fileRef}
                  dragging={dragging}
                  setDragging={setDragging}
                  uploading={uploading}
                  progress={uploadProgress}
                  onAnalyze={analyzeFile}
                  onClear={() => setSelectedFile(null)}
                />
                {analysis && <AnalysisSummary analysis={analysis} />}
              </div>
            )}
            {page === "AI Investigation" && <AdvancedFeatures analysis={analysis} history={history} onOpenAnalysis={openAnalysis} />}
            {page === "Issue Explorer" && <IssuesPage analysis={analysis} search={search} />}
            {page === "Analysis History" && (
              <HistoryPage history={history} error={historyError} search={search} onOpenAnalysis={openAnalysis} />
            )}
            {page === "Alerts & Notifications" && (
              <AlertsPage alerts={alerts} analysis={analysis} search={search} enabled={notificationsEnabled} />
            )}
            {page === "Service Map" && <ServiceMapPage analysis={analysis} search={search} />}
            {page === "Monitoring" && (
              <MonitoringPage monitor={monitor} monitorError={monitorError} apiHealth={apiHealth} history={history} onRefresh={loadMonitor} />
            )}
            {page === "Reports" && <ReportsPage analysis={analysis} history={history} onDownload={downloadReport} onOpenAnalysis={openAnalysis} />}
            {page === "Settings" && (
              <SettingsPage
                userName={userName}
                setUserName={setUserName}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                compactMode={compactMode}
                setCompactMode={setCompactMode}
              />
            )}
            {page === "Help & Docs" && <HelpPage />}
          </Suspense>
          <footer className="app-footer">
            <span>LogDetect AI · Log Analytics &amp; Observability</span>
            <span>FastAPI · React · Analysis data from your workspace</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function AnalysisSummary({ analysis }) {
  const summary = analysis.summary || {};
  const issues = analysis.issues || [];
  return (
    <section className="surface-card analysis-summary">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LATEST RESULT</span>
          <h2>{analysis.filename || "Log analysis"}</h2>
        </div>
        <span className="status-pill status-good">Analysis saved</span>
      </div>
      <p className="analysis-message">{analysis.message || "Analysis completed."}</p>
      <div className="summary-counts">
        {["critical", "errors", "warnings", "info", "debug"].map((key) => (
          <div key={key}><strong>{summary[key] ?? 0}</strong><span>{key}</span></div>
        ))}
      </div>
      {issues.length > 0 && (
        <div className="result-issues">
          <h3>AI findings</h3>
          {issues.slice(0, 4).map((issue, index) => (
            <div className="result-issue" key={`${issue.line_number}-${index}`}>
              <span className={`severity-dot severity-${(issue.severity || "error").toLowerCase()}`} />
              <div><strong>{issue.title}</strong><p>{issue.root_cause || issue.evidence}</p></div>
              <span>{issue.severity}</span>
            </div>
          ))}
        </div>
      )}
      {(analysis.recommendations || []).length > 0 && (
        <div className="recommendations">
          <h3>Suggested resolutions</h3>
          <ul>{analysis.recommendations.slice(0, 5).map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

export default App;
