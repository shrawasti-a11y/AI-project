import time

from flask import Blueprint, current_app, jsonify, request

from services.model_service import model_service
from utils.formatter import format_duration_ms, utc_timestamp
from utils.validators import validate_prediction_payload


prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/predict", methods=["POST"])
def predict():
    start = time.perf_counter()
    payload = request.get_json(silent=True)
    values, errors = validate_prediction_payload(payload)

    if errors:
        return (
            jsonify(
                {
                    "success": False,
                    "errors": errors,
                    "timestamp": utc_timestamp(),
                    "performance": {
                        "response_time_ms": format_duration_ms(start, time.perf_counter())
                    },
                }
            ),
            400,
        )

    try:
        response = model_service.predict(values)
        current_app.logger.info(
            "Prediction %s completed in %sms",
            response["prediction_id"],
            response["performance"]["response_time_ms"],
        )
        return jsonify(response), 200
    except Exception as exc:
        current_app.logger.exception("Prediction failed: %s", exc)
        return (
            jsonify(
                {
                    "success": False,
                    "errors": ["Prediction service failed. Please try again."],
                    "timestamp": utc_timestamp(),
                }
            ),
            500,
        )


@prediction_bp.route("/api/model-metadata", methods=["GET"])
def model_metadata():
    return jsonify({"success": True, "metadata": model_service.metadata}), 200
