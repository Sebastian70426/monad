import eel
import tkinter as tk
from tkinter import filedialog
import os
import time
import threading
from openai import OpenAI
from db import init_db
from config import LLM_TEMPERATURE, LLM_MAX_TOKENS, MAX_DOC_SIZE_MB
from services.llm_client import PROVIDERS, supports_vision, get_provider_name
from repos import course_repo, lecture_repo, document_repo, chat_repo, settings_repo, quiz_repo, knowledge_repo
from services.rag_service import index_document, retrieve_context

# ========== 语音识别模块 ==========

def transcribe(audio_path):
    """使用 Groq Whisper API 转录音频"""
    from repos import settings_repo
    groq_key = settings_repo.get('groq_key')
    if not groq_key:
        raise Exception("请先在设置页配置 Groq API Key（用于语音转录）")

    from groq import Groq
    client = Groq(api_key=groq_key)

    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=f,
            language="zh",
            response_format="text"
        )

    if not response or not response.strip():
        raise Exception("转录结果为空,请检查音频文件是否包含有效语音")
    return response

# ========== 笔记生成模块 ==========

def generate_note_with_rag_stream(transcript, course_name, rag_context=""):
    """流式生成笔记，yield 每个 chunk（按当前配置的模型提供商）"""
    from services.llm_client import get_llm_client
    client = get_llm_client()

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
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"课堂转录文字:\n\n{transcript}"}
    ]
    for chunk in client.chat_stream(messages, temperature=LLM_TEMPERATURE, max_tokens=LLM_MAX_TOKENS):
        yield chunk

# ========== 初始化 ==========

init_db()
import os as _os, sys as _sys
# PyInstaller 打包后资源在 sys._MEIPASS，开发时用 __file__
if hasattr(_sys, '_MEIPASS'):
    _web_dir = _os.path.join(_sys._MEIPASS, 'app', 'web')
else:
    _web_dir = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'web')
eel.init(_web_dir)

# 后台任务状态跟踪（内存中，重启丢失）
_bg_tasks = {}


def _parse_id(value, label="ID"):
    """把前端传入的 ID 安全转为 int；非法返回 None（供各 API 入口校验）"""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _require_llm_key():
    """检查当前模型提供商是否已配置 API Key；未配置返回错误文案"""
    meta = PROVIDERS[get_provider_name()]
    if not settings_repo.get(meta['key_setting']):
        return f"请先在设置页配置 {meta['label']} API Key"
    return None


# 每个文档一把索引锁：上传后的自动索引与手动"重索引"并发时会互相删除
# 对方的 Chroma 集合导致 "Collection does not exist"，这里串行化同一文档的索引操作
_index_locks = {}
_index_locks_guard = threading.Lock()


def _get_index_lock(doc_id):
    with _index_locks_guard:
        if doc_id not in _index_locks:
            _index_locks[doc_id] = threading.Lock()
        return _index_locks[doc_id]

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
def api_list_courses(include_archived=False):
    courses = course_repo.get_all(include_archived=include_archived)
    return {"success": True, "courses": courses}


@eel.expose
def api_rename_course(course_id, new_name):
    """重命名课程"""
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    name = (new_name or '').strip()
    if not name:
        return {"success": False, "error": "课程名称不能为空"}
    existing = course_repo.get_by_name(name)
    if existing and existing['id'] != cid:
        return {"success": False, "error": "课程已存在"}
    course_repo.rename(cid, name)
    return {"success": True}


@eel.expose
def api_archive_course(course_id):
    """归档课程（数据保留，从首页隐藏）"""
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    course_repo.set_archived(cid, True)
    return {"success": True}


@eel.expose
def api_unarchive_course(course_id):
    """取消归档"""
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    course_repo.set_archived(cid, False)
    return {"success": True}


@eel.expose
def api_get_course(course_id):
    course = course_repo.get_by_id(course_id)
    if not course:
        return {"success": False, "error": "课程不存在"}
    return {"success": True, "course": course}


@eel.expose
def api_delete_course(course_id):
    """删除课程及其所有关联数据（单事务级联删除，顺序严格：先子表后父表）"""
    from db import get_db

    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}

    # 1. SQL 级联删除（单事务：任一失败则整体回滚）
    with get_db() as conn:
        # 对话消息 → 会话
        conn.execute("DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE course_id = ?)", (cid,))
        conn.execute("DELETE FROM chat_sessions WHERE course_id = ?", (cid,))
        # 知识点关联 → 依赖 → 掌握度 → 知识点
        conn.execute("DELETE FROM quiz_knowledge_points WHERE point_id IN (SELECT id FROM knowledge_points WHERE course_id = ?)", (cid,))
        conn.execute("DELETE FROM knowledge_dependencies WHERE point_id IN (SELECT id FROM knowledge_points WHERE course_id = ?) OR depends_on_id IN (SELECT id FROM knowledge_points WHERE course_id = ?)", (cid, cid))
        conn.execute("DELETE FROM knowledge_mastery WHERE point_id IN (SELECT id FROM knowledge_points WHERE course_id = ?)", (cid,))
        conn.execute("DELETE FROM knowledge_points WHERE course_id = ?", (cid,))
        # 复习记录 → 测验
        conn.execute("DELETE FROM reviews WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = ?)", (cid,))
        conn.execute("DELETE FROM quizzes WHERE course_id = ?", (cid,))
        # 课堂记录 / 课程资料
        conn.execute("DELETE FROM lectures WHERE course_id = ?", (cid,))
        conn.execute("DELETE FROM documents WHERE course_id = ?", (cid,))
        # 课程本体
        conn.execute("DELETE FROM courses WHERE id = ?", (cid,))

    # 2. SQL 提交成功后再清理 ChromaDB 向量集合（避免 SQL 回滚时向量已丢的不一致状态）
    try:
        from services.rag_service import _get_client
        docs = document_repo.get_meta_by_course(cid)
        client = _get_client()
        for d in docs:
            try:
                client.delete_collection("doc_%d" % d['id'])
            except Exception:
                pass
    except Exception:
        pass

    return {"success": True}


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
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(
        title="选择课程资料",
        filetypes=[
            ("课程资料", "*.pdf *.pptx *.ppt *.txt *.md *.jpg *.jpeg *.png *.webp"),
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


@eel.expose
def api_select_image_file():
    """选择图片并返回 base64 data URL（多模态对话用，≤8MB）"""
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(
        title="选择图片",
        filetypes=[
            ("图片文件", "*.jpg *.jpeg *.png *.webp"),
            ("所有文件", "*.*")
        ]
    )
    root.destroy()
    if not file_path:
        return {"success": False, "error": "未选择文件"}
    if os.path.getsize(file_path) > 8 * 1024 * 1024:
        return {"success": False, "error": "图片过大（超过 8MB）"}
    from services.llm_client import image_to_data_url
    return {"success": True, "data_url": image_to_data_url(file_path)}


# ========== 文件处理 ==========

@eel.expose
def api_copy_audio(file_path, course_id):
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    from utils.file_utils import copy_to_data_dir
    dest = copy_to_data_dir(file_path, cid)
    return {"success": True, "path": dest}


# ========== 文档管理 ==========

@eel.expose
def api_upload_document(file_path, course_id):
    """解析文档,提取文本,保存到数据库,后台建立向量索引"""
    from services.document_service import extract_structured
    from utils.file_utils import copy_to_data_dir
    import threading

    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}

    if not os.path.isfile(file_path):
        return {"success": False, "error": "文件不存在"}

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_DOC_SIZE_MB:
        return {"success": False, "error": f"文件过大（{size_mb:.1f}MB），上限 {MAX_DOC_SIZE_MB}MB"}

    ext = os.path.splitext(file_path)[1].lower()
    IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']
    TEXT_EXTS = ['.pdf', '.pptx', '.ppt', '.txt', '.md']
    if ext not in TEXT_EXTS + IMAGE_EXTS:
        return {"success": False, "error": f"不支持的文件格式: {ext}"}

    dest = copy_to_data_dir(file_path, cid)
    filename = os.path.basename(file_path)

    try:
        if ext in IMAGE_EXTS:
            # 多模态：用视觉模型提取图片中的文字/图表内容
            err = _require_llm_key()
            if err:
                return {"success": False, "error": err}
            if not supports_vision():
                return {"success": False, "error": "当前模型不支持图片，请切换到 OpenAI / Gemini 后再上传图片文档"}
            from services.document_service import extract_image_text
            sections = extract_image_text(dest, filename)
        else:
            sections = extract_structured(dest, ext, filename)
    except Exception as e:
        return {"success": False, "error": f"文本提取失败: {str(e)}"}

    content = "\n\n".join(s["text"] for s in sections)

    if not content or len(content.strip()) < 50:
        return {"success": False, "error": "文件内容过短或无法提取文本(可能是扫描版PDF)"}

    doc_id = document_repo.create(cid, filename, dest, ext, content)

    # 后台线程建立 RAG 索引
    def _background_index(did, secs):
        try:
            err = _require_llm_key()
            if err:
                eel.update_index_progress(did, "no_key", 0)()
                return
            eel.update_index_progress(did, "indexing", 0)()
            with _get_index_lock(did):
                chunk_count = index_document(did, secs)
                document_repo.update_chunk_count(did, chunk_count)
            eel.update_index_progress(did, "done", chunk_count)()
        except Exception as e:
            import traceback
            print(f"[index] doc#{did} indexing failed: {e}", flush=True)
            traceback.print_exc()
            try:
                eel.update_index_progress(did, "error", str(e))()
            except Exception:
                pass

    thread = threading.Thread(target=_background_index, args=(doc_id, sections), daemon=True)
    thread.start()

    doc = document_repo.get_meta_by_id(doc_id)
    return {"success": True, "document": doc, "indexing": True}


@eel.expose
def api_get_documents(course_id):
    docs = document_repo.get_meta_by_course(course_id)
    return {"success": True, "documents": docs}


@eel.expose
def api_delete_document(doc_id):
    """删除文档及其向量索引"""
    from services.rag_service import _get_client
    try:
        client = _get_client()
        client.delete_collection(f"doc_{doc_id}")
    except Exception:
        pass
    document_repo.delete(doc_id)
    return {"success": True}


# ========== AI 处理 ==========

@eel.expose
def api_transcribe_audio(audio_path, course_id):
    """启动后台转录，立即返回。前端通过 api_get_task_status 轮询"""
    import threading

    _bg_tasks['transcribe'] = {"status": "running", "lecture_id": None, "transcript": None, "error": None}

    def _background_transcribe(path, cid):
        try:
            print(f"[DEBUG] Starting transcription: {path}", flush=True)
            transcript = transcribe(path)
            print(f"[DEBUG] Transcription done, length={len(transcript)}", flush=True)
            title = time.strftime("%Y-%m-%d %H:%M 课堂录音")
            lecture_id = lecture_repo.create(cid, title, path, transcript)
            print(f"[DEBUG] Lecture created: id={lecture_id}", flush=True)
            _bg_tasks['transcribe'] = {"status": "done", "lecture_id": lecture_id, "transcript": transcript, "error": None}
        except Exception as e:
            print(f"[DEBUG] Transcription ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()
            _bg_tasks['transcribe'] = {"status": "error", "lecture_id": None, "transcript": None, "error": str(e)}

    thread = threading.Thread(target=_background_transcribe, args=(audio_path, course_id), daemon=True)
    thread.start()
    return {"success": True, "processing": True}


@eel.expose
def api_get_task_status():
    """获取后台任务状态（用于页面恢复）"""
    return _bg_tasks.get('transcribe', None)


@eel.expose
def api_clear_task_status():
    """清除任务状态"""
    _bg_tasks.pop('transcribe', None)
    return {"success": True}


@eel.expose
def api_generate_note(lecture_id):
    """流式生成笔记，通过 eel 回调推送"""
    lecture = lecture_repo.get_by_id(lecture_id)
    if not lecture:
        return {"success": False, "error": "课堂记录不存在"}

    course_id = lecture['course_id']
    course = course_repo.get_by_id(course_id)
    if not course:
        return {"success": False, "error": "课程不存在"}

    err = _require_llm_key()
    if err:
        return {"success": False, "error": err}

    doc_ids = document_repo.get_ids_with_chunks(course_id)
    rag_context = ""
    if doc_ids:
        try:
            rag_context = retrieve_context(doc_ids, lecture['transcript'])
        except Exception as e:
            print(f"RAG retrieval failed: {e}")

    eel.start_note_stream()()

    full_note = ""
    error = None
    try:
        for chunk in generate_note_with_rag_stream(lecture['transcript'], course['name'], rag_context):
            full_note += chunk
            eel.update_note_stream(chunk)()
    except Exception as e:
        error = str(e)
    finally:
        # 无论成功或中断都通知前端收尾，避免前端悬挂
        eel.end_note_stream()()

    if error:
        return {"success": False, "error": error}

    lecture_repo.update_note(lecture_id, full_note)
    return {"success": True}


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
    return {"success": True, "value": settings_repo.get(key, default="")}


@eel.expose
def api_save_setting(key, value):
    settings_repo.set(key, value)
    return {"success": True}


@eel.expose
def api_test_key(which, key):
    """按提供商测试 API Key：deepseek/openai/groq 走 OpenAI 兼容接口，gemini 走官方 API"""
    try:
        if which == 'gemini':
            from google import genai
            client = genai.Client(api_key=key)
            client.models.get(model='gemini-2.0-flash')
            return {"success": True}
        else:
            meta = PROVIDERS.get(which, PROVIDERS['deepseek'])
            from openai import OpenAI
            client = OpenAI(api_key=key, base_url=meta['base_url'])
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
def api_tutor_chat(session_id, message, images=None):
    """Tutor 对话；images: 图片 data URL 列表（多模态，最多 3 张）"""
    images = images or []
    if not (message or '').strip() and not images:
        return {"success": False, "error": "消息不能为空"}
    if len(images) > 3:
        return {"success": False, "error": "最多同时发送 3 张图片"}

    err = _require_llm_key()
    if err:
        return {"success": False, "error": err}
    if images and not supports_vision():
        return {"success": False, "error": "当前模型不支持图片，请切换到 OpenAI / Gemini 多模态模型"}

    session = chat_repo.get_session_by_id(session_id)
    if not session:
        return {"success": False, "error": "对话会话不存在"}

    # 历史记录只存文本（图片以 [图片] 标记）
    display_msg = (message or '') + (" [图片]" if images else "")
    chat_repo.add_message(session_id, 'user', display_msg)

    from services.tutor_service import tutor_chat_stream
    result = tutor_chat_stream(
        session_id=session_id,
        course_id=session['course_id'],
        lecture_id=session['lecture_id'],
        message=message or '',
        images=images
    )

    sources = result.get('sources', [])

    # 通知前端开始流式输出
    eel.start_tutor_stream(sources)()

    # 流式推送每个 chunk
    full_reply = ""
    try:
        for chunk in result['stream']:
            full_reply += chunk
            eel.update_tutor_stream(chunk)()
    except Exception as e:
        full_reply += f"\n\n[生成中断: {str(e)}]"

    # 保存完整 AI 回复到数据库
    import json
    sources_json = json.dumps(sources, ensure_ascii=False)
    chat_repo.add_message(session_id, 'assistant', full_reply, sources_json)
    chat_repo.touch_session(session_id)

    # 通知前端流式结束
    eel.end_tutor_stream()()

    return {"success": True}


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


# ========== Quiz & Review ==========

@eel.expose
def api_generate_quizzes(course_id, lecture_id=None):
    """从课程内容生成测验题"""
    from services.quiz_service import generate_quizzes
    err = _require_llm_key()
    if err:
        return {"success": False, "error": err}
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    lid = _parse_id(lecture_id, "课堂记录 ID") if lecture_id else None
    if lecture_id and lid is None:
        return {"success": False, "error": "无效的课堂记录 ID"}
    return generate_quizzes(cid, lid)


@eel.expose
def api_get_quizzes(course_id):
    """获取某课程的测验题列表"""
    quizzes = quiz_repo.get_quizzes_by_course(course_id)
    import json
    result = []
    for q in quizzes:
        options = json.loads(q['options']) if q['options'] else None
        result.append({
            "id": q['id'],
            "question": q['question'],
            "options": options,
            "answer": q['answer'],
            "explanation": q.get('explanation', ''),
            "difficulty": q.get('difficulty', 'medium'),
            "lecture_id": q.get('lecture_id'),
            "created_at": q['created_at']
        })
    return {"success": True, "quizzes": result}


@eel.expose
def api_get_due_reviews(course_id=None):
    """获取今日待复习的题目"""
    cid = _parse_id(course_id, "课程 ID") if course_id else None
    if course_id and cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    import json
    reviews = quiz_repo.get_due_reviews(cid)
    result = []
    for r in reviews:
        options = json.loads(r['options']) if r['options'] else None
        result.append({
            "review_id": r['id'],
            "quiz_id": r['quiz_id'],
            "question": r['question'],
            "options": options,
            "answer": r['answer'],
            "explanation": r.get('explanation', ''),
            "difficulty": r.get('difficulty', 'medium')
        })
    return {"success": True, "reviews": result}


@eel.expose
def api_submit_review(review_id, quality):
    """提交答题结果，更新 SM-2 复习计划"""
    result = quiz_repo.update_review(int(review_id), int(quality))
    if result:
        return {"success": True, "review": result}
    return {"success": False, "error": "复习记录不存在"}


@eel.expose
def api_get_review_stats(course_id=None):
    """获取复习统计"""
    cid = _parse_id(course_id, "课程 ID") if course_id else None
    if course_id and cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    stats = quiz_repo.get_review_stats(cid)
    return {"success": True, "stats": stats}


@eel.expose
def api_delete_quiz(quiz_id):
    """删除测验题"""
    qid = _parse_id(quiz_id, "测验 ID")
    if qid is None:
        return {"success": False, "error": "无效的测验 ID"}
    quiz_repo.delete_quiz(qid)
    return {"success": True}


# ========== Knowledge Points ==========

@eel.expose
def api_extract_knowledge_points(course_id):
    """从课程笔记提取知识点图谱"""
    from services.knowledge_service import extract_knowledge_points
    err = _require_llm_key()
    if err:
        return {"success": False, "error": err}
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    return extract_knowledge_points(cid)


@eel.expose
def api_get_knowledge_points(course_id):
    """获取某课程的知识点列表（含掌握度）"""
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    import json
    points = knowledge_repo.get_all_mastery(cid)
    # 获取依赖关系
    for p in points:
        deps = knowledge_repo.get_dependencies(p['id'])
        p['dependencies'] = [d['depends_on_id'] for d in deps]
    return {"success": True, "points": points}


@eel.expose
def api_get_weak_points(course_id):
    """获取薄弱知识点"""
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    weak = knowledge_repo.get_weak_points(cid)
    return {"success": True, "weak_points": weak}


@eel.expose
def api_link_quizzes_to_knowledge(course_id):
    """将课程下所有测验题关联到知识点"""
    from services.knowledge_service import link_quiz_to_knowledge
    err = _require_llm_key()
    if err:
        return {"success": False, "error": err}
    cid = _parse_id(course_id, "课程 ID")
    if cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    quizzes = quiz_repo.get_quizzes_by_course(cid)
    linked = 0
    for q in quizzes:
        result = link_quiz_to_knowledge(q['id'], cid)
        if result.get('success'):
            linked += result.get('linked', 0)
    return {"success": True, "linked": linked, "total": len(quizzes)}


# ========== Knowledge Search & Reindex ==========

def _doc_size_mb(doc):
    import os
    try:
        p = doc.get('file_path') or ''
        if p:
            return round(os.path.getsize(p) / (1024 * 1024), 2)
    except Exception:
        pass
    return 0


@eel.expose
def api_search_documents(course_id, query):
    """知识库搜索：文件名匹配 + RAG 语义检索。course_id 为空表示全部课程"""
    from services.rag_service import retrieve_with_metadata
    cid = _parse_id(course_id, "课程 ID") if course_id else None
    if course_id and cid is None:
        return {"success": False, "error": "无效的课程 ID"}
    q = (query or '').strip()
    docs = document_repo.get_meta_with_path_by_course(cid) if course_id else document_repo.get_all_meta_with_path()
    results = []
    for d in docs:
        match = 'none'
        if q and q.lower() in (d.get('filename') or '').lower():
            match = 'filename'
        results.append({
            'id': d['id'], 'course_id': d['course_id'], 'filename': d['filename'],
            'file_type': d['file_type'], 'chunk_count': d['chunk_count'],
            'created_at': d['created_at'], 'size_mb': _doc_size_mb(d),
            'match': match, 'snippets': []
        })
    if q and len(q) >= 2:
        try:
            indexed_ids = [d['id'] for d in docs if (d.get('chunk_count') or 0) > 0]
            if indexed_ids:
                res = retrieve_with_metadata(indexed_ids, q, top_k=8)
                for s in res.get('sources', []):
                    src = s.get('source')
                    for r in results:
                        if r['filename'] == src:
                            r['match'] = 'semantic'
                            snip = (s.get('text') or '')[:100]
                            if snip and snip not in r['snippets']:
                                r['snippets'].append(snip)
                            break
        except Exception as e:
            print(f"知识库语义检索失败: {e}")
    rank = {'semantic': 0, 'filename': 1, 'none': 2}
    results.sort(key=lambda x: (rank.get(x['match'], 2), x['created_at']))
    return {"success": True, "results": results, "query": q}


@eel.expose
def api_reindex_document(doc_id):
    """重新索引文档：重新提取文本 + 重建向量"""
    from services.document_service import extract_structured
    did = _parse_id(doc_id, "文档 ID")
    if did is None:
        return {"success": False, "error": "无效的文档 ID"}
    doc = document_repo.get_by_id(did)
    if not doc:
        return {"success": False, "error": "文档不存在"}
    try:
        sections = extract_structured(doc['file_path'], doc['file_type'], doc['filename'])
        with _get_index_lock(doc['id']):
            chunk_count = index_document(doc['id'], sections)
            document_repo.update_chunk_count(doc['id'], chunk_count)
        return {"success": True, "chunk_count": chunk_count}
    except Exception as e:
        import traceback
        print(f"[index] doc#{doc['id']} reindex failed: {e}", flush=True)
        traceback.print_exc()
        return {"success": False, "error": str(e)}


if __name__ == '__main__':
    eel.start('index.html', size=(1440, 900), port=8080)
