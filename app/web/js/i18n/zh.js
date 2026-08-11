/* Monad 简体中文字典（基准） */
window.I18N_DICTS = window.I18N_DICTS || {};
window.I18N_DICTS.zh = {
  "nav": {
    "study": "学习", "ai": "智能",
    "dashboard": "仪表盘", "courses": "课程", "tutor": "AI Tutor",
    "knowledge": "知识库", "review": "复习", "settings": "设置",
    "tagline": "AI 学习伙伴"
  },
  "topbar": { "modelReady": "模型就绪 · {provider}" },
  "aisub": { "newChat": "新对话", "history": "历史记录", "context": "上下文/课程" },
  "pop": {
    "historyTitle": "历史对话", "contextTitle": "选择提问范围",
    "loading": "加载中...", "noSessions": "暂无历史对话",
    "noCourses": "还没有课程", "globalKB": "全局知识库", "chatNo": "对话 #{id}"
  },
  "cmd": {
    "section": "操作",
    "upload": "上传新录音", "uploadHint": "语音转文字 → AI 笔记",
    "wake": "唤醒 AI Tutor", "wakeHint": "基于课程与知识库问答",
    "review": "开始复习", "reviewHint": "SM-2 间隔复习",
    "courses": "打开课程", "coursesHint": "课程列表",
    "dashboard": "返回仪表盘", "dashboardHint": "今日概览",
    "settings": "打开设置", "settingsHint": "API Key 与模型",
    "noMatch": "没有匹配的命令"
  },
  "chat": {
    "createFail": "创建对话失败: {err}", "unknown": "未知错误",
    "thinking": "✦ AI 正在思考...", "noReply": "（无回复）",
    "imageTag": "[图片]", "noVision": "当前模型不支持图片，请切换到 OpenAI / Gemini 多模态模型",
    "attachImage": "添加图片", "imageTooLarge": "图片过大（超过 8MB）", "imageLimit": "最多同时发送 3 张图片"
  },
  "idx": {
    "indexing": "正在建立索引…",
    "done": "✅ 索引完成（{count} chunks）",
    "noKey": "❌ 未配置模型 API Key，跳过索引",
    "fail": "❌ 索引失败: {err}"
  },
  "dash": {
    "greetNight": "夜深了，{name}。", "greetMorning": "早安，{name}。",
    "greetAfternoon": "下午好，{name}。", "greetEvening": "晚上好，{name}。",
    "hero": "准备好开启今天的学习了吗？", "heroSub": "今日 AI 学习节奏已为你整理好",
    "progress": "学习进度", "review": "今日待复习", "ai": "AI 推荐任务",
    "trendSm2": "SM-2", "trendAi": "智能",
    "continue": "继续学习", "plan": "今日 AI 计划", "memory": "学习记忆", "loading": "正在加载...",
    "progressUnit": "门课程在学", "reviewUnit": "道题待复习", "aiUnit": "节录音待笔记",
    "createdAt": "创建于 {time}", "noCourses": "还没有课程，去创建第一门吧",
    "planEmpty": "完成课程与测验后，AI 会为你生成个性化计划",
    "memoryEmpty": "还没有知识沉淀，去分析第一节课堂录音吧"
  },
  "crs": {
    "subtitle": "管理你的所有课程", "newCourse": "新建课程",
    "loading": "加载中...", "emptyTitle": "还没有课程",
    "emptySub": "创建你的第一门课程，开始学习之旅", "create": "创建课程",
    "createdAt": "创建于 {time}", "enter": "进入 →", "more": "更多操作",
    "namePrompt": "课程名称，如：工程力学", "createFail": "创建失败",
    "menuSettings": "课程设置", "comingSoon": "课程设置即将上线",
    "rename": "重命名课程", "archive": "归档课程", "delete": "删除课程",
    "renamePrompt": "重命名课程：", "renameFail": "重命名失败",
    "archiveTitle": "归档课程",
    "archiveMsg": "归档后该课程将从首页隐藏，但所有笔记、资料和对话都会保留。可以在后续版本中恢复。",
    "archiveBtn": "归档",
    "deleteTitle": "删除课程",
    "deleteMsg": "确定要删除课程「{name}」吗？\n\n该课程下的所有课堂记录、课程资料、AI 对话和测验题将一并删除，此操作不可恢复。",
    "deleteBtn": "确认删除", "deleteErr": "删除出错: {err}",
    "confirm": "确认"
  },
  "cr": {
    "meta": "课堂记录 · 课程资料 · AI Tutor",
    "lectures": "课堂记录", "upload": "🎤 上传录音", "docs": "课程资料",
    "tutorHint": "· 基于本课程资料对话", "tutorPlaceholder": "围绕当前课程提问...",
    "inputPlaceholder": "输入你的问题...",
    "noLectures": "还没有课堂记录，点右上角上传第一节录音",
    "hasNote": "已生成笔记", "note": "📝 笔记", "export": "导出",
    "noDocs": "暂无课程资料，去知识库上传 PDF/PPT/图片",
    "transcript": "原始转录", "currentLecture": "当前课时 · {title}",
    "noNote": "该课堂记录还没有笔记", "genNote": "生成 AI 笔记", "generating": "生成中...",
    "transcribeFail": "转录失败: {err}"
  },
  "tut": {
    "hero": "今天想探索什么？",
    "heroSub": "从一门课程、一个概念，或一道题开始 —— 你的 AI 助教随时待命",
    "placeholder": "输入你的问题...",
    "chipSimplify": "简化", "chipExample": "例题", "chipQuiz": "出题", "chipAnalogy": "类比",
    "globalKB": "🌍 全局知识库", "courseLabel": "📚 {name}",
    "newChat": "New Chat", "noSessions": "暂无对话"
  },
  "kb": {
    "title": "知识库", "subtitle": "课程资料 + RAG 向量索引",
    "allCourses": "全部课程", "upload": "上传资料",
    "search": "搜索文件名或文档内容（支持语义检索）...",
    "colFilename": "文件名", "colCourse": "课程", "colTime": "上传时间",
    "colSize": "大小", "colIndex": "索引", "colActions": "操作",
    "emptyTitle": "还没有匹配的资料",
    "emptySub": "点击右上角「上传资料」添加 PDF / PPT / TXT / 图片",
    "uploading": "正在上传 {name} ...",
    "uploadOk": "✅ 上传成功，正在后台建立索引…", "uploadErr": "❌ {err}",
    "pickTitle": "选择上传到哪门课程", "pickFirst": "请先创建一门课程", "cancel": "取消",
    "deleteConfirm": "确认删除该文档及其向量索引？",
    "reindexing": "正在重新索引…", "reindexBtn": "重索引",
    "reindexDone": "✅ 索引完成（{count} chunks）", "reindexFail": "❌ {err}",
    "notIndexed": "未索引", "indexed": "已索引 {count} chunks",
    "semHit": "语义命中", "fnHit": "文件名",
    "visionExtracting": "正在用视觉模型提取图片文字…", "noVisionDoc": "当前模型不支持图片，请切换到 OpenAI / Gemini 后再上传图片文档"
  },
  "rv": {
    "title": "复习", "subtitle": "SM-2 间隔复习 · 让知识进入长期记忆",
    "dueToday": "今日待复习", "totalBank": "总题库", "mastery": "掌握率",
    "selectCourse": "选择课程", "genQuiz": "生成测验", "startReview": "开始复习",
    "generating": "正在生成测验题...", "generated": "已生成 {count} 道题",
    "pickFirst": "请先选择课程", "noneDue": "今天没有待复习的题目",
    "questionNo": "第 {i} / {n} 题",
    "fillPlaceholder": "输入答案...", "submit": "提交",
    "rateLabel": "掌握程度?", "forget": "忘了", "fuzzy": "模糊", "remember": "记住了",
    "correct": "✅ 正确", "wrong": "❌ 错误", "answer": "正确答案: {ans}",
    "summaryCorrect": "{c} / {n} 正确",
    "summaryRate": "正确率 {pct}% · 复习计划已更新"
  },
  "st": {
    "title": "设置", "subtitle": "API Key · 模型提供商 · 语言",
    "langLabel": "界面语言", "zh": "简体中文", "en": "English", "ja": "日本語",
    "providerLabel": "AI 模型提供商",
    "pDeepseek": "DeepSeek", "pOpenai": "OpenAI (ChatGPT)", "pGroq": "Groq", "pGemini": "Google Gemini",
    "keyPlaceholder": "请输入 API Key", "test": "测试", "testing": "测试中...",
    "connected": "✅ 连接成功", "failed": "❌ 连接失败",
    "save": "保存设置", "saved": "✅ 已保存",
    "keyDeepseek": "DeepSeek API Key", "keyOpenai": "OpenAI API Key", "keyGemini": "Gemini API Key", "keyGroq": "Groq API Key",
    "llmCard": "AI 模型 · LLM", "transcribeCard": "语音转录 · Groq Whisper",
    "groqNote": "Groq 的 Key 同时用于语音转录与 Groq 文本模型",
    "visionNote": "OpenAI 与 Gemini 支持多模态（图片理解）；DeepSeek 与 Groq 仅支持文字",
    "modelStatus": "模型状态"
  },
  "splash": {
    "sub": "Initializing AI Engine",
    "model": "AI Model", "kb": "Knowledge Base", "memory": "Learning Memory",
    "welcome": "Welcome back, {name}"
  }
};
