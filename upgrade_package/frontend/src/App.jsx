import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Activity, AlertCircle, AlertTriangle, ArrowUpRight,
  BarChart3, Bell, CheckCircle2, ChevronRight, Clock3,
  CloudUpload, FileText, History, LayoutDashboard,
  LoaderCircle, Search, ShieldCheck, Sparkles,
  Terminal, Upload, X, Zap
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  CRITICAL: "#f43f5e",
  ERROR: "#f97316",
  WARNING: "#eab308",
  INFO: "#38bdf8",
  DEBUG: "#818cf8"
};

const initialStats = {
  critical: 0, errors: 0, warnings: 0, info: 0, debug: 0
};

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const stats = analysis?.summary || initialStats;
  const issues = analysis?.issues || [];

  const chartData = [
    { name: "Critical", value: stats.critical, color: COLORS.CRITICAL },
    { name: "Errors", value: stats.errors, color: COLORS.ERROR },
    { name: "Warnings", value: stats.warnings, color: COLORS.WARNING },
    { name: "Info", value: stats.info, color: COLORS.INFO },
    { name: "Debug", value: stats.debug, color: COLORS.DEBUG }
  ];

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesFilter =
        filter === "ALL" || issue.severity === filter;

      const text = [
        issue.title, issue.category, issue.evidence,
        issue.root_cause
      ].join(" ").toLowerCase();

      return matchesFilter && text.includes(search.toLowerCase());
    });
  }, [issues, filter, search]);

  async function loadHistory() {
    try {
      const response = await axios.get(`${API}/api/history`);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error("History could not be loaded:", err);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function chooseFile(file) {
    if (!file) return;

    const allowed = [".log", ".txt", ".json", ".csv"];
    const extension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowed.includes(extension)) {
      setError("Unsupported file type. Choose LOG, TXT, JSON or CSV.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds the 5 MB upload limit.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  async function analyzeFile() {
    if (!selectedFile) {
      setError("Please select a log file first.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${API}/api/analyze`,
        formData
      );

      setAnalysis(response.data);
      setSelectedFile(null);
      setActiveTab("Overview");
      await loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Analysis failed. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(item) {
    setError("");
    setActiveTab("Overview");
    setAnalysis(null);
    setError(
      "Historical summary selected. Full historical issue details are not yet exposed by the backend."
    );
  }

  const total = stats.critical + stats.errors +
    stats.warnings + stats.info + stats.debug;

  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Log Analysis", icon: Terminal },
    { name: "Issue Explorer", icon: AlertCircle },
    { name: "History", icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] border-r border-slate-800 bg-[#0b1220] lg:flex lg:flex-col">
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <Activity size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">LogDetect <span className="text-cyan-400">AI</span></h1>
            <p className="text-[10px] uppercase tracking-[2px] text-slate-500">Intelligent observability</p>
          </div>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">Workspace</p>
          <div className="space-y-1">
            {navItems.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  activeTab === name
                    ? "bg-cyan-400/10 font-semibold text-cyan-300"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {name}
                {name === "Issue Explorer" && issues.length > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-400">{issues.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-cyan-300">
              <Sparkles size={16} />
              <span className="text-xs font-semibold">AI Engine</span>
            </div>
            <p className="text-xs leading-5 text-slate-400">Powered by Groq AI for intelligent log diagnosis.</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Integration configured
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] text-slate-600">LOGDETECT AI · VERSION 1.0</p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-800 bg-[#080d18]/95 px-5 backdrop-blur-xl md:px-8">
          <div>
            <p className="text-xs text-slate-500">Workspace / <span className="text-slate-300">{activeTab}</span></p>
            <h2 className="mt-1 text-lg font-semibold">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AI Ready
            </div>
            <button className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:text-white">
              <Bell size={18} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-slate-950">LD</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button onClick={() => setError("")}><X size={17} /></button>
            </div>
          )}

          {activeTab === "History" ? (
            <section className="panel overflow-hidden">
              <div className="border-b border-slate-800 p-5">
                <h3 className="font-semibold">Analysis History</h3>
                <p className="mt-1 text-xs text-slate-500">Previously uploaded and analyzed files</p>
              </div>
              {history.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">No previous analyses found.</div>
              ) : history.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/70 p-5">
                  <div className="flex items-center gap-3">
                    <FileText className="text-cyan-400" size={20} />
                    <div>
                      <p className="text-sm font-medium">{item.filename}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.total_lines} lines · {new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-rose-400">{item.critical_count} critical</span>
                    <span className="text-orange-400">{item.error_count} errors</span>
                    <button onClick={() => openHistory(item)} className="text-cyan-400">View summary</button>
                  </div>
                </div>
              ))}
            </section>
          ) : activeTab === "Issue Explorer" ? (
            <IssueSection issues={filteredIssues} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
          ) : activeTab === "Log Analysis" ? (
            <UploadSection
              selectedFile={selectedFile}
              chooseFile={chooseFile}
              fileRef={fileRef}
              dragging={dragging}
              setDragging={setDragging}
              analyzeFile={analyzeFile}
              loading={loading}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">Monitor, analyze and resolve application log issues.</p>
                </div>
                <button onClick={() => setActiveTab("Log Analysis")} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300">
                  <Upload size={17} /> Analyze Logs
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard title="Total Log Entries" value={total.toLocaleString()} icon={FileText} color="cyan" note={analysis ? `${analysis.total_lines} original lines` : "Awaiting upload"} />
                <StatCard title="Critical Issues" value={stats.critical} icon={AlertCircle} color="rose" note="Immediate attention" />
                <StatCard title="Errors Detected" value={stats.errors} icon={AlertTriangle} color="orange" note="Requires investigation" />
                <StatCard title="Warnings" value={stats.warnings} icon={Activity} color="yellow" note="Potential issues" />
              </div>

              <UploadSection
                selectedFile={selectedFile}
                chooseFile={chooseFile}
                fileRef={fileRef}
                dragging={dragging}
                setDragging={setDragging}
                analyzeFile={analyzeFile}
                loading={loading}
                compact
              />

              <div className="grid gap-5 xl:grid-cols-5">
                <div className="panel p-5 xl:col-span-2">
                  <div className="mb-5">
                    <h3 className="font-semibold">Log Severity Distribution</h3>
                    <p className="mt-1 text-xs text-slate-500">Breakdown of detected log levels</p>
                  </div>
                  {total === 0 ? (
                    <EmptyChart />
                  ) : (
                    <>
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData.filter(d => d.value > 0)} dataKey="value" nameKey="name" innerRadius={65} outerRadius={88} paddingAngle={4} stroke="none">
                              {chartData.filter(d => d.value > 0).map(d => <Cell key={d.name} fill={d.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#101827", border: "1px solid #263449", borderRadius: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {chartData.map(d => (
                          <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                            {d.name}<span className="ml-auto font-semibold text-slate-200">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="panel p-5 xl:col-span-3">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Severity Overview</h3>
                      <p className="mt-1 text-xs text-slate-500">Log volume by severity level</p>
                    </div>
                    <BarChart3 className="text-slate-500" size={19} />
                  </div>
                  {total === 0 ? <EmptyChart /> : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#253247" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: "#8492a8", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#8492a8", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#101827", border: "1px solid #263449", borderRadius: 10 }} />
                          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                            {chartData.map(d => <Cell key={d.name} fill={d.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
                  <div>
                    <h3 className="font-semibold">AI Detected Issues</h3>
                    <p className="mt-1 text-xs text-slate-500">Root causes identified from your uploaded logs</p>
                  </div>
                  <button onClick={() => setActiveTab("Issue Explorer")} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300">View all <ChevronRight size={15} /></button>
                </div>
                {issues.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400"><ShieldCheck size={24} /></div>
                    <p className="text-sm font-medium">No analysis loaded yet</p>
                    <p className="mt-1 text-xs text-slate-500">Upload a log file to see AI-generated issues here.</p>
                  </div>
                ) : issues.slice(0, 5).map((issue, index) => (
                  <IssueRow key={index} issue={issue} />
                ))}
              </div>

              <div className="panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <History size={18} className="text-cyan-400" />
                  <h3 className="font-semibold">Recent Analyses</h3>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">Your uploaded log analysis history will appear here.</p>
                ) : history.slice(0, 4).map(item => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <FileText size={17} className="text-slate-500" />
                      <span>{item.filename}</span>
                    </div>
                    <span className="text-xs text-slate-500">{item.total_lines} lines</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-5 text-[11px] text-slate-600">
            <span>© 2026 LogDetect AI · Intelligent Log Analysis</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Powered by FastAPI + Groq AI</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, note }) {
  const styles = {
    cyan: "bg-cyan-400/10 text-cyan-300",
    rose: "bg-rose-400/10 text-rose-400",
    orange: "bg-orange-400/10 text-orange-400",
    yellow: "bg-yellow-400/10 text-yellow-300"
  };

  return (
    <div className="panel p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{title}</p>
        <div className={`rounded-lg p-2 ${styles[color]}`}><Icon size={18} /></div>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
      <p className="mt-2 text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

function UploadSection({ selectedFile, chooseFile, fileRef, dragging, setDragging, analyzeFile, loading, compact }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><CloudUpload size={19} className="text-cyan-400" /> Upload Log Files</h3>
          <p className="mt-1 text-xs text-slate-500">Upload application or system logs for AI-powered diagnosis.</p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-400">MAX 5 MB</span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className={`m-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition ${
          compact ? "min-h-[145px]" : "min-h-[250px]"
        } ${dragging ? "border-cyan-300 bg-cyan-400/10" : "border-slate-700 bg-[#0b1422] hover:border-cyan-400/60 hover:bg-cyan-400/[0.03]"}`}
      >
        <input ref={fileRef} type="file" accept=".log,.txt,.json,.csv" className="hidden" onChange={e => chooseFile(e.target.files?.[0])} />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Upload size={23} /></div>
        {selectedFile ? (
          <>
            <p className="text-sm font-semibold text-cyan-300">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB · Ready to analyze</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Drag and drop your log file here</p>
            <p className="mt-2 text-xs text-slate-500">or <span className="text-cyan-400">browse files</span> from your computer</p>
            <p className="mt-3 text-[10px] text-slate-600">LOG · TXT · JSON · CSV</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
        <p className="text-[11px] text-slate-500">Your log content is sent to the configured AI analysis service.</p>
        <button disabled={!selectedFile || loading} onClick={e => { e.stopPropagation(); analyzeFile(); }} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? <><LoaderCircle size={17} className="animate-spin" /> Analyzing...</> : <><Sparkles size={17} /> Analyze with AI</>}
        </button>
      </div>
    </section>
  );
}

function IssueRow({ issue }) {
  const color = COLORS[issue.severity] || COLORS.ERROR;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/70 px-5 py-4 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{issue.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{issue.root_cause}</p>
          <p className="mt-2 text-[10px] text-slate-600">Line {issue.line_number} · {issue.category}</p>
        </div>
      </div>
      <span className="rounded-md px-2.5 py-1 text-[10px] font-bold" style={{ background: `${color}18`, color }}>{issue.severity}</span>
    </div>
  );
}

function IssueSection({ issues, filter, setFilter, search, setSearch }) {
  const filters = ["ALL", "CRITICAL", "ERROR", "WARNING"];
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-800 p-5">
        <h3 className="font-semibold">Issue Explorer</h3>
        <p className="mt-1 text-xs text-slate-500">Explore AI-detected issues and probable root causes.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === f ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{f === "ALL" ? "All issues" : f}</button>
          ))}
          <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-[260px]">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="w-full rounded-lg border border-slate-700 bg-[#0b1422] py-2 pl-9 pr-3 text-xs outline-none focus:border-cyan-400" />
          </div>
        </div>
      </div>
      {issues.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Upload a log file to explore detected issues.</p> :
        issues.map((issue, index) => (
          <div key={index} className="border-b border-slate-800/70 p-5 last:border-0">
            <IssueRow issue={issue} />
            <div className="ml-5 mt-3 rounded-lg bg-[#0b1422] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Evidence · Line {issue.line_number}</p>
              <p className="mt-2 break-words font-mono text-xs leading-5 text-slate-300">{issue.evidence}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-amber-400">Probable root cause</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">{issue.root_cause}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Recommended solution</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">{issue.solution}</p>
              {issue.steps?.length > 0 && (
                <ol className="mt-3 list-inside list-decimal space-y-2 text-xs leading-5 text-slate-400">
                  {issue.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              )}
              <p className="mt-4 text-[10px] text-slate-500">AI confidence: <span className="capitalize text-cyan-300">{issue.confidence || "Not specified"}</span></p>
            </div>
          </div>
        ))}
      {issues.length > 0 && (
        <div className="border-t border-slate-800 p-4 text-center text-xs text-slate-500">{issues.length} matching issues</div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center text-center">
      <BarChart3 size={28} className="mb-3 text-slate-600" />
      <p className="text-sm text-slate-400">No analytics available</p>
      <p className="mt-1 text-xs text-slate-600">Upload a log file to populate this chart.</p>
    </div>
  );
}

export default App;
