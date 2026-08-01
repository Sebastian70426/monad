"""
多智能体辅导系统 (Multi-Agent Tutoring System)

4 个 Agent 角色协作:
  1. Diagnostic Agent  — 诊断知识盲区
  2. Explanation Agent — 讲解概念
  3. Quiz Agent        — 生成针对性测验
  4. Correction Agent  — 纠错分析

编排逻辑:
  学生提问 → 诊断 Agent → 根据诊断结果路由到 讲解/出题/纠错 Agent
"""
import json
import logging
from openai import OpenAI
from repos import knowledge_repo, quiz_repo

logger = logging.getLogger(__name__)


# ========== Agent Prompts ==========

DIAGNOSTIC_PROMPT = """你是一位学习诊断专家。分析学生的提问,判断其知识盲区。

请以 JSON 格式返回:
{
  "intent": "understand | practice | check_answer | review",
  "weak_points": ["学生可能薄弱的知识点1", "知识点2"],
  "confidence": 0.0-1.0,
  "suggested_agent": "explanation | quiz | correction",
  "reasoning": "简短说明为什么选择这个 Agent"
}

intent 说明:
  understand     — 学生想理解一个概念
  practice       — 学生想练习
  check_answer   — 学生想检查自己的答案
  review         — 学生想复习

请严格基于课程内容和学生的提问历史分析。"""

EXPLANATION_PROMPT = """你是一位资深大学教授,擅长用通俗语言讲解复杂概念。

讲解规则:
1. 先用一句话概括 (含中英文术语对照)
2. 用生活中的类比帮助理解
3. 逐步展开,每步说明原理
4. 最后给出一个具体例子
5. 标注"常见误区"提醒学生

重要:如果提供了课程参考资料,请优先引用并标注来源。如果没有提供参考资料,请用你自己的知识详细回答,不要拒绝。
使用中文回答,专业术语提供中英文对照。"""

QUIZ_AGENT_PROMPT = """你是一位出题专家。根据学生的学习情况,生成针对性的测验题。

要求:
1. 生成 1 道选择题(4 个选项)或 1 道填空题
2. 题目要针对学生的薄弱知识点
3. 难度适中(不要太简单也不要太难)
4. 提供答案和解释

重要:如果没有提供课程参考资料,请根据学生的提问主题,用你自己的知识出题。
如果提供了薄弱知识点列表,请针对这些知识点出题。

请以 JSON 格式返回:
{
  "type": "choice | fill_blank",
  "question": "题目",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "answer": "A",
  "explanation": "解释说明",
  "target_point": "这道题针对的知识点"
}

如果是填空题,options 留空。"""

CORRECTION_PROMPT = """你是一位纠错导师。分析学生的错误答案,指出误区。

回答结构:
1. 学生的错误在哪里
2. 为什么会犯这个错误(常见误区分析)
3. 正确的思路是什么
4. 类似题目的解题模板

重要:如果没有提供课程参考资料,请用你自己的知识分析并纠正。
使用中文回答,专业术语提供中英文对照。"""


# ========== Agent Orchestration ==========

def agent_tutor(message, history, course_id, lecture_id, api_key, rag_context=""):
    """多智能体辅导主入口

    返回: {
        "reply": str,           # AI 回复
        "agent": str,           # 使用的 Agent
        "diagnosis": dict,      # 诊断结果
        "quiz": dict | None,    # 如果出题 Agent 激活
        "sources": list         # 来源
    }
    """
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

    # Step 1: 诊断 Agent
    diagnosis = _run_diagnostic_agent(client, message, history, course_id, api_key)
    suggested = diagnosis.get("suggested_agent", "explanation")

    # Step 2: 根据诊断结果路由
    if suggested == "quiz":
        result = _run_quiz_agent(client, message, course_id, api_key, diagnosis, rag_context)
        result["agent"] = "quiz"
    elif suggested == "correction":
        result = _run_correction_agent(client, message, history, rag_context, api_key)
        result["agent"] = "correction"
    else:
        result = _run_explanation_agent(client, message, history, rag_context, api_key)
        result["agent"] = "explanation"

    result["diagnosis"] = diagnosis
    return result


def agent_tutor_stream(message, history, course_id, lecture_id, api_key, rag_context=""):
    """多智能体流式版

    返回: {
        "diagnosis": dict,
        "agent": str,
        "sources": list,
        "stream": generator
    }
    """
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

    # Step 1: 诊断 Agent (非流式)
    diagnosis = _run_diagnostic_agent(client, message, history, course_id, api_key)
    suggested = diagnosis.get("suggested_agent", "explanation")

    # Step 2: 构建对应 Agent 的消息
    if suggested == "quiz":
        prompt = QUIZ_AGENT_PROMPT
        agent_name = "quiz"
    elif suggested == "correction":
        prompt = CORRECTION_PROMPT
        agent_name = "correction"
    else:
        prompt = EXPLANATION_PROMPT
        agent_name = "explanation"

    # 注入 RAG 上下文
    if rag_context:
        prompt += f"\n\n## 课程参考资料\n{rag_context}\n\n请优先参考以上资料回答。"

    messages = [{"role": "system", "content": prompt}]
    for h in history:
        messages.append({"role": h['role'], "content": h['content']})
    messages.append({"role": "user", "content": message})

    # Step 3: 流式生成
    def _stream():
        response = client.chat.completions.create(
            model="deepseek-v4-flash",
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            stream=True
        )
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    return {
        "diagnosis": diagnosis,
        "agent": agent_name,
        "sources": [],
        "stream": _stream()
    }


# ========== Individual Agents ==========

def _run_diagnostic_agent(client, message, history, course_id, api_key):
    """诊断 Agent: 分析学生问题,判断知识盲区"""
    # 获取课程薄弱知识点
    weak_points = []
    try:
        weak = knowledge_repo.get_weak_points(course_id)
        weak_points = [w['name'] for w in weak[:5]]
    except Exception:
        pass

    # 构建诊断上下文
    context = f"学生提问: {message}\n"
    if weak_points:
        context += f"已知薄弱知识点: {', '.join(weak_points)}\n"
    context += "请分析学生的知识盲区并建议下一步教学策略。"

    try:
        response = client.chat.completions.create(
            model="deepseek-v4-flash",
            messages=[
                {"role": "system", "content": DIAGNOSTIC_PROMPT},
                {"role": "user", "content": context}
            ],
            temperature=0.2,
            max_tokens=300
        )
        raw = response.choices[0].message.content.strip()
        return _parse_json(raw)
    except Exception as e:
        logger.warning(f"诊断 Agent 失败: {e}")
        return {"suggested_agent": "explanation", "weak_points": [], "confidence": 0.0}


def _run_explanation_agent(client, message, history, rag_context, api_key):
    """讲解 Agent: 通俗解释概念"""
    prompt = EXPLANATION_PROMPT
    if rag_context:
        prompt += f"\n\n## 课程参考资料\n{rag_context}\n\n请优先参考以上资料回答。"

    messages = [{"role": "system", "content": prompt}]
    for h in history:
        messages.append({"role": h['role'], "content": h['content']})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="deepseek-v4-flash",
        messages=messages,
        temperature=0.7,
        max_tokens=2000
    )
    return {"reply": response.choices[0].message.content, "quiz": None, "sources": []}


def _run_quiz_agent(client, message, course_id, api_key, diagnosis, rag_context):
    """出题 Agent: 生成针对性测验题"""
    weak_points = diagnosis.get("weak_points", [])
    prompt = QUIZ_AGENT_PROMPT
    if weak_points:
        prompt += f"\n\n学生薄弱知识点: {', '.join(weak_points)}"
    if rag_context:
        prompt += f"\n\n## 课程参考资料\n{rag_context}"

    messages = [{"role": "system", "content": prompt}, {"role": "user", "content": message}]

    try:
        response = client.chat.completions.create(
            model="deepseek-v4-flash",
            messages=messages,
            temperature=0.5,
            max_tokens=500
        )
        raw = response.choices[0].message.content.strip()
        quiz = _parse_json(raw)

        # 如果成功解析出题目,存入数据库
        if quiz and quiz.get('question'):
            options_list = None
            if quiz.get('options'):
                options_list = [quiz['options'].get(k, '') for k in ['A', 'B', 'C', 'D']]
            quiz_id = quiz_repo.create_quiz(
                course_id=course_id,
                question=quiz['question'],
                options=options_list,
                answer=quiz.get('answer', ''),
                explanation=quiz.get('explanation', ''),
                difficulty='medium'
            )
            quiz_repo.create_review(quiz_id, quality=3)

            reply = f"📝 **出题 Agent** 为你生成了一道针对性测验题:\n\n"
            reply += f"**{quiz['question']}**\n\n"
            if options_list:
                for i, opt in enumerate(options_list):
                    reply += f"{chr(65+i)}. {opt}\n"
            reply += f"\n*(答案和解释将在你作答后显示)*\n\n"
            reply += f"💡 这道题针对的知识点: {quiz.get('target_point', '通用')}"

            return {"reply": reply, "quiz": quiz, "sources": []}
    except Exception as e:
        logger.warning(f"出题 Agent 失败: {e}")

    # 回退到讲解 Agent
    return _run_explanation_agent(client, message, [], rag_context, api_key)


def _run_correction_agent(client, message, history, rag_context, api_key):
    """纠错 Agent: 分析错误答案"""
    prompt = CORRECTION_PROMPT
    if rag_context:
        prompt += f"\n\n## 课程参考资料\n{rag_context}\n\n请优先参考以上资料回答。"

    messages = [{"role": "system", "content": prompt}]
    for h in history:
        messages.append({"role": h['role'], "content": h['content']})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="deepseek-v4-flash",
        messages=messages,
        temperature=0.5,
        max_tokens=1500
    )
    reply = "⚠️ **纠错 Agent** 分析如下:\n\n" + response.choices[0].message.content
    return {"reply": reply, "quiz": None, "sources": []}


# ========== Utilities ==========

def _parse_json(raw_text):
    """解析 LLM 返回的 JSON"""
    text = raw_text.strip()

    if text.startswith('```'):
        lines = text.split('\n')
        start = 1
        end = len(lines) - 1
        for i in range(1, len(lines)):
            if lines[i].strip() == '```':
                end = i
                break
        text = '\n'.join(lines[start:end])

    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1:
        return {}

    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return {}
