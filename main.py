import eel
import tkinter as tk
from tkinter import filedialog
import os
from openai import OpenAI
from db import init_db
from services.rag_service import index_document, retrieve_context

# ========== 语音识别模块 ==========

_whisper_model = None

def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        _whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
    return _whisper_model

def transcribe(audio_path):
    model = _get_whisper_model()
    segments, _ = model.transcribe(audio_path, language="zh", vad_filter=True, beam_size=5)
    text = "".join([s.text for s in segments])
    if not text.strip():
        raise Exception("转录结果为空，请检查音频文件是否包含有效语音")
    return text

# ========== 笔记生成模块 ==========

def generate_note_with_rag(transcript, course_name, api_key, rag_context=""):
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

    rag_section = ""
    if rag_context:
        rag_section = f"\n\n## 课程教材参考内容（请优先参考以下内容来确保笔记准确性）\n{rag_context}"

    system_prompt = f"""你是一位资深大学助教，擅长将课堂录音整理成结构清晰的学习笔记。

请根据以下课堂转录文字{rag_section}，为 {course_name} 这门课生成一份学习笔记：

# {course_name} 课堂笔记

## 本节课主题
（一句话概括核心内容）

## 知识点
- 要点1
- 要点2

## 重要公式
（如有公式请列出并解释符号含义，无则写"本节课未涉及公式推导"）

## 关键概念
- 概念1：解释
- 概念2：解释

## 课堂总结
（3-5句话总结）

要求：严格基于转录文字和教材参考内容，不编造内容，使用中文，公式用纯文本如 F = m * a。"""
    response = client.chat.completions.create(
        model="deepseek-v4-flash",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"课堂转录文字：\n\n{transcript}"}
        ],
        temperature=0.7,
        max_tokens=4000
    )
    return response.choices[0].message.content

# ========== 初始化 ==========

init_db()
eel.init('web')

# ========== 课程管理 ==========

@eel.expose
def api_create_course(name):
    from db import query_one, execute
    existing = query_one("SELECT id FROM courses WHERE name = ?", (name,))
    if existing:
        return {"success": False, "error": "课程已存在"}
    course_id = execute("INSERT INTO courses (name) VALUES (?)", (name,))
    course = query_one("SELECT * FROM courses WHERE id = ?", (course_id,))
    return {"success": True, "course": course}


@eel.expose
def api_list_courses():
    from db import query
    courses = query("SELECT * FROM courses ORDER BY created_at DESC")
    return {"success": True, "courses": courses}


@eel.expose
def api_get_course(course_id):
    from db import query_one
    course = query_one("SELECT * FROM courses WHERE id = ?", (course_id,))
    if not course:
        return {"success": False, "error": "课程不存在"}
    return {"success": True, "course": course}


@eel.expose
def api_delete_course(course_id):
    from db import execute
    execute("DELETE FROM lectures WHERE course_id = ?", (course_id,))
    execute("DELETE FROM documents WHERE course_id = ?", (course_id,))
    execute("DELETE FROM courses WHERE id = ?", (course_id,))
    return {"success": True}


# ========== 文件选择 ==========

@eel.expose
def api_select_audio_file():
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(
        title="选择音频文件",
        filetypes=[
            ("音频文件", "*.mp3 *.m4a *.wav *.flac *.ogg"),
            ("所有文件", "*.*")
        ]
    )
    root.destroy()
    if not file_path:
        return {"success": False, "error": "未选择文件"}
    from utils.file_utils import validate_audio, get_file_info
    ok, error = validate_audio(file_path)
    if not ok:
        return {"success": False, "error": error}
    info = get_file_info(file_path)
    return {"success": True, "path": file_path, "info": info}


@eel.expose
def api_select_document_file():
    """打开系统文件选择对话框，选择 PDF/PPT/TXT 文件"""
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(
        title="选择课程资料",
        filetypes=[
            ("课程资料", "*.pdf *.pptx *.ppt *.txt *.md"),
            ("所有文件", "*.*")
        ]
    )
    root.destroy()
    if not file_path:
        return {"success": False, "error": "未选择文件"}
    ext = os.path.splitext(file_path)[1].lower()
    filename = os.path.basename(file_path)
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    return {
        "success": True,
        "path": file_path,
        "info": {"filename": filename, "size_mb": round(size_mb, 1), "format": ext}
    }


# ========== 文件处理 ==========

@eel.expose
def api_copy_audio(file_path, course_id):
    from utils.file_utils import copy_to_data_dir
    dest = copy_to_data_dir(file_path, course_id)
    return {"success": True, "path": dest}


# ========== 文档管理 ==========

@eel.expose
def api_upload_document(file_path, course_id):
    """解析文档，提取文本，保存到数据库，并建立向量索引"""
    from services.document_service import extract_text
    from utils.file_utils import copy_to_data_dir
    from db import execute, query_one, query

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ['.pdf', '.pptx', '.ppt', '.txt', '.md']:
        return {"success": False, "error": f"不支持的文件格式: {ext}"}

    dest = copy_to_data_dir(file_path, course_id)

    try:
        content = extract_text(dest, ext)
    except Exception as e:
        return {"success": False, "error": f"文本提取失败: {str(e)}"}

    if not content or len(content.strip()) < 50:
        return {"success": False, "error": "文件内容过短或无法提取文本（可能是扫描版PDF）"}

    # 存到数据库
    doc_id = execute(
        "INSERT INTO documents (course_id, filename, file_path, file_type, content) VALUES (?, ?, ?, ?, ?)",
        (course_id, os.path.basename(file_path), dest, ext, content)
    )

    # RAG 索引：向量化并存入 ChromaDB
    api_key = query_one("SELECT value FROM settings WHERE key='deepseek_key'")
    if api_key and api_key['value']:
        try:
            chunk_count = index_document(doc_id, content, api_key['value'])
            execute("UPDATE documents SET chunk_count = ? WHERE id = ?", (chunk_count, doc_id))
        except Exception as e:
            print(f"RAG indexing failed: {e}")

    doc = query_one("SELECT id, filename, file_type, chunk_count, created_at FROM documents WHERE id = ?", (doc_id,))
    return {"success": True, "document": doc}

@eel.expose
def api_get_documents(course_id):
    """获取某课程下所有文档"""
    from db import query
    docs = query(
        "SELECT id, course_id, filename, file_type, chunk_count, created_at "
        "FROM documents WHERE course_id = ? ORDER BY created_at DESC",
        (course_id,)
    )
    return {"success": True, "documents": docs}


# ========== AI 处理 ==========

@eel.expose
def api_transcribe_audio(audio_path, course_id):
    """转录音频，创建课堂记录并保存转录文本，返回 lecture_id"""
    from db import execute, query_one
    import time

    try:
        transcript = transcribe(audio_path)
        title = time.strftime("%Y-%m-%d %H:%M 课堂录音")
        lecture_id = execute(
            "INSERT INTO lectures (course_id, title, audio_path, transcript) VALUES (?, ?, ?, ?)",
            (course_id, title, audio_path, transcript)
        )
        return {"success": True, "transcript": transcript, "lecture_id": lecture_id}
    except Exception as e:
        return {"success": False, "error": str(e)}


@eel.expose
def api_generate_note(lecture_id):
    """为指定课堂记录生成笔记并保存（含RAG检索增强）"""
    from db import query_one, execute, query

    lecture = query_one("SELECT * FROM lectures WHERE id = ?", (lecture_id,))
    if not lecture:
        return {"success": False, "error": "课堂记录不存在"}

    course_id = lecture['course_id']
    course = query_one("SELECT name FROM courses WHERE id = ?", (course_id,))
    if not course:
        return {"success": False, "error": "课程不存在"}

    api_key = query_one("SELECT value FROM settings WHERE key='deepseek_key'")
    if not api_key or not api_key['value']:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}

    # RAG 检索：从该课程的文档中检索相关段落
    docs = query("SELECT id FROM documents WHERE course_id = ? AND chunk_count > 0", (course_id,))
    doc_ids = [d['id'] for d in docs] if docs else []
    rag_context = ""
    if doc_ids:
        try:
            rag_context = retrieve_context(doc_ids, lecture['transcript'], api_key['value'])
        except Exception as e:
            print(f"RAG retrieval failed: {e}")

    try:
        note = generate_note_with_rag(lecture['transcript'], course['name'], api_key['value'], rag_context)
        execute("UPDATE lectures SET note = ? WHERE id = ?", (note, lecture_id))
        return {"success": True, "note": note}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== 课堂记录查询 ==========

@eel.expose
def api_get_lectures(course_id):
    from db import query
    lectures = query(
        "SELECT id, course_id, title, audio_path, created_at, "
        "CASE WHEN note IS NOT NULL THEN 1 ELSE 0 END AS has_note "
        "FROM lectures WHERE course_id = ? ORDER BY created_at DESC",
        (course_id,)
    )
    return {"success": True, "lectures": lectures}


@eel.expose
def api_get_lecture(lecture_id):
    from db import query_one
    lecture = query_one("SELECT * FROM lectures WHERE id = ?", (lecture_id,))
    if not lecture:
        return {"success": False, "error": "课堂记录不存在"}
    return {"success": True, "lecture": lecture}


# ========== 设置 ==========

@eel.expose
def api_get_setting(key):
    from db import query_one
    row = query_one("SELECT value FROM settings WHERE key = ?", (key,))
    return row['value'] if row else ""


@eel.expose
def api_save_setting(key, value):
    from db import execute
    execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        (key, value)
    )
    return {"success": True}


@eel.expose
def api_test_key(which, key):
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key, base_url="https://api.deepseek.com/v1")
        client.models.list()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


   # ========== AI Tutor ==========

@eel.expose
def api_create_chat_session(course_id=None, lecture_id=None):
    from db import execute, query_one
    session_id = execute(
        "INSERT INTO chat_sessions (course_id, lecture_id) VALUES (?, ?)",
        (course_id, lecture_id)
    )
    session = query_one("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
    return {"success": True, "session": session}


@eel.expose
def api_tutor_chat(session_id, message):
    from db import execute, query_one

    if not message or not message.strip():
        return {"success": False, "error": "消息不能为空"}

    api_key = query_one("SELECT value FROM settings WHERE key='deepseek_key'")
    if not api_key or not api_key['value']:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}

    session = query_one("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
    if not session:
        return {"success": False, "error": "对话会话不存在"}

    execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
        (session_id, message)
    )

    from services.tutor_service import tutor_chat
    result = tutor_chat(
        session_id=session_id,
        course_id=session['course_id'],
        lecture_id=session['lecture_id'],
        message=message,
        api_key=api_key['value']
    )

    sources_json = str(result.get('sources', []))
    execute(
        "INSERT INTO chat_messages (session_id, role, content, sources) VALUES (?, 'assistant', ?, ?)",
        (session_id, result['reply'], sources_json)
    )

    execute(
        "UPDATE chat_sessions SET updated_at = datetime('now','localtime') WHERE id = ?",
        (session_id,)
    )

    return {
        "success": True,
        "reply": result['reply'],
        "sources": result.get('sources', [])
    }


@eel.expose
def api_get_chat_sessions(course_id=None):
    from db import query
    if course_id:
        sessions = query("SELECT * FROM chat_sessions WHERE course_id = ? ORDER BY updated_at DESC", (course_id,))
    else:
        sessions = query("SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT 20")
    return {"success": True, "sessions": sessions}


@eel.expose
def api_get_chat_messages(session_id):
    from db import query
    messages = query("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    return {"success": True, "messages": messages}


@eel.expose
def api_delete_chat_session(session_id):
    from db import execute
    execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    return {"success": True}
    
if __name__ == '__main__':
    eel.start('index.html', size=(1100, 750), port=8080)
