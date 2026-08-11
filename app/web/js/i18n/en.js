/* Monad English dictionary */
window.I18N_DICTS = window.I18N_DICTS || {};
window.I18N_DICTS.en = {
  "nav": {
    "study": "Study", "ai": "AI",
    "dashboard": "Dashboard", "courses": "Courses", "tutor": "AI Tutor",
    "knowledge": "Knowledge Base", "review": "Review", "settings": "Settings",
    "tagline": "AI Study Companion"
  },
  "topbar": { "modelReady": "Model ready · {provider}" },
  "aisub": { "newChat": "New Chat", "history": "History", "context": "Context / Course" },
  "pop": {
    "historyTitle": "Chat History", "contextTitle": "Choose Question Scope",
    "loading": "Loading...", "noSessions": "No chat history",
    "noCourses": "No courses yet", "globalKB": "Global Knowledge Base", "chatNo": "Chat #{id}"
  },
  "cmd": {
    "section": "Actions",
    "upload": "Upload New Recording", "uploadHint": "Speech-to-text → AI Notes",
    "wake": "Wake Up AI Tutor", "wakeHint": "Q&A from courses & knowledge base",
    "review": "Start Review", "reviewHint": "SM-2 spaced repetition",
    "courses": "Open Courses", "coursesHint": "Course list",
    "dashboard": "Back to Dashboard", "dashboardHint": "Today's overview",
    "settings": "Open Settings", "settingsHint": "API keys & models",
    "noMatch": "No matching commands"
  },
  "chat": {
    "createFail": "Failed to create chat: {err}", "unknown": "Unknown error",
    "thinking": "✦ AI is thinking...", "noReply": "(no reply)",
    "imageTag": "[Image]", "noVision": "The current model does not support images. Switch to OpenAI / Gemini multimodal models.",
    "attachImage": "Add image", "imageTooLarge": "Image too large (over 8MB)", "imageLimit": "Up to 3 images per message"
  },
  "idx": {
    "indexing": "Indexing…",
    "done": "✅ Indexed ({count} chunks)",
    "noKey": "❌ Model API key not configured, skipping index",
    "fail": "❌ Indexing failed: {err}"
  },
  "dash": {
    "greetNight": "Still up, {name}?", "greetMorning": "Good morning, {name}.",
    "greetAfternoon": "Good afternoon, {name}.", "greetEvening": "Good evening, {name}.",
    "hero": "Ready to learn something today?", "heroSub": "Your AI study plan for today is ready",
    "progress": "Learning progress", "review": "Due for review", "ai": "AI-suggested tasks",
    "trendSm2": "SM-2", "trendAi": "AI",
    "continue": "Continue learning", "plan": "Today's AI plan", "memory": "Learning memory", "loading": "Loading...",
    "progressUnit": "courses in progress", "reviewUnit": "items due", "aiUnit": "recordings to summarize",
    "createdAt": "Created {time}", "noCourses": "No courses yet — create your first one",
    "planEmpty": "After finishing courses & quizzes, AI will generate a personalized plan",
    "memoryEmpty": "No knowledge yet — analyze your first lecture recording"
  },
  "crs": {
    "subtitle": "Manage all your courses", "newCourse": "New Course",
    "loading": "Loading...", "emptyTitle": "No courses yet",
    "emptySub": "Create your first course and start learning", "create": "Create Course",
    "createdAt": "Created {time}", "enter": "Open →", "more": "More actions",
    "namePrompt": "Course name, e.g. Engineering Mechanics", "createFail": "Create failed",
    "menuSettings": "Course settings", "comingSoon": "Course settings coming soon",
    "rename": "Rename course", "archive": "Archive course", "delete": "Delete course",
    "renamePrompt": "Rename course:", "renameFail": "Rename failed",
    "archiveTitle": "Archive Course",
    "archiveMsg": "The course will be hidden from the home page, but all notes, materials and chats are kept. It can be restored in a later version.",
    "archiveBtn": "Archive",
    "deleteTitle": "Delete Course",
    "deleteMsg": "Delete course \"{name}\"?\n\nAll lectures, materials, AI chats and quizzes under this course will be deleted. This cannot be undone.",
    "deleteBtn": "Delete", "deleteErr": "Delete failed: {err}",
    "confirm": "Confirm"
  },
  "cr": {
    "meta": "Lectures · Materials · AI Tutor",
    "lectures": "Lectures", "upload": "🎤 Upload Recording", "docs": "Materials",
    "tutorHint": "· Chat based on this course", "tutorPlaceholder": "Ask about this course...",
    "inputPlaceholder": "Type your question...",
    "noLectures": "No lectures yet — upload your first recording",
    "hasNote": "Note ready", "note": "📝 Notes", "export": "Export",
    "noDocs": "No materials yet — upload PDF/PPT/images in Knowledge Base",
    "transcript": "Raw transcript", "currentLecture": "Current lecture · {title}",
    "noNote": "No AI note for this lecture yet", "genNote": "Generate AI Note", "generating": "Generating...",
    "transcribeFail": "Transcription failed: {err}"
  },
  "tut": {
    "hero": "What do you want to explore today?",
    "heroSub": "Start from a course, a concept, or a question — your AI tutor is always ready",
    "placeholder": "Type your question...",
    "chipSimplify": "Simplify", "chipExample": "Example", "chipQuiz": "Quiz me", "chipAnalogy": "Analogy",
    "globalKB": "🌍 Global Knowledge Base", "courseLabel": "📚 {name}",
    "newChat": "New Chat", "noSessions": "No conversations"
  },
  "kb": {
    "title": "Knowledge Base", "subtitle": "Course materials + RAG vector index",
    "allCourses": "All courses", "upload": "Upload",
    "search": "Search file names or content (semantic search supported)...",
    "colFilename": "File name", "colCourse": "Course", "colTime": "Uploaded",
    "colSize": "Size", "colIndex": "Index", "colActions": "Actions",
    "emptyTitle": "No matching files",
    "emptySub": "Click Upload to add PDF / PPT / TXT / images",
    "uploading": "Uploading {name} ...",
    "uploadOk": "✅ Uploaded, indexing in background…", "uploadErr": "❌ {err}",
    "pickTitle": "Choose a course to upload to", "pickFirst": "Create a course first", "cancel": "Cancel",
    "deleteConfirm": "Delete this document and its vector index?",
    "reindexing": "Re-indexing…", "reindexBtn": "Re-index",
    "reindexDone": "✅ Indexed ({count} chunks)", "reindexFail": "❌ {err}",
    "notIndexed": "Not indexed", "indexed": "{count} chunks",
    "semHit": "Semantic", "fnHit": "File name",
    "visionExtracting": "Extracting text from image with vision model…", "noVisionDoc": "The current model cannot read images. Switch to OpenAI / Gemini to upload image documents."
  },
  "rv": {
    "title": "Review", "subtitle": "SM-2 spaced repetition · long-term memory",
    "dueToday": "Due today", "totalBank": "Question bank", "mastery": "Mastery",
    "selectCourse": "Select course", "genQuiz": "Generate Quiz", "startReview": "Start Review",
    "generating": "Generating quiz questions...", "generated": "{count} questions generated",
    "pickFirst": "Select a course first", "noneDue": "Nothing due for review today",
    "questionNo": "Q {i} / {n}",
    "fillPlaceholder": "Type your answer...", "submit": "Submit",
    "rateLabel": "How well did you know it?", "forget": "Forgot", "fuzzy": "Fuzzy", "remember": "Knew it",
    "correct": "✅ Correct", "wrong": "❌ Wrong", "answer": "Correct answer: {ans}",
    "summaryCorrect": "{c} / {n} correct",
    "summaryRate": "{pct}% accuracy · review schedule updated"
  },
  "st": {
    "title": "Settings", "subtitle": "API keys · Model provider · Language",
    "langLabel": "Interface language", "zh": "简体中文", "en": "English", "ja": "日本語",
    "providerLabel": "AI model provider",
    "pDeepseek": "DeepSeek", "pOpenai": "OpenAI (ChatGPT)", "pGroq": "Groq", "pGemini": "Google Gemini",
    "keyPlaceholder": "Enter API key", "test": "Test", "testing": "Testing...",
    "connected": "✅ Connected", "failed": "❌ Connection failed",
    "save": "Save Settings", "saved": "✅ Saved",
    "keyDeepseek": "DeepSeek API Key", "keyOpenai": "OpenAI API Key", "keyGemini": "Gemini API Key", "keyGroq": "Groq API Key",
    "llmCard": "AI Model · LLM", "transcribeCard": "Speech-to-Text · Groq Whisper",
    "groqNote": "The Groq key is used for both transcription and Groq text models",
    "visionNote": "OpenAI and Gemini support multimodal (image understanding); DeepSeek and Groq are text-only",
    "modelStatus": "Model status"
  },
  "splash": {
    "sub": "Initializing AI Engine",
    "model": "AI Model", "kb": "Knowledge Base", "memory": "Learning Memory",
    "welcome": "Welcome back, {name}"
  }
};
