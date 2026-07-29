import os
from openai import OpenAI
from services.rag_service import retrieve_context
from repos import chat_repo, document_repo


def _detect_intent(message, api_key):
    """用 LLM 判断用户问题的意图类型。
    返回: concept_explain | equation_help | exam_question | summarize | general
    """
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    response = client.chat.completions.create(
        model="deepseek-v4-flash",
        messages=[{
            "role": "system",
            "content": """你是一个意图分类器。根据用户的问题,返回以下类型之一:

- concept_explain:用户要求解释一个概念或定义
- equation_help:用户询问公式、计算或推导
- exam_question:用户提出一个考题或要求解题
- summarize:用户要求总结或概括
- general:以上都不符合

只返回类型名称,不要返回任何其他内容。"""
        }, {
            "role": "user",
            "content": message
        }],
        temperature=0,
        max_tokens=20
    )
    intent = response.choices[0].message.content.strip().lower()
    valid = ["concept_explain", "equation_help", "exam_question", "summarize", "general"]
    return intent if intent in valid else "general"


def _load_prompt(intent):
    """根据意图加载对应的 System Prompt 模板"""
    prompt_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'prompts', 'tutor_prompts')
    file_map = {
        "concept_explain": "concept_explain.txt",
        "equation_help": "equation_help.txt",
        "exam_question": "exam_question.txt",
        "summarize": "summarize.txt",
        "general": "general.txt"
    }
    filename = file_map.get(intent, "general.txt")
    filepath = os.path.join(prompt_dir, filename)

    if not os.path.exists(filepath):
        return "你是一位大学课程助教。请根据提供的课程资料回答学生问题。如果资料不足以回答,请明确说明,不要编造。使用中文回答。"

    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def _load_history(session_id, n=6):
    """从 SQLite 加载最近 N 轮对话历史"""
    return chat_repo.get_recent_history(session_id, n)


def _retrieve(course_id, lecture_id, message, api_key):
    """检索相关课程资料"""
    doc_ids = []
    if course_id:
        doc_ids = document_repo.get_ids_with_chunks(course_id)

    if not doc_ids:
        return "", []

    try:
        context = retrieve_context(doc_ids, message, api_key, top_k=5)
        sources = [{"id": did} for did in doc_ids]
        return context, sources
    except Exception:
        return "", []


def _generate(intent, history, rag_context, message, api_key):
    """调用 LLM 生成回答"""
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    system_prompt = _load_prompt(intent)

    # 注入 RAG 上下文
    if rag_context:
        system_prompt += f"\n\n## 课程参考资料\n{rag_context}\n\n请优先参考以上资料回答。"

    # 组装对话消息
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h['role'], "content": h['content']})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="deepseek-v4-flash",
        messages=messages,
        temperature=0.7,
        max_tokens=2000
    )
    return response.choices[0].message.content


def tutor_chat(session_id, course_id, lecture_id, message, api_key):
    """AI Tutor 核心函数:接收用户消息,返回 AI 回复。"""
    # 1. 意图检测
    intent = _detect_intent(message, api_key)

    # 2. 加载历史
    history = _load_history(session_id)

    # 3. RAG 检索
    rag_context, sources = _retrieve(course_id, lecture_id, message, api_key)

    # 4. LLM 生成
    reply = _generate(intent, history, rag_context, message, api_key)

    return {
        "reply": reply,
        "sources": sources,
        "intent": intent
    }
