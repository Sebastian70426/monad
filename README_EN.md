# Monad — AI Study Assistant

An AI-powered learning assistant for university students. Upload lecture recordings and course materials to auto-generate structured notes, ask AI questions, and review with spaced repetition.

## ✨ Core Features
- 🎤 **Lecture Analysis** — Upload classroom recordings → speech-to-text → AI-generated structured notes
- 📚 **Course Management** — Organize lecture notes by course, review historical notes anytime
- 📝 **Structured Notes** — Summary / Key Concepts / Equations / Exam Focus / Terminology
- 🤖 **AI-Powered** — DeepSeek API for note generation, Groq Whisper API for transcription
- 📖 **Knowledge Base** — Upload PDF/PPT/TXT course materials with RAG-enhanced retrieval
- 🧠 **AI Tutor** — Ask questions with streaming responses, powered by two-stage RAG (vector recall + cross-encoder reranking)
- 🔄 **Spaced Repetition** — SM-2 algorithm schedules review sessions based on student performance
- 🌍 **Bilingual** — UI supports English / Simplified Chinese
- 🌙 **Dark Mode** — Indigo + Zinc color scheme

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- macOS / Windows / Linux

### Installation

1. Download and extract the project ZIP
2. Install Python 3.10+ (https://www.python.org/downloads/)
   - On Windows, check "Add Python to PATH"
3. Launch:
   - **Mac**: Double-click `start.command`
   - **Windows**: Run `python app/main.py` (no `start.bat` yet)
4. First launch will auto-install dependencies (~5-10 min)
5. App opens automatically after installation

### API Key Configuration

Open the app → go to **Settings**, configure two API keys:

1. **DeepSeek API Key** (for AI Q&A and note generation)
   - Register at https://platform.deepseek.com/
   - Enter key → click "Test" → green "Connected" → "Save"

2. **Groq API Key** (for speech-to-text)
   - Register at https://console.groq.com/
   - Enter key → click "Test" → green "Connected" → "Save"

### Usage

**Translate Documents:**
1. Courses → Create a course
2. Knowledge Base → Select course → Upload PDF/PPT/TXT
3. AI Tutor → New session → Type "Please translate the full text" or "Translate page 3"

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
```text
monad/
├── README.md           # Project documentation
├── requirements.txt    # Python dependencies
├── start.command       # Mac one-click launcher
├── .gitignore
├── docs/               # Technical documentation
│   ├── architecture.md # Architecture diagrams
│   └── benchmarks.md   # Performance benchmarks
├── data/               # Runtime data (auto-created, not committed)
│   ├── database.db
│   ├── audio/
│   └── chroma/
└── app/                # Core source code
    ├── main.py         # Entry point, registers all APIs
    ├── config.py       # Global path configuration
    ├── db.py           # SQLite wrapper
    ├── eval_rag.py     # RAG evaluation script
    ├── repos/          # Data access layer
    │   ├── course_repo.py
    │   ├── lecture_repo.py
    │   ├── document_repo.py
    │   ├── chat_repo.py
    │   ├── settings_repo.py
    │   └── quiz_repo.py
    ├── services/       # Business logic layer
    │   ├── tutor_service.py
    │   ├── quiz_service.py
    │   ├── rag_service.py
    │   └── document_service.py
    ├── utils/
    │   └── file_utils.py
    ├── web/            # Frontend
    │   ├── index.html
    │   ├── css/
    │   └── js/
    └── prompts/        # LLM prompts
        ├── note_prompt.txt
        └── tutor_prompts/                                                      🏗️ Architecture                                                                 Frontend (Eel + HTML/CSS/JS)
        │ @eel.expose (RPC)
main.py (API Layer)
        │
┌───────┴───────┐
│   Services    │  repos/      │  rag_service.py
│ tutor_service │  course_repo │  chunk_document
│ quiz_service  │  lecture_repo│  retrieve + rerank
│ doc_service   │  document_repo│ index_document
│               │  chat_repo   │
│               │  quiz_repo   │
│               │  settings_repo│
└───────────────┘ └──────┬─────┘ └──────┬──────┘
                     db.py (SQLite)   ChromaDB (Vector DB)                      Dependency direction (always downward): main.py → services/ → repos/ → db.py

🧠 RAG Pipeline (Two-Stage Retrieval)                                   User Query
   │
   ▼
Stage 1: Vector Recall
   │  query → bge-small-zh-v1.5 → embedding
   │  ChromaDB query → top_k×3 = 15 candidate chunks
   │  (with page/source metadata)
   ▼
Stage 2: Cross-Encoder Reranking
   │  [query, chunk] pairs → bge-reranker-base → scores
   │  Sort by score descending → take top_k = 5
   ▼
Output: context + sources [{page, source, score}]                               🔄 SM-2 Spaced Repetition
ACTION
EASE_FACTOR
INTERVAL
REPETITIONS
NEXT_REVIEW
Initial (quality=3)
2.5
1
0
Today
Correct (quality=5)
2.6
1
1
+1 day
Correct again (quality=5)
2.7
6
2
+6 days
Incorrect (quality=1)
2.5
1
0
+1 day (reset)


🛠️ Tech Stack
Framework: Eel (desktop web framework)
Language: Python 3.10+
Database: SQLite (data) + ChromaDB (vectors)
Speech-to-Text: Groq Whisper API (whisper-large-v3)
LLM: DeepSeek API
Embedding: BAAI/bge-small-zh-v1.5 (local)
Reranker: BAAI/bge-reranker-base (local)
Spaced Repetition: SM-2 algorithm
📄 License
MIT
