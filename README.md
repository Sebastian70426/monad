# Monad — AI Study Assistant

An AI-powered learning assistant for university students. Upload lecture recordings and course materials to auto-generate structured notes, ask AI questions with RAG-enhanced retrieval, and review with spaced repetition.

## ✨ Core Features

- 🎤 **Lecture Analysis** — Upload classroom recordings → speech-to-text → AI-generated structured notes
- 📚 **Course Management** — Organize lecture notes by course, review historical notes anytime
- 📝 **Structured Notes** — Summary / Key Concepts / Equations / Exam Focus / Terminology
- 📖 **Knowledge Base** — Upload PDF/PPT/TXT/images with two-stage RAG retrieval (vector recall + cross-encoder reranking); image documents (textbook photos, whiteboard shots) are auto-extracted with vision models
- 🧠 **AI Tutor** — Streaming responses with source citations (page numbers); attach images (up to 3) for multimodal models
- 🤖 **Multiple Model Providers** — DeepSeek / OpenAI (ChatGPT) / Groq / Google Gemini, switchable in Settings with one-click connection test
- 🖼️ **Multimodal** — GPT-4o / Gemini can see and answer: chat images, image documents, knowledge graph over course materials
- 🔄 **Spaced Repetition** — SM-2 algorithm schedules review sessions based on student performance
- 🌍 **Trilingual UI** — Simplified Chinese / English / Japanese, switchable anytime
- 🌙 **Dark Mode** — Indigo + Zinc color scheme
- ✂️ **Copyable Content** — Notes, chat history, transcripts and quizzes are selectable and copyable

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- macOS / Windows / Linux

### Installation

1. Download and extract the project ZIP
2. Install Python 3.10+ from https://www.python.org/downloads/
3. Launch:
   - **Mac**: Double-click `start.command`
   - **Windows**: Double-click `start.bat`
4. First launch auto-installs dependencies (~5-10 min)
5. App opens automatically after installation

### API Key Configuration

Open the app → go to **Settings**, choose your model provider and configure keys:

1. **LLM Provider** (for AI Q&A, notes, quizzes and knowledge extraction) — select one:
   - **DeepSeek** — register at https://platform.deepseek.com/
   - **OpenAI (ChatGPT)** — https://platform.openai.com/ (supports images)
   - **Groq** — https://console.groq.com/
   - **Google Gemini** — https://aistudio.google.com/apikey (supports images)
   - Enter key → click "Test" → green "Connected" → "Save"

2. **Groq API Key** (for speech-to-text)
   - Register at https://console.groq.com/
   - Enter key → click "Test" → green "Connected" → "Save"

### Usage

**Translate Documents:**
1. Courses → Create a course
2. Knowledge Base → Select course → Upload PDF/PPT/TXT/images
3. AI Tutor → New session → Type "Please translate the full text"

**Lecture Recording → Notes:**
1. Lecture Analysis → Select course → Choose audio → Start
2. Auto-transcription → Auto-generate structured notes

**AI Q&A:**
1. AI Tutor → New session → Ask any question
2. AI responds based on uploaded course materials with source citations

**Review & Quiz:**
1. Review → Select course → Generate Quizzes
2. Start Review → Answer questions → Rate mastery level
3. SM-2 algorithm schedules next review automatically

## 📁 Project Structure

    monad/
    ├── README.md
    ├── requirements.txt
    ├── start.command          # macOS one-click launcher
    ├── start.bat              # Windows one-click launcher
    ├── .gitignore
    ├── docs/
    │   ├── architecture.md
    │   └── benchmarks.md
    ├── data/
    └── app/
        ├── main.py
        ├── config.py
        ├── db.py
        ├── eval_rag.py
        ├── repos/
        │   ├── course_repo.py
        │   ├── lecture_repo.py
        │   ├── document_repo.py
        │   ├── chat_repo.py
        │   ├── settings_repo.py
        │   └── quiz_repo.py
        ├── services/
        │   ├── tutor_service.py
        │   ├── quiz_service.py
        │   ├── rag_service.py
        │   └── document_service.py
        ├── utils/
        │   └── file_utils.py
        ├── web/
        │   ├── index.html
        │   ├── css/
        │   └── js/
        └── prompts/
            ├── note_prompt.txt
            └── tutor_prompts/

## 🏗️ Architecture

    Frontend (Eel + HTML/CSS/JS)
            | @eel.expose (RPC)
    main.py (API Layer)
            |
    +-------+-------+
    |   Services    |  repos/        |  rag_service.py
    | tutor_service |  course_repo   |  chunk_document
    | quiz_service  |  lecture_repo  |  retrieve + rerank
    | doc_service   |  document_repo |  index_document
    +---------------+  chat_repo     |
                       quiz_repo     |
                       settings_repo |
                    +------+---------+ +------+------+
                db.py (SQLite)        ChromaDB (Vector DB)

**Dependency direction (always downward):** main.py → services → repos → db.py

## 🧠 RAG Pipeline (Two-Stage Retrieval)

    User Query
       |
       v
    Stage 1: Vector Recall
       |  query -> bge-small-zh-v1.5 -> embedding
       |  ChromaDB query -> top_k x 3 = 15 candidate chunks
       |  (with page/source metadata)
       v
    Stage 2: Cross-Encoder Reranking
       |  [query, chunk] pairs -> bge-reranker-base -> scores
       |  Sort by score descending -> take top_k = 5
       v
    Output: context + sources [{page, source, score}]

## 🔄 SM-2 Spaced Repetition

| Action | ease_factor | interval | repetitions | next_review |
|--------|-------------|----------|-------------|-------------|
| Initial (quality=3) | 2.5 | 1 | 0 | Today |
| Correct (quality=5) | 2.6 | 1 | 1 | +1 day |
| Correct again (quality=5) | 2.7 | 6 | 2 | +6 days |
| Incorrect (quality=1) | 2.5 | 1 | 0 | +1 day (reset) |

## 🛠️ Tech Stack

- **Framework**: Eel (desktop web framework)
- **Language**: Python 3.10+
- **Database**: SQLite (data) + ChromaDB (vectors)
- **Speech-to-Text**: Groq Whisper API (whisper-large-v3)
- **LLM**: DeepSeek API
- **Embedding**: BAAI/bge-small-zh-v1.5 (local)
- **Reranker**: BAAI/bge-reranker-base (local)
- **Spaced Repetition**: SM-2 algorithm

## 📄 License

MIT
