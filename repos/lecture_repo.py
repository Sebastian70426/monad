from db import query, query_one, execute


def create(course_id, title, audio_path, transcript):
    """创建课堂记录，返回新记录 ID"""
    return execute(
        "INSERT INTO lectures (course_id, title, audio_path, transcript) VALUES (?, ?, ?, ?)",
        (course_id, title, audio_path, transcript)
    )


def get_by_id(lecture_id):
    """根据 ID 获取课堂记录，返回 dict | None"""
    return query_one("SELECT * FROM lectures WHERE id = ?", (lecture_id,))


def get_by_course(course_id):
    """获取某课程下所有课堂记录（含 has_note 标志），按创建时间倒序"""
    return query(
        "SELECT id, course_id, title, audio_path, created_at, "
        "CASE WHEN note IS NOT NULL THEN 1 ELSE 0 END AS has_note "
        "FROM lectures WHERE course_id = ? ORDER BY created_at DESC",
        (course_id,)
    )


def update_note(lecture_id, note):
    """更新课堂笔记"""
    execute("UPDATE lectures SET note = ? WHERE id = ?", (note, lecture_id))
    return True


def delete_by_course(course_id):
    """删除某课程下所有课堂记录（级联删除用）"""
    execute("DELETE FROM lectures WHERE course_id = ?", (course_id,))
    return True
