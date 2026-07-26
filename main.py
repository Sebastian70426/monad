import eel
import tkinter as tk
from tkinter import filedialog
import os
from openai import OpenAI
from db import init_db

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

def generate_note(transcript, course_name, api_key):
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    system_prompt = f"""你是一位资深大学助教，擅长将课堂录音整理成结构清晰的学习笔记。

请根据以下课堂转录文字，为 {course_name} 这门课生成一份学习笔记：

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

要求：严格基于转录文字，不编造内容，使用中文，公式用纯文本如 F = m * a。"""
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


# ========== 文件处理 ==========

@eel.expose
def api_copy_audio(file_path, course_id):
    from utils.file_utils import copy_to_data_dir
    dest = copy_to_data_dir(file_path, course_id)
    return {"success": True, "path": dest}


# ========== AI 处理 ==========

@eel.expose
def api_transcribe_audio(audio_path, course_id):
    """转录音频，创建课堂记录并保存转录文本，返回 lecture_id"""
    from db import execute, query_one
    import time

    try:
        transcript = transcribe(audio_path)

        # 用时间戳作为课堂标题
        title = time.strftime("%Y-%m-%d %H:%M 课堂录音")

        # 创建 lecture 记录并保存 transcript
        lecture_id = execute(
            "INSERT INTO lectures (course_id, title, audio_path, transcript) VALUES (?, ?, ?, ?)",
            (course_id, title, audio_path, transcript)
        )

        return {"success": True, "transcript": transcript, "lecture_id": lecture_id}
    except Exception as e:
        return {"success": False, "error": str(e)}


@eel.expose
def api_generate_note(lecture_id):
    """为指定课堂记录生成笔记并保存"""
    from db import query_one, execute

    lecture = query_one("SELECT * FROM lectures WHERE id = ?", (lecture_id,))
    if not lecture:
        return {"success": False, "error": "课堂记录不存在"}

    course = query_one("SELECT name FROM courses WHERE id = ?", (lecture['course_id'],))
    if not course:
        return {"success": False, "error": "课程不存在"}

    api_key = query_one("SELECT value FROM settings WHERE key='deepseek_key'")
    if not api_key or not api_key['value']:
        return {"success": False, "error": "请先在设置页配置 DeepSeek API Key"}

    try:
        note = generate_note(lecture['transcript'], course['name'], api_key['value'])

        # 保存笔记到数据库
        execute("UPDATE lectures SET note = ? WHERE id = ?", (note, lecture_id))

        return {"success": True, "note": note}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== 课堂记录查询 ==========

@eel.expose
def api_get_lectures(course_id):
    """获取某课程下所有课堂记录"""
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
    """获取单条课堂记录的完整信息（含转录和笔记）"""
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


if __name__ == '__main__':
    eel.start('index.html', size=(1100, 750), port=8080)