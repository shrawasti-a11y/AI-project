# PriceWise India - House Price Predictor

A Flask web app that predicts Indian house prices with a scikit-learn Random Forest model.

## Project Structure

```text
.
├── app.py
├── House_Price_India_in_.csv
├── requirements.txt
├── Procfile
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Run Locally

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## Deploy on Render

Use these settings:

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`

The trained `model.pkl` file is generated automatically on first run and is ignored by Git.
