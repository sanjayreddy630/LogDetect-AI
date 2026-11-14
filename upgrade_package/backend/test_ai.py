import json

from app.services.log_parser import parse_logs
from app.services.ai_analyzer import analyze_logs

sample = """
2026-11-14 10:00:00 ERROR Database connection refused localhost:5432
2026-11-14 10:01:00 WARNING Database retry attempt 1
2026-11-14 10:02:00 CRITICAL Database service unavailable
"""

print("LOG PARSER RESULT")

parsed = parse_logs(sample)
print(json.dumps(parsed, indent=4))

print("\nAI ANALYSIS STARTED...")

result = analyze_logs(parsed)

print("\nAI ANALYSIS RESULT")
print(json.dumps(result, indent=4))
