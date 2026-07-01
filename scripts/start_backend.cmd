@echo off
cd /d "C:\Users\PURVESH\OneDrive\Desktop\VEDA\backend"
echo Starting VEDA Backend on http://localhost:8000
echo.
"C:\Program Files\Python314\python.exe" -m uvicorn app.main:app --port 8000 --reload
pause
