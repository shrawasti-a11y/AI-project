import json
import uuid

from utils.formatter import utc_timestamp


def create_prediction_id():
    return f"pw-{uuid.uuid4().hex[:12]}"


def property_category(price):
    if price < 2_500_000:
        return "Budget"
    if price < 7_500_000:
        return "Mid-range"
    return "Luxury"


def confidence_score(values, rules, model_accuracy):
    penalties = 0
    for feature, value in values.items():
        rule = rules[feature]
        span = rule["max"] - rule["min"]
        center = rule["min"] + span / 2
        distance = abs(value - center) / span
        if distance > 0.46:
            penalties += 2
        elif distance > 0.38:
            penalties += 1

    score = max(68, min(97, round(model_accuracy - penalties + 4, 1)))
    return score


def market_insight(category, values):
    condition = values["condition of the house"]
    schools = values["Number of schools nearby"]
    airport_distance = values["Distance from the airport"]

    if category == "Luxury":
        return "Luxury segment investment opportunity with premium resale potential."
    if condition >= 4 and schools >= 2 and airport_distance <= 35:
        return "Premium area with strong resale value and high appreciation potential."
    if schools >= 3:
        return "Family-friendly micro-market with strong education-led demand."
    if airport_distance <= 25:
        return "Strong connectivity profile can support future buyer interest."
    return "Stable property profile with balanced affordability and location signals."


def recommended_action(category, confidence):
    if category == "Luxury" and confidence >= 85:
        return "Shortlist for premium investment review."
    if category == "Budget":
        return "Compare with nearby transactions before negotiating."
    if confidence < 78:
        return "Verify local market comparables before final pricing."
    return "Proceed with detailed site and neighborhood evaluation."


def append_jsonl(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    enriched = {"logged_at": utc_timestamp(), **payload}
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(enriched, ensure_ascii=True) + "\n")
