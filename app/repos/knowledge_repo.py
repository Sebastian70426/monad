from db import query, query_one, execute


# ========== Knowledge Points ==========

def create_point(course_id, name, description=None, parent_id=None):
    """创建知识点，返回 ID"""
    return execute(
        "INSERT INTO knowledge_points (course_id, name, description, parent_id) VALUES (?, ?, ?, ?)",
        (course_id, name, description, parent_id)
    )


def get_point_by_id(point_id):
    """根据 ID 获取知识点"""
    return query_one("SELECT * FROM knowledge_points WHERE id = ?", (point_id,))


def get_points_by_course(course_id):
    """获取某课程的所有知识点"""
    return query(
        "SELECT * FROM knowledge_points WHERE course_id = ? ORDER BY created_at ASC",
        (course_id,)
    )


def delete_point(point_id):
    """删除知识点及其关联"""
    execute("DELETE FROM knowledge_dependencies WHERE point_id = ? OR depends_on_id = ?", (point_id, point_id))
    execute("DELETE FROM quiz_knowledge_points WHERE point_id = ?", (point_id,))
    execute("DELETE FROM knowledge_mastery WHERE point_id = ?", (point_id,))
    execute("DELETE FROM knowledge_points WHERE id = ?", (point_id,))
    return True


def clear_course_points(course_id):
    """清除某课程的所有知识点（重新提取时用）"""
    points = get_points_by_course(course_id)
    for p in points:
        delete_point(p['id'])
    return True


# ========== Dependencies ==========

def add_dependency(point_id, depends_on_id):
    """添加前置依赖关系"""
    return execute(
        "INSERT OR IGNORE INTO knowledge_dependencies (point_id, depends_on_id) VALUES (?, ?)",
        (point_id, depends_on_id)
    )


def get_dependencies(point_id):
    """获取某知识点的前置依赖"""
    return query(
        "SELECT depends_on_id FROM knowledge_dependencies WHERE point_id = ?",
        (point_id,)
    )


# ========== Quiz-Knowledge Link ==========

def link_quiz(quiz_id, point_id):
    """关联测验题和知识点"""
    return execute(
        "INSERT OR IGNORE INTO quiz_knowledge_points (quiz_id, point_id) VALUES (?, ?)",
        (quiz_id, point_id)
    )


def get_points_by_quiz(quiz_id):
    """获取某道测验题关联的知识点"""
    return query(
        "SELECT kp.* FROM knowledge_points kp "
        "JOIN quiz_knowledge_points qkp ON kp.id = qkp.point_id "
        "WHERE qkp.quiz_id = ?",
        (quiz_id,)
    )


# ========== Mastery (掌握度追踪) ==========

def get_mastery(point_id):
    """获取某知识点的掌握度"""
    return query_one("SELECT * FROM knowledge_mastery WHERE point_id = ?", (point_id,))


def update_mastery(point_id, is_correct):
    """更新知识点掌握度（简化版 BKT）

    答对: mastery +0.15 (上限 1.0)
    答错: mastery -0.25 (下限 0.0)
    """
    row = get_mastery(point_id)
    if not row:
        execute(
            "INSERT INTO knowledge_mastery (point_id, mastery_level, total_reviews, correct_reviews, last_updated) "
            "VALUES (?, ?, 1, ?, datetime('now','localtime'))",
            (point_id, 0.15 if is_correct else 0.0, 1 if is_correct else 0)
        )
    else:
        new_level = row['mastery_level'] + (0.15 if is_correct else -0.25)
        new_level = max(0.0, min(1.0, new_level))
        execute(
            "UPDATE knowledge_mastery SET mastery_level = ?, total_reviews = total_reviews + 1, "
            "correct_reviews = correct_reviews + ?, last_updated = datetime('now','localtime') "
            "WHERE point_id = ?",
            (new_level, 1 if is_correct else 0, point_id)
        )

    return get_mastery(point_id)


def get_all_mastery(course_id):
    """获取某课程所有知识点的掌握度"""
    return query(
        "SELECT kp.id, kp.name, kp.description, "
        "COALESCE(km.mastery_level, 0.0) as mastery_level, "
        "COALESCE(km.total_reviews, 0) as total_reviews, "
        "COALESCE(km.correct_reviews, 0) as correct_reviews, "
        "km.last_updated "
        "FROM knowledge_points kp "
        "LEFT JOIN knowledge_mastery km ON kp.id = km.point_id "
        "WHERE kp.course_id = ? "
        "ORDER BY kp.created_at ASC",
        (course_id,)
    )


def get_weak_points(course_id, threshold=0.4):
    """获取薄弱知识点（mastery < threshold）"""
    all_mastery = get_all_mastery(course_id)
    return [m for m in all_mastery if m['mastery_level'] < threshold]
