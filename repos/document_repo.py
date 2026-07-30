from db import query, query_one, execute


def create(course_id, filename, file_path, file_type, content):
    """创建文档记录，返回新文档 ID"""
    return execute(
        "INSERT INTO documents (course_id, filename, file_path, file_type, content) "
        "VALUES (?, ?, ?, ?, ?)",
        (course_id, filename, file_path, file_type, content)
    )


def get_by_id(doc_id):
    """根据 ID 获取文档完整记录（含 content），返回 dict | None"""
    return query_one("SELECT * FROM documents WHERE id = ?", (doc_id,))


def get_meta_by_id(doc_id):
    """根据 ID 获取文档元数据（不含 content 和 file_path），返回 dict | None"""
    return query_one(
        "SELECT id, filename, file_type, chunk_count, created_at "
        "FROM documents WHERE id = ?",
        (doc_id,)
    )


def get_meta_by_course(course_id):
    """获取某课程下所有文档元数据（不含 content），按创建时间倒序"""
    return query(
        "SELECT id, course_id, filename, file_type, chunk_count, created_at "
        "FROM documents WHERE course_id = ? ORDER BY created_at DESC",
        (course_id,)
    )


def update_chunk_count(doc_id, chunk_count):
    """更新文档的向量块数量"""
    execute("UPDATE documents SET chunk_count = ? WHERE id = ?", (chunk_count, doc_id))
    return True


def get_ids_with_chunks(course_id):
    """获取某课程下已建立向量索引的文档 ID 列表"""
    rows = query(
        "SELECT id FROM documents WHERE course_id = ? AND chunk_count > 0",
        (course_id,)
    )
    return [row['id'] for row in rows]


def delete(doc_id):
    """删除文档记录"""
    execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    return True


def delete_by_course(course_id):
    """删除某课程下所有文档（级联删除用）"""
    execute("DELETE FROM documents WHERE course_id = ?", (course_id,))
    return True
