# PriceWise India

PriceWise India is an enterprise-style AI-powered real estate prediction
platform built with Flask, scikit-learn, pandas, Chart.js, GSAP, and AOS.
It predicts Indian house prices using a Random Forest model and presents the
result inside a premium SaaS dashboard interface.

## Highlights

- Modular Flask app with app factory, config classes, blueprints, services, and utilities
- Professional `/predict` API with validation, timestamps, confidence score, timing, and insights
- Health monitoring endpoint at `/health`
- Model metadata endpoint at `/api/model-metadata`
- Prediction logging to `prediction_history.jsonl`
- Futuristic responsive SaaS UI with glassmorphism, neon gradients, charts, toasts, and animations
- Prediction history, export, share, save, chatbot popup, dark/light mode, and back-to-top controls
- Render-compatible with `gunicorn app:app`

## Structure

```text
project/
|-- app.py
|-- config.py
|-- requirements.txt
|-- Procfile
|-- data/
|   |-- House_Price_India_in_.csv
|-- models/
|-- routes/
|   |-- prediction_routes.py
|-- services/
|   |-- model_service.py
|-- utils/
|   |-- validators.py
|   |-- helpers.py
|   |-- formatter.py
|-- templates/
|   |-- index.html
|-- static/
|   |-- css/
|   |   |-- style.css
|   |-- js/
|   |   |-- script.js
|   |-- images/
```

## Run Locally

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Render Deployment

```text
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

Generated files such as `models/model.pkl`, `logs/`, and
`prediction_history.jsonl` are ignored by Git.
