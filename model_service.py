import time
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

from utils.formatter import format_duration_ms, format_inr, utc_timestamp
from utils.helpers import (
    append_jsonl,
    confidence_score,
    create_prediction_id,
    market_insight,
    property_category,
    recommended_action,
)
from utils.validators import FEATURE_RULES, FEATURES, TARGET


class ModelService:
    def __init__(self):
        self.model = None
        self.config = None
        self.dataset_stats = {}
        self.model_metrics = {}
        self.feature_importance = []
        self.metadata = {}
        self.loaded_at = None

    def initialize(self, config):
        self.config = config
        start = time.perf_counter()
        data = self._load_data()
        self.model = self._train_or_load(data)
        self.dataset_stats = self._dataset_stats(data)
        self.model_metrics = self._evaluate(data)
        self.feature_importance = self._feature_importance()
        self.loaded_at = utc_timestamp()
        self.metadata = {
            "model_name": config["MODEL_NAME"],
            "model_version": config["MODEL_VERSION"],
            "training_date": config["TRAINING_DATE"],
            "feature_count": len(FEATURES),
            "accuracy": self.model_metrics["r2"],
            "loaded_at": self.loaded_at,
            "startup_time_ms": format_duration_ms(start, time.perf_counter()),
        }

    def predict(self, values):
        start = time.perf_counter()
        row = pd.DataFrame([values], columns=FEATURES)
        predicted_price = max(0, float(self.model.predict(row)[0]))
        category = property_category(predicted_price)
        confidence = confidence_score(values, FEATURE_RULES, self.model_metrics["r2"])
        low = predicted_price * 0.85
        high = predicted_price * 1.15
        prediction_id = create_prediction_id()
        timestamp = utc_timestamp()

        response = {
            "success": True,
            "prediction_id": prediction_id,
            "timestamp": timestamp,
            "predicted_price": round(predicted_price),
            "formatted_price": format_inr(predicted_price),
            "confidence_score": confidence,
            "price_range": {
                "low": round(low),
                "high": round(high),
                "formatted_low": format_inr(low),
                "formatted_high": format_inr(high),
            },
            "property_category": category,
            "market_insight": market_insight(category, values),
            "recommended_action": recommended_action(category, confidence),
            "investment_rating": self._investment_rating(category, confidence),
            "market_trend": self._market_trend(values),
            "model_metadata": self.metadata,
            "performance": {
                "response_time_ms": format_duration_ms(start, time.perf_counter())
            },
            "inputs": values,
            # Backward-compatible keys for older frontend code.
            "price": round(predicted_price),
            "range_low": round(low),
            "range_high": round(high),
            "tier": category,
        }
        append_jsonl(self.config["PREDICTION_LOG"], response)
        return response

    def health_report(self):
        return {
            "success": True,
            "status": "healthy" if self.model is not None else "degraded",
            "service": "PriceWise India Prediction API",
            "timestamp": utc_timestamp(),
            "model_loaded": self.model is not None,
            "dataset_records": self.dataset_stats.get("total_records", 0),
            "model_metadata": self.metadata,
        }

    def _load_data(self):
        data_file = Path(self.config["DATA_FILE"])
        if not data_file.exists():
            data_file = Path(self.config["LEGACY_DATA_FILE"])
        if not data_file.exists():
            raise FileNotFoundError("House price dataset was not found.")

        data = pd.read_csv(data_file)
        missing = [column for column in FEATURES + [TARGET] if column not in data.columns]
        if missing:
            raise ValueError(f"Dataset is missing columns: {', '.join(missing)}")
        return data.dropna(subset=FEATURES + [TARGET])

    def _train_or_load(self, data):
        model_file = Path(self.config["MODEL_FILE"])
        model_file.parent.mkdir(parents=True, exist_ok=True)
        if model_file.exists():
            return joblib.load(model_file)

        model = RandomForestRegressor(
            n_estimators=220,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1,
        )
        model.fit(data[FEATURES], data[TARGET])
        joblib.dump(model, model_file)
        return model

    def _evaluate(self, data):
        x_train, x_test, y_train, y_test = train_test_split(
            data[FEATURES], data[TARGET], test_size=0.2, random_state=42
        )
        score_model = RandomForestRegressor(
            n_estimators=220,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1,
        )
        score_model.fit(x_train, y_train)
        r2 = r2_score(y_test, score_model.predict(x_test))
        return {"r2": round(r2 * 100, 1)}

    def _feature_importance(self):
        return [
            {"feature": feature, "importance": round(float(value), 4)}
            for feature, value in sorted(
                zip(FEATURES, self.model.feature_importances_),
                key=lambda item: item[1],
                reverse=True,
            )
        ]

    def _dataset_stats(self, data):
        return {
            "total_records": int(len(data)),
            "avg_price": int(data[TARGET].mean()),
            "min_price": int(data[TARGET].min()),
            "max_price": int(data[TARGET].max()),
        }

    def _investment_rating(self, category, confidence):
        if category == "Luxury" and confidence >= 86:
            return "A+ Premium"
        if confidence >= 84:
            return "A Strong"
        if confidence >= 76:
            return "B Balanced"
        return "C Review"

    def _market_trend(self, values):
        if values["Distance from the airport"] <= 30 and values["Number of schools nearby"] >= 2:
            return "Positive urban connectivity trend"
        if values["condition of the house"] >= 4:
            return "Stable resale trend"
        return "Neutral local market trend"


model_service = ModelService()
