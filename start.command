#!/bin/bash
# Monad 一键启动脚本
# 适合不懂技术的朋友使用

cd "$(dirname "$0")"

echo "==========================================="
echo "  Monad AI 学习助手 - 正在启动..."
echo "==========================================="
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未检测到 Python，请先安装 Python 3.10+"
    echo "   下载地址: https://www.python.org/downloads/"
    echo "   安装后重新双击此文件"
    read -p "按回车键退出..."
    exit 1
fi

# 创建虚拟环境（首次运行）
if [ ! -d "venv" ]; then
    echo "📦 首次运行，正在安装环境（需要几分钟）..."
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖（首次运行）
if ! python -c "import eel" 2>/dev/null; then
    echo "📦 正在安装依赖包..."
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    echo "✅ 依赖安装完成"
fi

echo ""
echo "🚀 启动应用..."
echo "   浏览器会自动打开，请勿关闭此窗口"
echo ""

python main.py

read -p "应用已关闭，按回车键退出..."
