@echo off
cd /d "%~dp0"

echo ===========================================
echo   Monad AI Study Assistant - Starting...
echo ===========================================
echo.

rem -- Locate Python (py launcher first, then python) --
set "PYCMD="
where py >nul 2>nul && set "PYCMD=py -3"
if not defined PYCMD (
    where python >nul 2>nul && set "PYCMD=python"
)
if not defined PYCMD (
    echo [X] Python not found. Please install Python 3.10+
    echo     https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

rem -- Create virtual environment on first run --
if not exist "venv" (
    echo [..] First run, installing dependencies (5-10 min)...
    %PYCMD% -m venv venv
    if errorlevel 1 (
        echo [X] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

set "VPY=venv\Scripts\python.exe"

rem -- Install dependencies if missing --
"%VPY%" -c "import eel" >nul 2>nul
if errorlevel 1 (
    echo [..] Installing packages...
    "%VPY%" -m pip install --upgrade pip -q
    "%VPY%" -m pip install -r requirements.txt -q
    if errorlevel 1 (
        echo [X] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

echo.
echo [..] Launching app...
echo.

cd app
"..\venv\Scripts\python.exe" main.py

echo.
echo App closed.
pause
