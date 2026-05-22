from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "House_Price_India_in_.csv"
MODEL_FILE = BASE_DIR / "model.pkl"

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

app = Flask(__name__)


def load_data():
    data = pd.read_csv(DATA_FILE)
    return data.dropna(subset=FEATURES + [TARGET])


def train_or_load_model():
    data = load_data()
    x = data[FEATURES]
    y = data[TARGET]

    if MODEL_FILE.exists():
        model = joblib.load(MODEL_FILE)
    else:
        model = RandomForestRegressor(
            n_estimators=180,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1,
        )
        model.fit(x, y)
        joblib.dump(model, MODEL_FILE)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )
    score_model = RandomForestRegressor(n_estimators=180, random_state=42, min_samples_leaf=2, n_jobs=-1)
    score_model.fit(x_train, y_train)
    r2 = r2_score(y_test, score_model.predict(x_test))

    importances = [
        {"feature": feature, "importance": round(float(value), 4)}
        for feature, value in sorted(
            zip(FEATURES, model.feature_importances_),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    stats = {
        "total_records": int(len(data)),
        "avg_price": int(data[TARGET].mean()),
        "min_price": int(data[TARGET].min()),
        "max_price": int(data[TARGET].max()),
    }

    return model, stats, {"r2": round(r2 * 100, 1)}, importances


model, dataset_stats, model_metrics, feature_importance = train_or_load_model()


@app.route("/")
def index():
    return render_template(
        "index.html",
        stats=dataset_stats,
        metrics=model_metrics,
        feat_imp=feature_importance,
    )


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True) or {}

    values = {}
    for feature in FEATURES:
        values[feature] = float(payload[feature])

    row = pd.DataFrame([values], columns=FEATURES)
    price = max(0, float(model.predict(row)[0]))

    return jsonify({
        "success": True,
        "price": round(price),
        "range_low": round(price * 0.85),
        "range_high": round(price * 1.15),
    })


if __name__ == "__main__":
    app.run(debug=True)
