FEATURES = [
    "number of bedrooms",
    "number of bathrooms",
    "living area",
    "lot area",
    "number of floors",
    "condition of the house",
    "Built Year",
    "Postal Code",
    "Number of schools nearby",
    "Distance from the airport",
]

TARGET = "Price"

FEATURE_RULES = {
    "number of bedrooms": {"label": "Bedrooms", "min": 1, "max": 20},
    "number of bathrooms": {"label": "Bathrooms", "min": 0.5, "max": 10},
    "living area": {"label": "Living area", "min": 200, "max": 15000},
    "lot area": {"label": "Lot area", "min": 400, "max": 1100000},
    "number of floors": {"label": "Floors", "min": 1, "max": 4},
    "condition of the house": {"label": "House condition", "min": 1, "max": 5},
    "Built Year": {"label": "Built year", "min": 1900, "max": 2026},
    "Postal Code": {"label": "Postal code", "min": 100000, "max": 999999},
    "Number of schools nearby": {"label": "Schools nearby", "min": 0, "max": 10},
    "Distance from the airport": {"label": "Airport distance", "min": 1, "max": 200},
}


def validate_prediction_payload(payload):
    values = {}
    errors = []

    if not isinstance(payload, dict):
        return values, ["Request body must be a valid JSON object."]

    for feature in FEATURES:
        rule = FEATURE_RULES[feature]
        raw_value = payload.get(feature)

        if raw_value in (None, ""):
            errors.append(f"{rule['label']} is required.")
            continue

        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            errors.append(f"{rule['label']} must be a valid number.")
            continue

        if value < 0:
            errors.append(f"{rule['label']} cannot be negative.")
            continue

        if value < rule["min"] or value > rule["max"]:
            errors.append(
                f"{rule['label']} must be between {rule['min']} and {rule['max']}."
            )
            continue

        values[feature] = value

    errors.extend(validate_realistic_relationships(values))
    return values, errors


def validate_realistic_relationships(values):
    errors = []
    bedrooms = values.get("number of bedrooms")
    bathrooms = values.get("number of bathrooms")
    living_area = values.get("living area")
    lot_area = values.get("lot area")
    built_year = values.get("Built Year")
    postal_code = values.get("Postal Code")

    if bedrooms and living_area and bedrooms > 8 and living_area < 1200:
        errors.append("Bedroom count is unrealistic for the living area provided.")

    if bathrooms and bedrooms and bathrooms > bedrooms + 3:
        errors.append("Bathroom count appears unrealistic for the bedroom count.")

    if living_area and lot_area and living_area > lot_area * 1.8:
        errors.append("Living area is unusually high compared with lot area.")

    if built_year and built_year < 1900:
        errors.append("Built year is too old for this model range.")

    if postal_code and len(str(int(postal_code))) != 6:
        errors.append("Postal code must be exactly six digits.")

    return errors
