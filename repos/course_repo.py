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


def get_all():
    """获取所有课程，按创建时间倒序"""
    return query("SELECT * FROM courses ORDER BY created_at DESC")


def delete(course_id):
    """删除课程（仅删 courses 表，关联数据由调用方处理）"""
    execute("DELETE FROM courses WHERE id = ?", (course_id,))
    return True
