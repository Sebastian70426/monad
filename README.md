# Monad — AI 学习助手

基于 AI 的文档翻译与学习助手，支持课堂录音转录、智能笔记生成、文档问答。

## 快速开始

### 环境要求
- Python 3.10+
- macOS / Windows / Linux

### 安装步骤

1. 下载项目 ZIP 并解压
2. 安装 Python 3.10+（https://www.python.org/downloads/）
   - Windows 安装时勾选 "Add Python to PATH"
3. 双击启动：
   - **Mac**：双击 `start.command`
   - **Windows**：双击 `start.bat`
4. 首次启动会自动安装依赖（约 5-10 分钟）
5. 安装完成后应用会自动打开

### 配置 API Key

打开应用后进入「设置」页面，需要配置两个 Key：

1. **DeepSeek API Key**（用于 AI 问答和笔记生成）
   - 前往 https://platform.deepseek.com/ 注册获取
   - 填入 → 点击「测试」→ 绿色"连接成功"→「保存设置」

2. **Groq API Key**（用于语音转录）
   - 前往 https://console.groq.com/ 注册获取
   - 填入 → 点击「测试」→ 绿色"连接成功"→「保存设置」

### 使用方法

**翻译文档：**
1. 「课程」→ 创建一门课程
2. 「知识库」→ 选择课程 → 上传 PDF/PPT/TXT 文件
3. 「AI Tutor」→ 新建对话 → 输入"请翻译全文"或"请翻译第3页"

**录音转笔记：**
1. 「录音分析」→ 选择课程 → 选择音频 → 开始
2. 自动转录 → 自动生成结构化笔记

**AI 问答：**
1. 「AI Tutor」→ 新建对话 → 直接提问
2. AI 会基于已上传的课程资料回答

## 技术栈
- Eel / Python / SQLite
- Groq Whisper API (语音转录)
- ChromaDB + BAAI/bge-small-zh-v1.5 (向量检索)
- BAAI/bge-reranker-base (交叉编码器精排)
- DeepSeek API (LLM)
