import sqlite3
import json
from datetime import datetime, timezone

from app.config import DATABASE_FILE


def get_connection():
    DATABASE_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    connection = sqlite3.connect(DATABASE_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                total_lines INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                warning_count INTEGER DEFAULT 0,
                critical_count INTEGER DEFAULT 0,
                analysis_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        connection.commit()


def save_analysis(filename, total_lines, result):
    created_at = datetime.now(timezone.utc).isoformat()

    summary = result.get("summary", {})

    with get_connection() as connection:
        cursor = connection.execute("""
            INSERT INTO analyses (
                filename,
                total_lines,
                error_count,
                warning_count,
                critical_count,
                analysis_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            filename,
            total_lines,
            summary.get("errors", 0),
            summary.get("warnings", 0),
            summary.get("critical", 0),
            json.dumps(result),
            created_at
        ))

        connection.commit()
        return cursor.lastrowid


def get_recent_analyses(limit=20):
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT id, filename, total_lines,
                   error_count, warning_count,
                   critical_count, created_at
            FROM analyses
            ORDER BY id DESC
            LIMIT ?
        """, (limit,)).fetchall()

    return [dict(row) for row in rows]


def get_analysis(analysis_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
        ).fetchone()
    if not row:
        return None
    item = dict(row)
    item["analysis"] = json.loads(item.pop("analysis_json"))
    return item
