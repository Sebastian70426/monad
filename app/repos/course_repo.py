from db import query, query_one, execute


def create(name):
    """创建课程，返回新课程 ID"""
    return execute("INSERT INTO courses (name) VALUES (?)", (name,))


def get_by_id(course_id):
    """根据 ID 获取课程，返回 dict | None"""
    return query_one("SELECT * FROM courses WHERE id = ?", (course_id,))


def get_by_name(name):
    """根据名称获取课程（用于查重），返回 dict | None"""
    return query_one("SELECT id FROM courses WHERE name = ?", (name,))


def get_all(include_archived=False):
    """获取课程列表，默认排除已归档"""
    if include_archived:
        return query("SELECT * FROM courses ORDER BY created_at DESC")
    return query("SELECT * FROM courses WHERE archived = 0 ORDER BY created_at DESC")


def rename(course_id, new_name):
    """重命名课程"""
    execute("UPDATE courses SET name = ? WHERE id = ?", (new_name, course_id))
    return True


def set_archived(course_id, archived=True):
    """归档/取消归档课程"""
    execute("UPDATE courses SET archived = ? WHERE id = ?", (1 if archived else 0, course_id))
    return True
