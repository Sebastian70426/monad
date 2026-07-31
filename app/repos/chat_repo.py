from db import query, query_one, execute


# ========== chat_sessions ==========

def create_session(course_id=None, lecture_id=None):
    """创建对话会话，返回新会话 ID"""
    return execute(
        "INSERT INTO chat_sessions (course_id, lecture_id) VALUES (?, ?)",
        (course_id, lecture_id)
    )


def get_session_by_id(session_id):
    """根据 ID 获取会话，返回 dict | None"""
    return query_one("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))


def get_sessions_by_course(course_id):
    """获取某课程下所有会话，按更新时间倒序"""
    return query(
        "SELECT * FROM chat_sessions WHERE course_id = ? ORDER BY updated_at DESC",
        (course_id,)
    )


def get_recent_sessions(limit=20):
    """获取最近 N 个会话，按更新时间倒序"""
    return query(
        "SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT ?",
        (limit,)
    )


def touch_session(session_id):
    """更新会话的 updated_at 时间戳"""
    execute(
        "UPDATE chat_sessions SET updated_at = datetime('now','localtime') WHERE id = ?",
        (session_id,)
    )
    return True


def delete_session(session_id):
    """删除会话及其所有消息"""
    execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    return True


# ========== chat_messages ==========

def add_message(session_id, role, content, sources=None):
    """添加一条对话消息，返回新消息 ID"""
    return execute(
        "INSERT INTO chat_messages (session_id, role, content, sources) VALUES (?, ?, ?, ?)",
        (session_id, role, content, sources)
    )


def get_messages(session_id):
    """获取某会话的所有消息，按时间正序"""
    return query(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
        (session_id,)
    )


def get_recent_history(session_id, n=6):
    """获取最近 N 条消息（用于 LLM 上下文），按时间正序返回"""
    rows = query(
        "SELECT role, content FROM chat_messages "
        "WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
        (session_id, n)
    )
    rows.reverse()
    return rows
