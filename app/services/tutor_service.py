import os
import logging
from services.llm_client import get_llm_client
from services.rag_service import retrieve_with_metadata
from repos import chat_repo, document_repo

logger = logging.getLogger(__name__)


def _detect_intent(message):
    """用 LLM 判断用户问题的意图类型。"""
    client = get_llm_client()
    response = client.chat(
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
    intent = (response or '').strip().lower()
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
        return "你是一位大学课程助教。请回答学生的问题。如果提供了课程资料,请优先参考。如果没有课程资料,请用你自己的知识详细回答。使用中文回答,专业术语请提供中英文对照。"

    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def _load_history(session_id, n=6):
    """从 SQLite 加载最近 N 轮对话历史"""
    return chat_repo.get_recent_history(session_id, n)


def _retrieve(course_id, lecture_id, message):
    """检索相关课程资料，返回 (context, sources)"""
    doc_ids = []
    if course_id:
        doc_ids = document_repo.get_ids_with_chunks(course_id)

    if not doc_ids:
        logger.warning(f"未找到已索引的文档: course_id={course_id}")
        return "", []

    try:
        result = retrieve_with_metadata(doc_ids, message, top_k=5)
        sources = [
            {"page": s.get("page"), "source": s.get("source")}
            for s in result["sources"]
        ]
        logger.info(f"RAG 检索成功: {len(result['sources'])} 条结果")
        return result["context"], sources
    except Exception as e:
        logger.warning(f"RAG 检索失败: {e}", exc_info=True)
        return "", []


def _build_messages(intent, history, rag_context, message, images=None):
    """组装对话消息列表；images 为图片 data URL 列表（多模态）"""
    system_prompt = _load_prompt(intent)

    if rag_context:
        system_prompt += f"\n\n## 课程参考资料\n{rag_context}\n\n请优先参考以上资料回答。"

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h['role'], "content": h['content']})
    if images:
        user_parts = [{"type": "text", "text": message}]
        for img in images:
            user_parts.append({"type": "image_url", "image_url": {"url": img}})
        messages.append({"role": "user", "content": user_parts})
    else:
        messages.append({"role": "user", "content": message})
    return messages


def _generate_stream(intent, history, rag_context, message, images=None):
    """流式生成，yield 每个 chunk（按当前配置的模型提供商）"""
    client = get_llm_client()
    messages = _build_messages(intent, history, rag_context, message, images)

    for chunk in client.chat_stream(messages, temperature=0.7, max_tokens=2000):
        yield chunk


def tutor_chat_stream(session_id, course_id, lecture_id, message, images=None):
    """流式版：返回 sources + 生成器"""
    intent = _detect_intent(message)
    history = _load_history(session_id)
    rag_context, sources = _retrieve(course_id, lecture_id, message)

    stream = _generate_stream(intent, history, rag_context, message, images)

    return {"sources": sources, "intent": intent, "stream": stream}
