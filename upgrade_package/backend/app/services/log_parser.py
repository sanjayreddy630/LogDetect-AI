
import re
from collections import Counter

TIMESTAMP_PATTERN = re.compile(
    r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}"
)

LEVEL_PATTERN = re.compile(
    r"\b(CRITICAL|FATAL|ERROR|ERR|WARNING|WARN|INFO|DEBUG)\b",
    re.IGNORECASE
)

ERROR_PATTERN = re.compile(
    r"exception|traceback|failed|failure|"
    r"connection refused|timeout|timed out|"
    r"out of memory|permission denied|"
    r"not found|segmentation fault",
    re.IGNORECASE
)


def redact_secrets(text):
    patterns = [
        (r"(?i)(password\s*[=:]\s*)\S+", r"\1[REDACTED]"),
        (r"(?i)(api[_-]?key\s*[=:]\s*)\S+", r"\1[REDACTED]"),
        (r"(?i)(token\s*[=:]\s*)\S+", r"\1[REDACTED]"),
        (r"(?i)(authorization:\s*bearer\s+)\S+", r"\1[REDACTED]"),
    ]

    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)

    return re.sub(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "[REDACTED_EMAIL]",
        text
    )


def parse_logs(content):
    lines = content.splitlines()

    entries = []
    current = None

    for line_number, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()

        if not line:
            continue

        level_match = LEVEL_PATTERN.search(line)

        if level_match:
            if current:
                entries.append(current)

            level = level_match.group(1).upper()

            if level == "FATAL":
                level = "CRITICAL"
            elif level == "ERR":
                level = "ERROR"
            elif level == "WARN":
                level = "WARNING"

            timestamp = TIMESTAMP_PATTERN.search(line)

            current = {
                "line_number": line_number,
                "timestamp": timestamp.group(0) if timestamp else None,
                "level": level,
                "message": redact_secrets(line)
            }

        elif current:
            current["message"] += "\n" + redact_secrets(line)

        elif ERROR_PATTERN.search(line):
            current = {
                "line_number": line_number,
                "timestamp": None,
                "level": "ERROR",
                "message": redact_secrets(line)
            }

    if current:
        entries.append(current)

    counts = Counter(
        entry["level"] for entry in entries
    )

    errors = [
        entry for entry in entries
        if entry["level"] in ["ERROR", "CRITICAL"]
    ]

    return {
        "total_lines": len(lines),
        "total_entries": len(entries),
        "errors": errors,
        "summary": {
            "critical": counts["CRITICAL"],
            "errors": counts["ERROR"],
            "warnings": counts["WARNING"],
            "info": counts["INFO"],
            "debug": counts["DEBUG"]
        }
    }
