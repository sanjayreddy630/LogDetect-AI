import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, ArrowUpRight, BrainCircuit, Download, FileText, GitBranch, MessageCircle, Radio, ShieldAlert, Clock3 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function AdvancedFeatures({ analysis, history = [], onOpenAnalysis }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [monitor, setMonitor] = useState(null);
  const [monitorError, setMonitorError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { data } = await axios.get(`${API}/api/monitor/status`);
        if (alive) { setMonitor(data); setMonitorError(""); }
      } catch {
        if (alive) setMonitorError("Monitoring endpoint is unavailable.");
      }
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  async function ask() {
    if (!analysis?.analysis_id || !question.trim()) return;
    setChatBusy(true); setAnswer("");
    try {
      const { data } = await axios.post(`${API}/api/chat`, { analysis_id: analysis.analysis_id, question });
      setAnswer(data.answer || "No answer returned.");
    } catch (error) {
      setAnswer(error.response?.data?.detail || "Could not contact the AI assistant.");
    } finally { setChatBusy(false); }
  }

  async function downloadReport() {
    if (!analysis?.analysis_id) return;
    try {
      const response = await axios.get(`${API}/api/report/${analysis.analysis_id}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url; link.download = `LogDetect_Report_${analysis.analysis_id}.pdf`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch {
      setAnswer("PDF report could not be generated. Check that reportlab is installed in the backend environment.");
    }
  }

  const timeline = analysis?.timeline || [];
  const anomalies = analysis?.anomalies || [];
  const services = analysis?.service_map || [];
  const alerts = analysis?.alerts || [];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-bold">AI investigation</h2><p className="mt-1 text-sm text-slate-500">Evidence, likely causes and next steps from your selected analysis.</p></div>
      <button onClick={downloadReport} disabled={!analysis?.analysis_id} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Download size={16}/> Export PDF report</button>
    </div>
    {!analysis && <div className="panel p-6 text-sm text-slate-400">Upload and analyze a log file first. Then return here to explore its timeline, anomalies, service signals and AI chat.</div>}
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="panel p-5 xl:col-span-2">
        <h3 className="mb-1 flex items-center gap-2 font-semibold"><BrainCircuit className="text-cyan-300" size={18}/> Root-cause analysis</h3>
        <p className="mb-4 text-xs text-slate-500">{analysis ? `Findings returned for ${analysis.filename}.` : "Select an analysis to view evidence-backed findings."}</p>
        {analysis?.issues?.length ? analysis.issues.slice(0, 5).map((issue, index) => (
          <article key={`${issue.line_number}-${index}`} className="mb-3 rounded-xl border border-slate-700/70 bg-slate-950/35 p-4 last:mb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-slate-100">{issue.title || "Detected issue"}</strong>
              <span className="rounded-md border border-rose-400/15 bg-rose-400/5 px-2 py-1 text-[10px] font-semibold text-rose-300">{issue.severity || "Finding"}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{issue.root_cause || "The analysis did not provide a probable root cause."}</p>
            {issue.evidence && <p className="mt-2 break-words rounded-lg bg-slate-900/70 p-3 font-mono text-[10px] leading-5 text-slate-400">Line {issue.line_number ?? "—"} · {issue.evidence}</p>}
            {issue.solution && <p className="mt-2 text-xs leading-5 text-emerald-200/80"><span className="font-semibold text-emerald-300">Suggested fix:</span> {issue.solution}</p>}
          </article>
        )) : <p className="rounded-lg bg-slate-900/60 p-4 text-sm leading-6 text-slate-400">{analysis ? analysis.message || "No AI root-cause findings were returned for this analysis." : "No analysis selected."}</p>}
        {analysis?.recommendations?.length > 0 && <div className="mt-4 border-t border-slate-800 pt-4"><h4 className="mb-2 text-xs font-semibold text-slate-200">Additional recommendations</h4><ul className="list-inside list-disc space-y-2 text-xs leading-5 text-slate-400">{analysis.recommendations.slice(0, 5).map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      </section>
      <section className="panel p-5">
        <h3 className="mb-1 flex items-center gap-2 font-semibold"><FileText className="text-cyan-300" size={18}/> Investigation history</h3>
        <p className="mb-4 text-xs text-slate-500">Recently saved backend analyses.</p>
        {history.length ? history.slice(0, 5).map((item) => (
          <button key={item.id} onClick={() => onOpenAnalysis?.(item)} className="mb-2 flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/30 p-3 text-left transition hover:border-cyan-400/30">
            <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-200">{item.filename}</strong><small className="mt-1 block text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</small></span>
            <ArrowUpRight size={15} className="shrink-0 text-slate-500"/>
          </button>
        )) : <p className="text-sm text-slate-500">No saved investigations are available.</p>}
      </section>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <section className="panel p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><ShieldAlert className="text-rose-400" size={18}/> Smart alerts</h3>
        {alerts.length ? alerts.map((a,i)=><div key={i} className="mb-2 rounded-lg border border-rose-400/15 bg-rose-400/5 p-3"><div className="flex justify-between gap-2 text-sm font-semibold"><span>{a.title}</span><span className="text-rose-300">{a.count}</span></div><p className="mt-1 text-xs text-slate-400">{a.message}</p></div>) : <p className="text-sm text-slate-500">No alert thresholds triggered for the selected analysis.</p>}
      </section>
      <section className="panel p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Radio className="text-emerald-400" size={18}/> Monitoring status</h3>
        {monitorError ? <p className="text-sm text-amber-300">{monitorError}</p> : <><p className={`text-lg font-bold ${monitor?.status === "alert" ? "text-rose-300" : "text-emerald-300"}`}>{monitor?.status || "Checking…"}</p><p className="mt-1 text-xs text-slate-500">{monitor?.message || monitor?.mode || "Checking latest upload"}</p>{monitor?.filename && <p className="mt-2 text-xs text-slate-400">{monitor.filename} · {monitor.errors} errors · {monitor.critical} critical</p>}</>}
        <p className="mt-3 text-[11px] text-slate-600">Refreshes every 10 seconds. This monitors the latest uploaded analysis, not a live server log stream.</p>
      </section>
    </div>
    <section className="panel p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock3 className="text-cyan-300" size={18}/> Incident timeline</h3>
      {timeline.length ? <div className="space-y-3">{timeline.map((point,i)=><div key={i} className="flex items-center gap-3"><span className="w-36 shrink-0 text-xs text-slate-400">{point.time}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{width:`${Math.max(4,point.errors/Math.max(...timeline.map(x=>x.errors))*100)}%`}}/></div><span className="w-8 text-right text-xs text-slate-300">{point.errors}</span></div>)}</div> : <p className="text-sm text-slate-500">Timestamped error events will appear here when present in your logs.</p>}
    </section>
    <div className="grid gap-4 md:grid-cols-2">
      <section className="panel p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Activity className="text-amber-300" size={18}/> Anomaly signals</h3>
        {anomalies.length ? anomalies.map((a,i)=><div key={i} className="mb-2 rounded-lg bg-slate-900/70 p-3"><p className="text-sm text-slate-200">{a.pattern}</p><p className="mt-1 text-xs text-slate-500">{a.kind} · {a.count} occurrences {a.z_score ? `· z-score ${a.z_score}` : ""}</p></div>) : <p className="text-sm text-slate-500">No repeated-pattern or time-window spike signals found. This is a statistical heuristic, not a trained predictive model.</p>}
      </section>
      <section className="panel p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><GitBranch className="text-violet-300" size={18}/> Service signals</h3>
        {services.length ? services.map((s,i)=><div key={i} className="mb-2 flex items-center justify-between rounded-lg bg-slate-900/70 p-3"><span className="text-sm">{s.service}</span><span className="text-xs text-orange-300">{s.error_count} errors</span></div>) : <p className="text-sm text-slate-500">No explicit service= or svc= identifiers were detected. Add service names to log messages to populate this view.</p>}
      </section>
    </div>
    <section className="panel p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><MessageCircle className="text-cyan-300" size={18}/> Chat with your logs</h3>
      {!analysis?.analysis_id ? <p className="text-sm text-slate-500">Analyze a file to enable log chat.</p> : <>
        <p className="mb-3 text-xs text-slate-500">Ask questions about the selected analysis, detected issues and recommended fixes.</p>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} maxLength={2000} placeholder="Which issue should I investigate first, and why?" className="w-full rounded-xl border border-slate-700 bg-[#0b1422] p-3 text-sm outline-none focus:border-cyan-400"/>
        <button onClick={ask} disabled={chatBusy || !question.trim()} className="mt-3 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40">{chatBusy ? "Thinking…" : "Ask LogDetect AI"}</button>
        {answer && <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">{answer}</div>}
      </>}
    </section>
  </div>;
}
