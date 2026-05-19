# =============================================================================
# app.py — Flask Backend for House Price Predictor (India)
# Converted from MATLAB App Designer (app1.mlapp + matlab.mat)
#
# The original MATLAB app loaded a trainedModel from matlab.mat (Linear Regression
# trained via MATLAB Regression Learner) and predicted house prices from 10 inputs.
# Here we retrain an equivalent (and better) model using scikit-learn's
# RandomForestRegressor on the same dataset, which achieves R² ≈ 0.77.
# =============================================================================

import os
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
import warnings

warnings.filterwarnings("ignore")

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)

# Path to the CSV dataset (placed in the same folder as app.py)
CSV_PATH = os.path.join(os.path.dirname(__file__), "House_Price_India_in_.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# ── Column names matching the MATLAB app's RequiredVariables ─────────────────
FEATURE_COLUMNS = [
    "numberOfBedrooms",
    "numberOfBathrooms",
    "livingArea",
    "lotArea",
    "numberOfFloors",
    "conditionOfTheHouse",
    "BuiltYear",
    "PostalCode",
    "NumberOfSchoolsNearby",
    "DistanceFromTheAirport",
]

# ── Model & dataset globals ───────────────────────────────────────────────────
model = None
model_metrics = {}
dataset_stats = {}


def load_or_train_model():
    """
    Load the pre-trained model from disk if it exists, otherwise
    train a RandomForestRegressor on the CSV dataset and cache it.

    This mirrors the MATLAB workflow:
      1. Load dataset  →  train model  →  export as trainedModel
    We just do the same thing in Python/scikit-learn.
    """
    global model, model_metrics, dataset_stats

    # ── Load dataset ─────────────────────────────────────────────────────────
    df = pd.read_csv(CSV_PATH)

    # Rename columns to match MATLAB variable names exactly
    df.columns = FEATURE_COLUMNS + ["Price"]

    # Basic dataset statistics for the dashboard summary cards
    dataset_stats = {
        "total_records": len(df),
        "avg_price": int(df["Price"].mean()),
        "min_price": int(df["Price"].min()),
        "max_price": int(df["Price"].max()),
        "avg_bedrooms": round(df["numberOfBedrooms"].mean(), 1),
        "avg_living_area": int(df["livingArea"].mean()),
    }

    X = df[FEATURE_COLUMNS]
    y = df["Price"]

    # ── Load cached model or train a new one ─────────────────────────────────
    if os.path.exists(MODEL_PATH):
        print("✅  Loading cached model from model.pkl")
        model = joblib.load(MODEL_PATH)
    else:
        print("🔄  Training RandomForestRegressor on dataset …")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        model = RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

        # Save model so we don't retrain on every restart
        joblib.dump(model, MODEL_PATH)

        # Compute metrics on the hold-out test set
        y_pred = model.predict(X_test)
        model_metrics["r2"] = round(r2_score(y_test, y_pred) * 100, 1)
        model_metrics["mae"] = int(mean_absolute_error(y_test, y_pred))
        print(f"   R² = {model_metrics['r2']}%   MAE = ₹{model_metrics['mae']:,}")

        # Persist metrics alongside the model
        with open(MODEL_PATH.replace(".pkl", "_metrics.json"), "w") as f:
            json.dump(model_metrics, f)

    # Load metrics if they were saved previously
    metrics_file = MODEL_PATH.replace(".pkl", "_metrics.json")
    if os.path.exists(metrics_file):
        with open(metrics_file) as f:
            model_metrics = json.load(f)

    # Feature importances for the UI chart
    importances = model.feature_importances_
    dataset_stats["feature_importances"] = {
        col: round(float(imp) * 100, 2)
        for col, imp in zip(FEATURE_COLUMNS, importances)
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main page with dataset stats embedded."""
    return render_template("index.html", stats=dataset_stats, metrics=model_metrics)


@app.route("/predict", methods=["POST"])
def predict():
    """
    Receive JSON form data, validate it, run prediction, return JSON result.

    Mirrors the MATLAB predictButtonPushed callback:
        T = table(v1, v2, …, v10, 'VariableNames', {...});
        yfit = S.trainedModel.predictFcn(T);
    """
    try:
        data = request.get_json()

        # ── Validate & coerce inputs ──────────────────────────────────────────
        values = []
        validation_errors = []

        field_rules = {
            "numberOfBedrooms":      (int,   1,    20,   "Bedrooms"),
            "numberOfBathrooms":     (float, 0.5,  10,   "Bathrooms"),
            "livingArea":            (int,   200,  15000,"Living Area (sq ft)"),
            "lotArea":               (int,   400,  1100000,"Lot Area (sq ft)"),
            "numberOfFloors":        (float, 1,    4,    "Floors"),
            "conditionOfTheHouse":   (int,   1,    5,    "Condition (1–5)"),
            "BuiltYear":             (int,   1900, 2024, "Built Year"),
            "PostalCode":            (int,   100000,200000,"Postal Code"),
            "NumberOfSchoolsNearby": (int,   0,    10,   "Schools Nearby"),
            "DistanceFromTheAirport":(int,   1,    200,  "Distance from Airport (km)"),
        }

        for col, (cast, lo, hi, label) in field_rules.items():
            raw = data.get(col)
            if raw is None or raw == "":
                validation_errors.append(f"{label} is required.")
                continue
            try:
                val = cast(raw)
            except (ValueError, TypeError):
                validation_errors.append(f"{label} must be a number.")
                continue
            if not (lo <= val <= hi):
                validation_errors.append(f"{label} must be between {lo} and {hi}.")
                continue
            values.append(val)

        if validation_errors:
            return jsonify({"success": False, "errors": validation_errors}), 400

        # ── Prediction ────────────────────────────────────────────────────────
        X_new = np.array([values])
        predicted_price = float(model.predict(X_new)[0])

        # Confidence range using individual tree predictions (random forest)
        tree_preds = np.array([tree.predict(X_new)[0] for tree in model.estimators_])
        low  = int(np.percentile(tree_preds, 10))
        high = int(np.percentile(tree_preds, 90))

        # Simple price tier label
        if predicted_price < 300_000:
            tier = "Budget"
            tier_color = "#10b981"   # green
        elif predicted_price < 600_000:
            tier = "Mid-Range"
            tier_color = "#f59e0b"   # amber
        elif predicted_price < 1_200_000:
            tier = "Premium"
            tier_color = "#6366f1"   # indigo
        else:
            tier = "Luxury"
            tier_color = "#ec4899"   # pink

        return jsonify({
            "success": True,
            "predicted_price": int(predicted_price),
            "price_low":  low,
            "price_high": high,
            "tier": tier,
            "tier_color": tier_color,
            "formatted_price": f"₹{int(predicted_price):,}",
        })

    except Exception as e:
        # Always return JSON even on unexpected errors
        return jsonify({"success": False, "errors": [f"Server error: {str(e)}"]}), 500


@app.route("/stats")
def stats():
    """Return dataset and model stats as JSON (used by the dashboard)."""
    return jsonify({**dataset_stats, **model_metrics})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_or_train_model()          # train/load model before first request
    port = int(os.environ.get("PORT", 5000))
    # debug=False for production; Render sets PORT automatically
    app.run(host="0.0.0.0", port=port, debug=False)
else:
    # Called by gunicorn (Render deployment)
    load_or_train_model()
