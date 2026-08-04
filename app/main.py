import eel
import tkinter as tk
from tkinter import filedialog
import os
import time
from openai import OpenAI
from db import init_db
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


def generate_note_with_rag_stream(transcript, course_name, api_key, rag_context=""):
    """流式生成笔记，yield 每个 chunk"""
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
        max_tokens=4000,
        stream=True
    )

    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

# ========== 初始化 ==========

init_db()
import os as _os
eel.init(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'web'))

# 后台任务状态跟踪（内存中，重启丢失）
_bg_tasks = {}

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
    name = (new_name or '').strip()
    if not name:
        return {"success": False, "error": "课程名称不能为空"}
    existing = course_repo.get_by_name(name)
    if existing and existing['id'] != int(course_id):
        return {"success": False, "error": "课程已存在"}
    course_repo.rename(int(course_id), name)
    return {"success": True}


@eel.expose
def api_archive_course(course_id):
    """归档课程（数据保留，从首页隐藏）"""
    course_repo.set_archived(int(course_id), True)
    return {"success": True}


@eel.expose
def api_unarchive_course(course_id):
    """取消归档"""
    course_repo.set_archived(int(course_id), False)
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

    # 1. 清理 ChromaDB 向量集合（独立于 SQL）
    try:
        from services.rag_service import _get_client
        docs = document_repo.get_meta_by_course(course_id)
        client = _get_client()
        for d in docs:
            try:
                client.delete_collection("doc_%d" % d['id'])
            except Exception:
                pass
    except Exception:
        pass

    # 2. SQL 级联删除（单事务：任一失败则整体回滚）
    with get_db() as conn:
        # 对话消息 → 会话
        conn.execute("DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE course_id = ?)", (course_id,))
        conn.execute("DELETE FROM chat_sessions WHERE course_id = ?", (course_id,))
        # 知识点关联 → 依赖 → 掌握度 → 知识点
        conn.execute("DELETE FROM quiz_knowledge_points WHERE point_id IN (SELECT id FROM knowledge_points WHERE course_id = ?)", (course_id,))
        conn.execute("DELETE FROM knowledge_dependencies WHERE point_id IN (SELECT id FROM knowledge_points WHERE course_id = ?) OR depends_on_id IN (SELECT id FROM knowledge_points WHERE course_id = ?)", (course_id, course_id))
        conn.execute("DELETE FROM knowledge_mastery WHERE point_id IN (SELECT id FROM knowledge_points WHERE course_id = ?)", (course_id,))
        conn.execute("DELETE FROM knowledge_points WHERE course_id = ?", (course_id,))
        # 复习记录 → 测验
        conn.execute("DELETE FROM reviews WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = ?)", (course_id,))
        conn.execute("DELETE FROM quizzes WHERE course_id = ?", (course_id,))
        # 课堂记录 / 课程资料
        conn.execute("DELETE FROM lectures WHERE course_id = ?", (course_id,))
        conn.execute("DELETE FROM documents WHERE course_id = ?", (course_id,))
        # 课程本体
        conn.execute("DELETE FROM courses WHERE id = ?", (course_id,))

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
    """解析文档,提取文本,保存到数据库,后台建立向量索引"""
    from services.document_service import extract_structured
    from utils.file_utils import copy_to_data_dir
    import threading

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ['.pdf', '.pptx', '.ppt', '.txt', '.md']:
        return {"success": False, "error": f"不支持的文件格式: {ext}"}

    dest = copy_to_data_dir(file_path, course_id)
    filename = os.path.basename(file_path)

    try:
        sections = extract_structured(dest, ext, filename)
    except Exception as e:
        return {"success": False, "error": f"文本提取失败: {str(e)}"}

    content = "\n\n".join(s["text"] for s in sections)

    if not content or len(content.strip()) < 50:
        return {"success": False, "error": "文件内容过短或无法提取文本(可能是扫描版PDF)"}

    doc_id = document_repo.create(course_id, filename, dest, ext, content)

    # 后台线程建立 RAG 索引
    def _background_index(did, secs):
        try:
            api_key = settings_repo.get('deepseek_key')
            if not api_key:
                eel.update_index_progress(did, "no_key", 0)()
                return
            eel.update_index_progress(did, "indexing", 0)()
            chunk_count = index_document(did, secs)
            document_repo.update_chunk_count(did, chunk_count)
            eel.update_index_progress(did, "done", chunk_count)()
        except Exception as e:
            eel.update_index_progress(did, "error", str(e))()

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

    api_key = settings_repo.get('deepseek_key')
    if not api_key:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}

    doc_ids = document_repo.get_ids_with_chunks(course_id)
    rag_context = ""
    if doc_ids:
        try:
            rag_context = retrieve_context(doc_ids, lecture['transcript'])
        except Exception as e:
            print(f"RAG retrieval failed: {e}")

    eel.start_note_stream()()

    full_note = ""
    try:
        for chunk in generate_note_with_rag_stream(lecture['transcript'], course['name'], api_key, rag_context):
            full_note += chunk
            eel.update_note_stream(chunk)()
    except Exception as e:
        return {"success": False, "error": str(e)}

    lecture_repo.update_note(lecture_id, full_note)
    eel.end_note_stream()()

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
    return settings_repo.get(key, default="")


@eel.expose
def api_save_setting(key, value):
    settings_repo.set(key, value)
    return {"success": True}


@eel.expose
def api_test_key(which, key):
    try:
        if which == 'groq':
            from groq import Groq
            client = Groq(api_key=key)
            client.models.list()
            return {"success": True}
        else:
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

    chat_repo.add_message(session_id, 'user', message)

    from services.tutor_service import tutor_chat_stream
    result = tutor_chat_stream(
        session_id=session_id,
        course_id=session['course_id'],
        lecture_id=session['lecture_id'],
        message=message,
        api_key=api_key
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
    sources_json = str(sources)
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
    api_key = settings_repo.get('deepseek_key')
    if not api_key:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}
    lid = int(lecture_id) if lecture_id else None
    return generate_quizzes(course_id, lid, api_key)


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
    cid = int(course_id) if course_id else None
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
    cid = int(course_id) if course_id else None
    stats = quiz_repo.get_review_stats(cid)
    return {"success": True, "stats": stats}


@eel.expose
def api_delete_quiz(quiz_id):
    """删除测验题"""
    quiz_repo.delete_quiz(int(quiz_id))
    return {"success": True}


# ========== Knowledge Points ==========

@eel.expose
def api_extract_knowledge_points(course_id):
    """从课程笔记提取知识点图谱"""
    from services.knowledge_service import extract_knowledge_points
    api_key = settings_repo.get('deepseek_key')
    if not api_key:
        return {"success": False, "error": "请先配置 DeepSeek API Key"}
    return extract_knowledge_points(int(course_id), api_key)


@eel.expose
def api_get_knowledge_points(course_id):
    """获取某课程的知识点列表（含掌握度）"""
    import json
    points = knowledge_repo.get_all_mastery(int(course_id))
    # 获取依赖关系
    for p in points:
        deps = knowledge_repo.get_dependencies(p['id'])
        p['dependencies'] = [d['depends_on_id'] for d in deps]
    return {"success": True, "points": points}


@eel.expose
def api_get_weak_points(course_id):
    """获取薄弱知识点"""
    weak = knowledge_repo.get_weak_points(int(course_id))
    return {"success": True, "weak_points": weak}


@eel.expose
def api_link_quizzes_to_knowledge(course_id):
    """将课程下所有测验题关联到知识点"""
    from services.knowledge_service import link_quiz_to_knowledge
    api_key = settings_repo.get('deepseek_key')
    if not api_key:
        return {"success": False, "error": "请先配置 DeepSeek API Key"}
    quizzes = quiz_repo.get_quizzes_by_course(int(course_id))
    linked = 0
    for q in quizzes:
        result = link_quiz_to_knowledge(q['id'], int(course_id), api_key)
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
    q = (query or '').strip()
    docs = document_repo.get_meta_with_path_by_course(int(course_id)) if course_id else document_repo.get_all_meta_with_path()
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
    doc = document_repo.get_by_id(int(doc_id))
    if not doc:
        return {"success": False, "error": "文档不存在"}
    try:
        sections = extract_structured(doc['file_path'], doc['file_type'], doc['filename'])
        chunk_count = index_document(doc['id'], sections)
        document_repo.update_chunk_count(doc['id'], chunk_count)
        return {"success": True, "chunk_count": chunk_count}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == '__main__':
    eel.start('index.html', size=(1440, 900), port=8080)
