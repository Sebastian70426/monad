from db import query, query_one, execute
from datetime import datetime, timedelta


# ========== Quiz ==========

def create_quiz(course_id, question, answer, options=None, explanation=None,
                difficulty='medium', lecture_id=None):
    """创建一道测验题，返回 quiz ID"""
    import json
    options_json = json.dumps(options, ensure_ascii=False) if options else None
    return execute(
        "INSERT INTO quizzes (course_id, lecture_id, question, options, answer, explanation, difficulty) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (course_id, lecture_id, question, options_json, answer, explanation, difficulty)
    )


def get_quiz_by_id(quiz_id):
    """根据 ID 获取测验题"""
    return query_one("SELECT * FROM quizzes WHERE id = ?", (quiz_id,))


def get_quizzes_by_course(course_id, limit=50):
    """获取某课程的测验题列表"""
    return query(
        "SELECT * FROM quizzes WHERE course_id = ? ORDER BY created_at DESC LIMIT ?",
        (course_id, limit)
    )


def get_quizzes_by_lecture(lecture_id):
    """获取某课堂记录的测验题"""
    return query(
        "SELECT * FROM quizzes WHERE lecture_id = ? ORDER BY created_at DESC",
        (lecture_id,)
    )


def delete_quiz(quiz_id):
    """删除测验题"""
    execute("DELETE FROM reviews WHERE quiz_id = ?", (quiz_id,))
    execute("DELETE FROM quizzes WHERE id = ?", (quiz_id,))
    return True


# ========== Review (SM-2 间隔重复) ==========

def create_review(quiz_id, quality, ease_factor=2.5, interval=1, repetitions=0):
    """创建复习记录。首次创建 next_review=今天，立即可复习"""
    today = datetime.now().strftime('%Y-%m-%d')
    return execute(
        "INSERT INTO reviews (quiz_id, quality, ease_factor, interval, repetitions, next_review, last_review) "
        "VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))",
        (quiz_id, quality, ease_factor, interval, repetitions, today)
    )


def update_review(review_id, quality):
    """更新复习记录（SM-2 算法）"""
    review = get_review_by_id(review_id)
    if not review:
        return None

    ef = review['ease_factor']
    interval = review['interval']
    reps = review['repetitions']

    # SM-2 算法
    if quality < 3:
        reps = 0
        interval = 1
    else:
        reps = reps + 1
        if reps == 1:
            interval = 1
        elif reps == 2:
            interval = 6
        else:
            interval = round(interval * ef)

    # 更新 ease_factor (最低 1.3)
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ef < 1.3:
        ef = 1.3

    next_review = (datetime.now() + timedelta(days=interval)).strftime('%Y-%m-%d')

    execute(
        "UPDATE reviews SET quality = ?, ease_factor = ?, interval = ?, "
        "repetitions = ?, next_review = ?, last_review = datetime('now','localtime') "
        "WHERE id = ?",
        (quality, ef, interval, reps, next_review, review_id)
    )

    return {
        "review_id": review_id,
        "ease_factor": ef,
        "interval": interval,
        "repetitions": reps,
        "next_review": next_review
    }


def get_review_by_id(review_id):
    """根据 ID 获取复习记录"""
    return query_one("SELECT * FROM reviews WHERE id = ?", (review_id,))


def get_review_by_quiz(quiz_id):
    """根据 quiz_id 获取复习记录"""
    return query_one("SELECT * FROM reviews WHERE quiz_id = ?", (quiz_id,))


def get_due_reviews(course_id=None, limit=20):
    """获取今日待复习的题目"""
    today = datetime.now().strftime('%Y-%m-%d')
    if course_id:
        return query(
            "SELECT r.*, q.course_id, q.lecture_id, q.question, q.options, q.answer, q.explanation, q.difficulty "
            "FROM reviews r "
            "JOIN quizzes q ON r.quiz_id = q.id "
            "WHERE q.course_id = ? AND r.next_review <= ? "
            "ORDER BY r.next_review ASC LIMIT ?",
            (course_id, today, limit)
        )
    else:
        return query(
            "SELECT r.*, q.course_id, q.lecture_id, q.question, q.options, q.answer, q.explanation, q.difficulty "
            "FROM reviews r "
            "JOIN quizzes q ON r.quiz_id = q.id "
            "WHERE r.next_review <= ? "
            "ORDER BY r.next_review ASC LIMIT ?",
            (today, limit)
        )


def get_review_stats(course_id=None):
    """获取复习统计数据"""
    today = datetime.now().strftime('%Y-%m-%d')
    if course_id:
        due = query_one(
            "SELECT COUNT(*) as count FROM reviews r "
            "JOIN quizzes q ON r.quiz_id = q.id "
            "WHERE q.course_id = ? AND r.next_review <= ?",
            (course_id, today)
        )
        total = query_one(
            "SELECT COUNT(*) as count FROM reviews r "
            "JOIN quizzes q ON r.quiz_id = q.id "
            "WHERE q.course_id = ?",
            (course_id,)
        )
    else:
        due = query_one(
            "SELECT COUNT(*) as count FROM reviews r "
            "WHERE r.next_review <= ?",
            (today,)
        )
        total = query_one("SELECT COUNT(*) as count FROM reviews")

    return {
        "due_today": due['count'] if due else 0,
        "total": total['count'] if total else 0
    }


def _calculate_next_review(quality, ease_factor, interval, repetitions):
    """计算下次复习日期（首次创建时）"""
    if quality < 3:
        reps = 0
        interval = 1
    else:
        reps = repetitions + 1
        if reps == 1:
            interval = 1
        elif reps == 2:
            interval = 6
        else:
            interval = round(interval * ease_factor)

    return (datetime.now() + timedelta(days=interval)).strftime('%Y-%m-%d')
