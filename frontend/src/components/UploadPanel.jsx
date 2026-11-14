import { CloudUpload, FileText, LoaderCircle, Sparkles, Upload, X } from "lucide-react";

export default function UploadPanel({
  selectedFile, chooseFile, fileRef, dragging, setDragging,
  uploading, progress, onAnalyze, onClear, compact = false
}) {
  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  return (
    <section className={`upload-card${compact ? " upload-card-compact" : ""}`}>
      {!compact && (
        <div className="upload-card-heading">
          <div className="upload-heading-icon"><CloudUpload size={19} /></div>
          <div><h2>Upload log files</h2><p>Get a clear diagnosis and actionable next steps.</p></div>
          <span className="file-limit">MAX 5 MB</span>
        </div>
      )}
      <div
        className={`drop-zone${dragging ? " drop-zone-active" : ""}${selectedFile ? " drop-zone-selected" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !uploading) fileRef.current?.click();
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".log,.txt,.json,.csv"
          className="visually-hidden"
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {selectedFile ? (
          <div className="selected-file">
            <div className="file-icon"><FileText size={20} /></div>
            <div className="selected-file-copy"><strong>{selectedFile.name}</strong><span>{(selectedFile.size / 1024).toFixed(1)} KB · Ready for analysis</span></div>
            {!uploading && <button className="clear-file" onClick={(event) => { event.stopPropagation(); onClear(); }} aria-label="Remove selected file"><X size={16} /></button>}
          </div>
        ) : (
          <>
            <div className="drop-icon"><Upload size={23} /></div>
            <h3>Drop your log file here</h3>
            <p>or <span>browse files</span> from your computer</p>
            <small>LOG · TXT · JSON · CSV <i /> Up to 5 MB</small>
          </>
        )}
      </div>
      {uploading && (
        <div className="upload-progress">
          <div><span>{progress < 100 ? "Uploading and analyzing…" : "Analysis complete"}</span><strong>{progress}%</strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
      )}
      <div className="upload-card-footer">
        <span>Your file is processed by your configured LogDetect backend.</span>
        <button className="button-primary" disabled={!selectedFile || uploading} onClick={onAnalyze}>
          {uploading ? <><LoaderCircle size={16} className="spin" /> Analyzing</> : <><Sparkles size={16} /> Analyze with AI</>}
        </button>
      </div>
    </section>
  );
}
