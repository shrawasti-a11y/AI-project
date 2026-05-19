# 🏡 PriceWise India — House Price Predictor

A full-stack web application that predicts Indian house prices using a
**Random Forest ML model**, converted from a MATLAB App Designer project.

---

## 📁 Folder Structure

```
house_price_app/
│
├── app.py                        ← Flask backend (routes + ML prediction)
├── requirements.txt              ← Python dependencies
├── Procfile                      ← Render.com start command
├── .gitignore
├── House_Price_India_in_.csv     ← Dataset (14,619 records, 10 features)
│
├── templates/
│   └── index.html                ← Main HTML page (Jinja2 template)
│
└── static/
    ├── style.css                 ← Responsive dark-theme UI styles
    └── script.js                 ← Fetch-based prediction + Chart.js
```

---

## ⚙️ How to Run Locally (VS Code)

### 1. Prerequisites
- Python 3.10 or newer installed
- The CSV file `House_Price_India_in_.csv` placed in the project root

### 2. Open the folder in VS Code
```
File → Open Folder → select house_price_app/
```

### 3. Open the integrated terminal
```
Terminal → New Terminal   (or Ctrl + ` )
```

### 4. Create a virtual environment
```bash
python -m venv venv
```

### 5. Activate the virtual environment

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

### 6. Install dependencies
```bash
pip install -r requirements.txt
```

### 7. Run the app
```bash
python app.py
```

### 8. Open in browser
```
http://localhost:5000
```

> **Note:** The first run trains and caches the model (`model.pkl`).
> Subsequent runs load from cache and start in ~1 second.

---

## 🌐 Deploy to Render.com (Free Tier)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/house-price-india.git
git push -u origin main
```

### Step 2 — Create a Render account
Go to [render.com](https://render.com) and sign up (free).

### Step 3 — New Web Service
1. Click **New → Web Service**
2. Connect your GitHub account
3. Select the `house-price-india` repo

### Step 4 — Configure the service

| Setting | Value |
|---------|-------|
| **Environment** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app` |
| **Instance Type** | Free |

### Step 5 — Deploy
Click **Create Web Service**. Render will:
1. Install dependencies
2. Run `gunicorn app:app`
3. Give you a URL like `https://house-price-india.onrender.com`

> ⚠️ **Render free tier spins down after 15 min of inactivity.** The first
> request after a cold start may take 30–60 seconds (model retraining).
> Upgrade to the Starter plan ($7/mo) to keep it always-on.

---

## 🧠 MATLAB → Python Conversion Notes

| Aspect | MATLAB Original | Python Equivalent |
|--------|----------------|-------------------|
| UI framework | App Designer | HTML + CSS + JS (Flask) |
| Model type | Linear Regression (Regression Learner) | RandomForestRegressor |
| Model storage | `matlab.mat` (trainedModel struct) | `model.pkl` (joblib) |
| Prediction call | `predictFcn(T)` | `model.predict(X)` |
| Data loading | `load('matlab.mat')` | `pd.read_csv(...)` |
| Accuracy (R²) | ~59 % | ~77 % |

The Random Forest outperforms MATLAB's exported Linear Regression because
it captures non-linear relationships between location, size, and price.

---

## 📊 Dataset

- **Source:** House Price India dataset (14,619 records)
- **Features:** bedrooms, bathrooms, living area, lot area, floors, condition,
  year built, postal code, schools nearby, distance from airport
- **Target:** House price (₹)
- **Price range:** ₹78,000 – ₹77,00,000
