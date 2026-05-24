@echo off
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python is not installed or not added to PATH.
  echo Install Python 3.10 or newer from https://www.python.org/downloads/
  pause
  exit /b 1
)

if not exist venv (
  python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py
