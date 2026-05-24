import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from flask import Flask, jsonify, render_template

from config import config_by_name
from routes.prediction_routes import prediction_bp
from services.model_service import model_service


def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(config_by_name(config_name))

    configure_logging(app)
    model_service.initialize(app.config)

    app.register_blueprint(prediction_bp)

    @app.route("/")
    def index():
        return render_template(
            "index.html",
            stats=model_service.dataset_stats,
            metrics=model_service.model_metrics,
            feat_imp=model_service.feature_importance,
            model_meta=model_service.metadata,
        )

    @app.route("/health")
    def health():
        return jsonify(model_service.health_report()), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "error": "Resource not found."}), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.exception("Unhandled application error: %s", error)
        return jsonify({"success": False, "error": "Internal server error."}), 500

    return app


def configure_logging(app):
    log_dir = Path(app.config["BASE_DIR"]) / "logs"
    log_dir.mkdir(exist_ok=True)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )
    file_handler = RotatingFileHandler(
        log_dir / "pricewise.log", maxBytes=1_000_000, backupCount=3
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    stream_handler.setLevel(logging.INFO)

    app.logger.handlers.clear()
    app.logger.addHandler(file_handler)
    app.logger.addHandler(stream_handler)
    app.logger.setLevel(logging.INFO)


app = create_app()


if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
