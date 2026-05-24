# PriceWise India - House Price Predictor

PriceWise India is a premium Flask machine learning web app that predicts
residential house prices from property details. It uses a Random Forest
regressor trained from the included housing dataset and presents the result in a
modern SaaS-style interface with analytics, animations, theme switching, and
prediction history.

## Highlights

- Premium responsive UI with dark/light theme support
- INR price prediction with an indicative confidence range
- Quick-fill examples for budget, mid-range, and luxury homes
- Local prediction history
- Backend validation for every model input
- Random Forest model trained from the CSV dataset
- Feature-importance chart powered by Chart.js
- Animated statistics, toast notifications, and loading states
- Ready for local use, GitHub upload, and Render deployment

## Project Structure

```text
house-price-project/
|-- app.py
|-- House_Price_India_in_.csv
|-- requirements.txt
|-- Procfile
|-- run_app.bat
|-- templates/
|   |-- index.html
|-- static/
|   |-- style.css
|   |-- script.js
|-- .gitignore
|-- PROJECT_FILES.md
|-- README.md
```

## Run Locally on Windows

Double-click:

```text
run_app.bat
```

Or run manually:

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

## Deploy on Render

Use these Render settings:

```text
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

The model cache file `model.pkl` is created automatically on first run and is
ignored by Git.
