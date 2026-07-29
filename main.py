import eel
import tkinter as tk
from tkinter import filedialog
import os
import time
from openai import OpenAI
from db import init_db
from repos import course_repo, lecture_repo, document_repo, chat_repo, settings_repo
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
        raise Exception("转录结果为空,请检查音频文件是否包含有效语音")
    return text

# ========== 笔记生成模块 ==========

def generate_note_with_rag(transcript, course_name, api_key, rag_context=""):
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

    rag_section = ""
    if rag_context:
        rag_section = f"\n\n## 课程教材参考内容(请优先参考以下内容来确保笔记准确性)\n{rag_context}"

    system_prompt = f"""你是一位资深大学助教,擅长将课堂录音整理成结构清晰的学习笔记。

请根据以下课堂转录文字{rag_section},为 {course_name} 这门课生成一份学习笔记:

# {course_name} 课堂笔记

## 本节课主题
(一句话概括核心内容)

## 知识点
- 要点1
- 要点2

## 重要公式
(如有公式请列出并解释符号含义,无则写"本节课未涉及公式推导")

## 关键概念
- 概念1:解释
- 概念2:解释

## 课堂总结
(3-5句话总结)

要求:严格基于转录文字和教材参考内容,不编造内容,使用中文,公式用纯文本如 F = m * a。"""
    response = client.chat.completions.create(
        model="deepseek-v4-flash",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"课堂转录文字:\n\n{transcript}"}
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
    existing = course_repo.get_by_name(name)
    if existing:
        return {"success": False, "error": "课程已存在"}
    course_id = course_repo.create(name)
    course = course_repo.get_by_id(course_id)
    return {"success": True, "course": course}


@eel.expose
def api_list_courses():
    courses = course_repo.get_all()
    return {"success": True, "courses": courses}


@eel.expose
def api_get_course(course_id):
    course = course_repo.get_by_id(course_id)
    if not course:
        return {"success": False, "error": "课程不存在"}
    return {"success": True, "course": course}


@eel.expose
def api_delete_course(course_id):
    # 级联删除：先删子表，再删父表
    lecture_repo.delete_by_course(course_id)
    document_repo.delete_by_course(course_id)
    course_repo.delete(course_id)
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
    """打开系统文件选择对话框,选择 PDF/PPT/TXT 文件"""
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
    """解析文档,提取文本,保存到数据库,并建立向量索引"""
    from services.document_service import extract_text
    from utils.file_utils import copy_to_data_dir

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ['.pdf', '.pptx', '.ppt', '.txt', '.md']:
        return {"success": False, "error": f"不支持的文件格式: {ext}"}

    dest = copy_to_data_dir(file_path, course_id)

    try:
        content = extract_text(dest, ext)
    except Exception as e:
        return {"success": False, "error": f"文本提取失败: {str(e)}"}

    if not content or len(content.strip()) < 50:
        return {"success": False, "error": "文件内容过短或无法提取文本(可能是扫描版PDF)"}

    # 存到数据库
    doc_id = document_repo.create(
        course_id, os.path.basename(file_path), dest, ext, content
    )

    # RAG 索引:向量化并存入 ChromaDB
    api_key = settings_repo.get('deepseek_key')
    if api_key:
        try:
            chunk_count = index_document(doc_id, content)
            document_repo.update_chunk_count(doc_id, chunk_count)
        except Exception as e:
            print(f"RAG indexing failed: {e}")

    doc = document_repo.get_meta_by_id(doc_id)
    return {"success": True, "document": doc}


@eel.expose
def api_get_documents(course_id):
    """获取某课程下所有文档"""
    docs = document_repo.get_meta_by_course(course_id)
    return {"success": True, "documents": docs}


# ========== AI 处理 ==========

@eel.expose
def api_transcribe_audio(audio_path, course_id):
    """转录音频,创建课堂记录并保存转录文本,返回 lecture_id"""
    try:
        transcript = transcribe(audio_path)
        title = time.strftime("%Y-%m-%d %H:%M 课堂录音")
        lecture_id = lecture_repo.create(course_id, title, audio_path, transcript)
        return {"success": True, "transcript": transcript, "lecture_id": lecture_id}
    except Exception as e:
        return {"success": False, "error": str(e)}


@eel.expose
def api_generate_note(lecture_id):
    """为指定课堂记录生成笔记并保存(含RAG检索增强)"""
    lecture = lecture_repo.get_by_id(lecture_id)
    if not lecture:
        return {"success": False, "error": "课堂记录不存在"}

    course_id = lecture['course_id']
    course = course_repo.get_by_id(course_id)
    if not course:
        return {"success": False, "error": "课程不存在"}

    api_key = settings_repo.get('deepseek_key')
    if not api_key:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}

    # RAG 检索:从该课程的文档中检索相关段落
    doc_ids = document_repo.get_ids_with_chunks(course_id)
    rag_context = ""
    if doc_ids:
        try:
            rag_context = retrieve_context(doc_ids, lecture['transcript'])
        except Exception as e:
            print(f"RAG retrieval failed: {e}")

    try:
        note = generate_note_with_rag(lecture['transcript'], course['name'], api_key, rag_context)
        lecture_repo.update_note(lecture_id, note)
        return {"success": True, "note": note}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== 课堂记录查询 ==========

@eel.expose
def api_get_lectures(course_id):
    lectures = lecture_repo.get_by_course(course_id)
    return {"success": True, "lectures": lectures}


@eel.expose
def api_get_lecture(lecture_id):
    lecture = lecture_repo.get_by_id(lecture_id)
    if not lecture:
        return {"success": False, "error": "课堂记录不存在"}
    return {"success": True, "lecture": lecture}


# ========== 设置 ==========

@eel.expose
def api_get_setting(key):
    return settings_repo.get(key, default="")


@eel.expose
def api_save_setting(key, value):
    settings_repo.set(key, value)
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
    session_id = chat_repo.create_session(course_id, lecture_id)
    session = chat_repo.get_session_by_id(session_id)
    return {"success": True, "session": session}


@eel.expose
def api_tutor_chat(session_id, message):
    if not message or not message.strip():
        return {"success": False, "error": "消息不能为空"}

    api_key = settings_repo.get('deepseek_key')
    if not api_key:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}

    session = chat_repo.get_session_by_id(session_id)
    if not session:
        return {"success": False, "error": "对话会话不存在"}

    # 保存用户消息
    chat_repo.add_message(session_id, 'user', message)

    from services.tutor_service import tutor_chat
    result = tutor_chat(
        session_id=session_id,
        course_id=session['course_id'],
        lecture_id=session['lecture_id'],
        message=message,
        api_key=api_key
    )

    # 保存 AI 回复
    sources_json = str(result.get('sources', []))
    chat_repo.add_message(session_id, 'assistant', result['reply'], sources_json)

    # 更新会话时间戳
    chat_repo.touch_session(session_id)

    return {
        "success": True,
        "reply": result['reply'],
        "sources": result.get('sources', [])
    }


@eel.expose
def api_get_chat_sessions(course_id=None):
    if course_id:
        sessions = chat_repo.get_sessions_by_course(course_id)
    else:
        sessions = chat_repo.get_recent_sessions(limit=20)
    return {"success": True, "sessions": sessions}


@eel.expose
def api_get_chat_messages(session_id):
    messages = chat_repo.get_messages(session_id)
    return {"success": True, "messages": messages}


@eel.expose
def api_delete_chat_session(session_id):
    chat_repo.delete_session(session_id)
    return {"success": True}


if __name__ == '__main__':
    eel.start('index.html', size=(1100, 750), port=8080)
