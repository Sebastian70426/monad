import json
import logging
from services.llm_client import get_llm_client
from repos import quiz_repo, course_repo, lecture_repo, document_repo
from services.rag_service import retrieve_context

logger = logging.getLogger(__name__)

QUIZ_PROMPT = """你是一位大学考试出题专家。请根据以下课程内容,生成 5 道测验题。

要求:
1. 题型:3 道选择题 + 2 道填空题
2. 难度分布:2 道简单 + 2 道中等 + 1 道困难
3. 选择题必须有 4 个选项(A/B/C/D),只有 1 个正确答案
4. 每道题都要有简短的解释说明
5. 题目必须严格基于提供的内容,不要编造
6. 专业术语请提供中英文对照

请以 JSON 数组格式返回,不要包含任何其他文字。格式如下:
[
  {
    "type": "choice",
    "question": "题目内容",
    "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
    "answer": "A",
    "explanation": "解释说明",
    "difficulty": "easy"
  },
  {
    "type": "fill_blank",
    "question": "_____ 是描述物体运动状态变化率的物理量",
    "answer": "加速度",
    "explanation": "加速度 (Acceleration) 是速度变化率",
    "difficulty": "medium"
  }
]

课程内容:
"""


def generate_quizzes(course_id, lecture_id=None):
    """从笔记/文档内容生成测验题

    参数:
        course_id: 课程 ID
        lecture_id: 课堂记录 ID（可选，指定则从该课堂笔记生成）

    返回:
        {"success": True, "quizzes": [...], "count": N}
    """
    # 收集内容
    content = _gather_content(course_id, lecture_id)
    if not content or len(content.strip()) < 50:
        return {"success": False, "error": "课程内容不足,无法生成测验题"}

    # 调用 LLM
    try:
        raw = _call_llm(content)
        quizzes = _parse_quizzes(raw)
    except Exception as e:
        logger.warning(f"LLM 生成测验题失败: {e}", exc_info=True)
        return {"success": False, "error": f"生成失败: {str(e)}"}

    if not quizzes:
        return {"success": False, "error": "未能解析出有效测验题"}

    # 存入数据库
    saved = []
    for q in quizzes:
        if q.get('type') == 'choice':
            options_list = [q['options'].get(k, '') for k in ['A', 'B', 'C', 'D']]
            quiz_id = quiz_repo.create_quiz(
                course_id=course_id,
                lecture_id=lecture_id,
                question=q['question'],
                options=options_list,
                answer=q['answer'],
                explanation=q.get('explanation', ''),
                difficulty=q.get('difficulty', 'medium')
            )
        else:
            quiz_id = quiz_repo.create_quiz(
                course_id=course_id,
                lecture_id=lecture_id,
                question=q['question'],
                options=None,
                answer=q['answer'],
                explanation=q.get('explanation', ''),
                difficulty=q.get('difficulty', 'medium')
            )

        # 创建初始复习记录
        quiz_repo.create_review(quiz_id, quality=3)

        saved.append({
            "id": quiz_id,
            "type": q.get('type'),
            "question": q['question'],
            "difficulty": q.get('difficulty', 'medium')
        })

    return {"success": True, "quizzes": saved, "count": len(saved)}


def _gather_content(course_id, lecture_id=None):
    """收集课程内容（笔记 + RAG 文档）"""
    parts = []

    if lecture_id:
        lecture = lecture_repo.get_by_id(lecture_id)
        if lecture and lecture.get('note'):
            parts.append(f"【课堂笔记】\n{lecture['note']}")
        if lecture and lecture.get('transcript'):
            transcript = lecture['transcript'][:2000]
            parts.append(f"【转录文字（节选）】\n{transcript}")
    else:
        # 取该课程最近的几条课堂笔记
        lectures = lecture_repo.get_by_course(course_id)
        for lec in lectures[:3]:
            if lec.get('has_note'):
                full = lecture_repo.get_by_id(lec['id'])
                if full and full.get('note'):
                    parts.append(f"【课堂笔记: {lec['title']}】\n{full['note']}")

    # RAG 检索补充内容
    doc_ids = document_repo.get_ids_with_chunks(course_id)
    if doc_ids:
        try:
            query_text = "课程核心知识点 重要概念 公式 定义"
            rag_context = retrieve_context(doc_ids, query_text)
            if rag_context:
                parts.append(f"【教材参考内容】\n{rag_context}")
        except Exception:
            pass

    return "\n\n".join(parts) if parts else ""


def _call_llm(content):
    """调用当前配置的模型提供商生成测验题"""
    client = get_llm_client()
    return client.chat(
        messages=[
            {"role": "system", "content": QUIZ_PROMPT},
            {"role": "user", "content": content}
        ],
        temperature=0.7,
        max_tokens=2000
    )


def _parse_quizzes(raw_text):
    """解析 LLM 返回的 JSON 测验题"""
    # 尝试提取 JSON 数组
    text = raw_text.strip()

    # 去掉可能的 markdown 代码块标记
    if text.startswith('```'):
        lines = text.split('\n')
        start = 1
        end = len(lines) - 1
        for i in range(1, len(lines)):
            if lines[i].strip() == '```':
                end = i
                break
        text = '\n'.join(lines[start:end])

    # 尝试找到 JSON 数组的起始和结束
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1:
        return []

    json_str = text[start:end + 1]

    try:
        quizzes = json.loads(json_str)
    except json.JSONDecodeError:
        return []

    # 验证每道题
    valid = []
    for q in quizzes:
        if not isinstance(q, dict):
            continue
        if not q.get('question') or not q.get('answer'):
            continue
        if q.get('type') == 'choice':
            if not q.get('options'):
                continue
        valid.append(q)

    return valid
