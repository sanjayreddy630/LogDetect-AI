from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE
from app.services.log_parser import parse_logs
from app.services.ai_analyzer import analyze_logs
from app.database.db import save_analysis, get_recent_analyses

router = APIRouter(prefix="/api", tags=["Log Analysis"])


@router.post("/analyze")
def analyze_file(file: UploadFile = File(...)):
    filename = Path(file.filename or "unknown.log").name
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format."
        )

    content = file.file.read(MAX_UPLOAD_SIZE + 1)

    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the maximum upload size."
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File must contain valid UTF-8 text."
        )

    try:
        parsed = parse_logs(decoded)
        result = analyze_logs(parsed)

        analysis_id = save_analysis(
            filename,
            parsed["total_lines"],
            result
        )

        return {
            "analysis_id": analysis_id,
            "filename": filename,
            "total_lines": parsed["total_lines"],
            "total_entries": parsed["total_entries"],
            **result
        }

    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Analysis failed. Check backend logs."
        )


@router.get("/history")
def analysis_history():
    return {"history": get_recent_analyses()}
