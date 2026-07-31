#!/bin/bash
cd "$(dirname "$0")"

echo "==========================================="
echo "  Monad AI Study Assistant - Starting..."
echo "==========================================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+"
    echo "   https://www.python.org/downloads/"
    read -p "Press Enter to exit..."
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "📦 First run, installing dependencies (5-10 min)..."
    python3 -m venv venv
fi

source venv/bin/activate

if ! python -c "import eel" 2>/dev/null; then
    echo "📦 Installing packages..."
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    echo "✅ Dependencies installed"
fi

echo ""
echo "🚀 Launching app..."
echo ""

cd app
python main.py

read -p "App closed. Press Enter to exit..."
