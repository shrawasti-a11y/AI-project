import os
from pathlib import Path


class BaseConfig:
    BASE_DIR = Path(__file__).resolve().parent
    SECRET_KEY = os.getenv("SECRET_KEY", "pricewise-dev-secret")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    TESTING = False

    DATA_FILE = Path(os.getenv("DATA_FILE", BASE_DIR / "data" / "House_Price_India_in_.csv"))
    LEGACY_DATA_FILE = BASE_DIR / "House_Price_India_in_.csv"
    MODEL_FILE = Path(os.getenv("MODEL_FILE", BASE_DIR / "models" / "model.pkl"))
    MODEL_VERSION = os.getenv("MODEL_VERSION", "2.0.0")
    MODEL_NAME = "RandomForestRegressor"
    TRAINING_DATE = os.getenv("TRAINING_DATE", "2026-05-24")
    PREDICTION_LOG = Path(os.getenv("PREDICTION_LOG", BASE_DIR / "prediction_history.jsonl"))


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False


class TestingConfig(BaseConfig):
    TESTING = True


def config_by_name(name=None):
    selected = name or os.getenv("FLASK_ENV", "production")
    return {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig,
    }.get(selected, ProductionConfig)
