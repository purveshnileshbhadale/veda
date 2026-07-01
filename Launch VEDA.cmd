@echo off
title VEDA - AI Scientist Platform
echo ============================================
echo    VEDA - Virtual Engine for Discovery
echo           & Analysis
echo    "Transforming Knowledge into Discovery."
echo ============================================
echo.
echo Starting VEDA Desktop...
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.11+ from https://www.python.org/
    pause
    exit /b 1
)

:: Check for Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for Electron
where npx >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm/npx not found.
    pause
    exit /b 1
)

:: Install backend dependencies if needed
if not exist "backend\venv\" (
    echo [1/4] Setting up Python virtual environment...
    cd /d "%~dp0backend"
    python -m venv venv
    echo [2/4] Installing backend dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    call deactivate
    cd /d "%~dp0"
) else (
    echo [1/4] Backend environment ready
)

:: Install frontend dependencies if needed
if not exist "frontend\node_modules\" (
    echo [3/4] Installing frontend dependencies...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
) else (
    echo [2/4] Frontend dependencies ready
)

:: Install Electron dependencies if needed
if not exist "electron\node_modules\" (
    echo [3/4] Installing Electron dependencies...
    cd /d "%~dp0electron"
    call npm install
    cd /d "%~dp0"
)

echo [4/4] Starting VEDA Desktop...
echo.

:: Launch through Electron
cd /d "%~dp0electron"
call npm start
cd /d "%~dp0"

echo.
echo VEDA has closed.
pause
