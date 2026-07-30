# Monad — AI 学习助手

## 给朋友的使用说明

### 第一步：安装 Python
1. 前往 https://www.python.org/downloads/ 下载 Python 3.10+
2. 安装时勾选 "Add Python to PATH"
3. Mac 用户安装后打开终端运行 `python3 --version` 确认

### 第二步：下载项目
1. 前往 https://github.com/Sebastian70426/monad
2. 点击绿色 "Code" 按钮 → "Download ZIP"
3. 解压到任意位置（如桌面）

### 第三步：启动
- **Mac 用户**：双击 `start.command` 文件
- **Windows 用户**：双击 `start.bat` 文件

首次启动会自动安装环境（需要几分钟），之后每次启动只需几秒。

### 第四步：配置
1. 打开后进入「设置」页面
2. 填入 DeepSeek API Key（前往 https://platform.deepseek.com/ 注册获取）
3. 点击「测试」→ 显示绿色"连接成功"后点击「保存设置」

### 使用方法
- **翻译文档**：知识库 → 选择课程 → 上传 PDF/PPT → AI Tutor 提问"请翻译第X页内容"
- **录音转笔记**：录音分析 → 选择课程 → 选择音频 → 自动生成笔记
- **AI 问答**：AI Tutor → 新建对话 → 直接提问

## 技术栈
- Eel (桌面框架)
- faster-whisper (语音转录)
- ChromaDB + BAAI/bge-small-zh-v1.5 (向量检索)
- BAAI/bge-reranker-base (交叉编码器精排)
- DeepSeek API (LLM)
- SQLite (数据存储)
