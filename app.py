"""
app.py — PriceWise India: House Price Predictor
Flask + scikit-learn Random Forest backend
"""
 
import os
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
 
# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
 
# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(BASE_DIR, "House_Price_India_in_.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
META_PATH  = os.path.join(BASE_DIR, "model_meta.json")
 
# ── Feature columns (match CSV header exactly) ────────────────────────────────
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
 
# ── Friendly display names ─────────────────────────────────────────────────────
FEATURE_LABELS = [
    "Bedrooms", "Bathrooms", "Living Area", "Lot Area",
    "Floors", "Condition", "Year Built", "Postal Code",
    "Schools Nearby", "Airport Distance",
]
 
# ── Global model / metadata ────────────────────────────────────────────────────
model    = None
df_stats = {}
metrics  = {}
feat_imp = []
 
 
def load_or_train():
    """Load cached model or train a fresh one."""
    global model, df_stats, metrics, feat_imp
 
    # Load CSV
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
 
    # Dataset statistics
    df_stats = {
        "total_records": int(len(df)),
        "avg_price":     int(df[TARGET].mean()),
        "median_price":  int(df[TARGET].median()),
        "min_price":     int(df[TARGET].min()),
        "max_price":     int(df[TARGET].max()),
        "std_price":     int(df[TARGET].std()),
    }
 
    # Try to load cached model
    if os.path.exists(MODEL_PATH) and os.path.exists(META_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            with open(META_PATH) as f:
                saved = json.load(f)
            metrics  = saved["metrics"]
            feat_imp = saved["feat_imp"]
            print("✅  Model loaded from cache.")
            return
        except Exception as e:
            print(f"⚠  Cache load failed ({e}), retraining…")
 
    # Train
    print("🔧  Training Random Forest model…")
    X = df[FEATURES].values
    y = df[TARGET].values
 
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
 
    rf = RandomForestRegressor(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
 
    y_pred = rf.predict(X_test)
    r2   = round(r2_score(y_test, y_pred) * 100, 1)
    mae  = int(mean_absolute_error(y_test, y_pred))
    rmse = int(np.sqrt(mean_squared_error(y_test, y_pred)))
 
    metrics = {"r2": r2, "mae": mae, "rmse": rmse}
 
    # Feature importance
    importances = rf.feature_importances_
    fi_pairs = sorted(
        zip(FEATURE_LABELS, importances.tolist()),
        key=lambda x: x[1], reverse=True
    )
    feat_imp = [{"label": l, "value": round(v * 100, 2)} for l, v in fi_pairs]
 
    # Cache
    model = rf
    joblib.dump(model, MODEL_PATH)
    with open(META_PATH, "w") as f:
        json.dump({"metrics": metrics, "feat_imp": feat_imp}, f)
 
    print(f"✅  Model trained — R² = {r2}%, MAE = ₹{mae:,}, RMSE = ₹{rmse:,}")
 
 
# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template(
        "index.html",
        stats=df_stats,
        metrics=metrics,
        feat_imp=feat_imp,
    )
 
 
@app.route("/predict", methods=["POST"])
def predict():
    """Accept JSON body, return predicted price + confidence band."""
    try:
        data = request.get_json(force=True)
 
        row = [
            float(data["numberOfBedrooms"]),
            float(data["numberOfBathrooms"]),
            float(data["livingArea"]),
            float(data["lotArea"]),
            float(data["numberOfFloors"]),
            float(data["conditionOfTheHouse"]),
            float(data["BuiltYear"]),
            float(data["PostalCode"]),
            float(data["NumberOfSchoolsNearby"]),
            float(data["DistanceFromTheAirport"]),
        ]
 
        X = np.array(row).reshape(1, -1)
        price = float(model.predict(X)[0])
 
        # Per-tree predictions for confidence interval
        tree_preds = np.array([t.predict(X)[0] for t in model.estimators_])
        low  = float(np.percentile(tree_preds, 10))
        high = float(np.percentile(tree_preds, 90))
 
        return jsonify({
            "success": True,
            "price":   round(price),
            "low":     round(low),
            "high":    round(high),
        })
 
    except KeyError as e:
        return jsonify({"success": False, "error": f"Missing field: {e}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
 
 
@app.route("/api/stats")
def api_stats():
    return jsonify({"stats": df_stats, "metrics": metrics, "feat_imp": feat_imp})
 
 
# ── Boot ───────────────────────────────────────────────────────────────────────
load_or_train()
 
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
