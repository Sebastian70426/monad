"""
艾宾浩斯遗忘曲线模型

核心公式: R = e^(-t / S)

R = 记忆保留度 (0~1, 1=完全记住, 0=完全遗忘)
t = 距上次复习的时间 (天)
S = 记忆强度 (越大越不容易忘)

记忆强度更新规则:
  quality >= 4 (轻松答对): S *= 2.0
  quality == 3 (勉强答对): S *= 1.2
  quality < 3  (答错):     S *= 0.3 (重置)

复习触发阈值: R < 0.7 时建议立即复习
"""
import math
import logging
from datetime import datetime
from repos import quiz_repo
from db import query, execute

logger = logging.getLogger(__name__)

# 默认参数
DEFAULT_STRENGTH = 1.0       # 初始记忆强度
REVIEW_THRESHOLD = 0.7       # 保留度低于此值时建议复习
MAX_STRENGTH = 60.0          # 记忆强度上限（约2个月后仍保留70%+）

# 艾宾浩斯经典复习节点（天）
CLASSIC_INTERVALS = [1, 2, 4, 7, 15, 30]


def calculate_retention(memory_strength, days_since_review):
    """计算当前记忆保留度 R = e^(-t/S)"""
    if memory_strength <= 0:
        return 0.0
    return math.exp(-days_since_review / memory_strength)


def get_days_since(last_review_str):
    """计算距上次复习的天数"""
    if not last_review_str:
        return 999  # 从未复习
    try:
        last = datetime.strptime(last_review_str[:19], '%Y-%m-%d %H:%M:%S')
        now = datetime.now()
        delta = (now - last).total_seconds() / 86400  # 转为天
        return max(0.0, delta)
    except Exception:
        return 999


def update_memory_strength(current_strength, quality):
    """根据答题质量更新记忆强度"""
    if quality >= 4:
        new_strength = current_strength * 2.0
    elif quality == 3:
        new_strength = current_strength * 1.2
    else:
        new_strength = current_strength * 0.3
        if new_strength < 0.5:
            new_strength = 0.5  # 最低保留一点

    return min(new_strength, MAX_STRENGTH)


def predict_optimal_interval(memory_strength, threshold=REVIEW_THRESHOLD):
    """预测最佳复习间隔（当 R 降到 threshold 时的天数）

    R = e^(-t/S) = threshold
    => -t/S = ln(threshold)
    => t = -S * ln(threshold)
    """
    return -memory_strength * math.log(threshold)


def get_review_with_curve(review_id):
    """获取某条复习记录的遗忘曲线数据"""
    review = quiz_repo.get_review_by_id(review_id)
    if not review:
        return None

    # 从 review_logs 获取最新的 memory_strength
    logs = query(
        "SELECT memory_strength, retention_before, retention_after, reviewed_at "
        "FROM review_logs WHERE review_id = ? ORDER BY reviewed_at DESC LIMIT 1",
        (review_id,)
    )

    if logs:
        strength = logs[0]['memory_strength'] or DEFAULT_STRENGTH
    else:
        strength = DEFAULT_STRENGTH

    days = get_days_since(review.get('last_review'))
    current_retention = calculate_retention(strength, days)
    optimal_interval = predict_optimal_interval(strength)

    return {
        "review_id": review_id,
        "quiz_id": review['quiz_id'],
        "memory_strength": round(strength, 2),
        "days_since_review": round(days, 1),
        "current_retention": round(current_retention, 4),
        "optimal_interval_days": round(optimal_interval, 1),
        "needs_review": current_retention < REVIEW_THRESHOLD,
        "next_review": review.get('next_review'),
        "last_review": review.get('last_review')
    }


def get_all_curves(course_id=None):
    """获取所有复习记录的遗忘曲线数据"""
    today = datetime.now().strftime('%Y-%m-%d')
    if course_id:
        reviews = query(
            "SELECT r.id, r.quiz_id, r.next_review, r.last_review, "
            "q.course_id, q.question, q.answer, q.options, q.difficulty "
            "FROM reviews r JOIN quizzes q ON r.quiz_id = q.id "
            "WHERE q.course_id = ?",
            (course_id,)
        )
    else:
        reviews = query(
            "SELECT r.id, r.quiz_id, r.next_review, r.last_review, "
            "q.course_id, q.question, q.answer, q.options, q.difficulty "
            "FROM reviews r JOIN quizzes q ON r.quiz_id = q.id"
        )

    results = []
    for r in reviews:
        curve = get_review_with_curve(r['id'])
        if curve:
            curve['question'] = r['question']
            curve['difficulty'] = r.get('difficulty', 'medium')
            results.append(curve)

    # 按保留度升序（最该复习的排前面）
    results.sort(key=lambda x: x['current_retention'])
    return results


def get_curve_chart_data(review_id):
    """生成遗忘曲线图表数据（用于前端可视化）

    返回: [{"day": 0, "retention": 1.0}, {"day": 1, "retention": 0.85}, ...]
    """
    curve = get_review_with_curve(review_id)
    if not curve:
        return []

    strength = curve['memory_strength']
    if strength <= 0:
        return []

    # 生成 0~30 天的曲线数据
    chart_data = []
    for day in range(31):
        r = calculate_retention(strength, day)
        chart_data.append({
            "day": day,
            "retention": round(r, 4),
            "is_threshold": r < REVIEW_THRESHOLD,
            "is_today": abs(day - curve['days_since_review']) < 0.5
        })

    return {
        "chart_data": chart_data,
        "current_day": round(curve['days_since_review'], 1),
        "current_retention": curve['current_retention'],
        "memory_strength": strength,
        "optimal_interval": curve['optimal_interval_days']
    }


def log_review(review_id, quality, retention_before):
    """记录复习日志（含记忆强度变化）"""
    # 获取当前记忆强度
    logs = query(
        "SELECT memory_strength FROM review_logs WHERE review_id = ? ORDER BY reviewed_at DESC LIMIT 1",
        (review_id,)
    )
    old_strength = logs[0]['memory_strength'] if logs else DEFAULT_STRENGTH
    new_strength = update_memory_strength(old_strength, quality)
    retention_after = calculate_retention(new_strength, 0)  # 刚复习完，t=0

    execute(
        "INSERT INTO review_logs (review_id, quality, retention_before, retention_after, memory_strength) "
        "VALUES (?, ?, ?, ?, ?)",
        (review_id, quality, retention_before, retention_after, new_strength)
    )

    return {
        "old_strength": round(old_strength, 2),
        "new_strength": round(new_strength, 2),
        "retention_before": round(retention_before, 4),
        "retention_after": round(retention_after, 4)
    }


def get_course_stats(course_id=None):
    """获取课程级别的遗忘曲线统计"""
    curves = get_all_curves(course_id)
    if not curves:
        return {
            "total": 0,
            "avg_retention": 0,
            "needs_review": 0,
            "mastered": 0,
            "avg_strength": 0
        }

    total = len(curves)
    needs_review = sum(1 for c in curves if c['needs_review'])
    mastered = sum(1 for c in curves if c['current_retention'] >= 0.85)
    avg_retention = sum(c['current_retention'] for c in curves) / total
    avg_strength = sum(c['memory_strength'] for c in curves) / total

    return {
        "total": total,
        "avg_retention": round(avg_retention, 4),
        "needs_review": needs_review,
        "mastered": mastered,
        "avg_strength": round(avg_strength, 2)
    }


def get_classic_schedule():
    """返回艾宾浩斯经典复习节点"""
    return [
        {"day": 1, "label": "第1天", "retention": round(calculate_retention(DEFAULT_STRENGTH, 1), 4)},
        {"day": 2, "label": "第2天", "retention": round(calculate_retention(DEFAULT_STRENGTH, 2), 4)},
        {"day": 4, "label": "第4天", "retention": round(calculate_retention(DEFAULT_STRENGTH, 4), 4)},
        {"day": 7, "label": "第7天", "retention": round(calculate_retention(DEFAULT_STRENGTH, 7), 4)},
        {"day": 15, "label": "第15天", "retention": round(calculate_retention(DEFAULT_STRENGTH, 15), 4)},
        {"day": 30, "label": "第30天", "retention": round(calculate_retention(DEFAULT_STRENGTH, 30), 4)},
    ]
