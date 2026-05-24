from datetime import datetime, timezone


def utc_timestamp():
    return datetime.now(timezone.utc).isoformat()


def format_inr(value):
    rounded = int(round(float(value)))
    return f"Rs {rounded:,}"


def format_duration_ms(start_time, end_time):
    return round((end_time - start_time) * 1000, 2)
