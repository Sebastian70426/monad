import json
import logging
from services.llm_client import get_llm_client
from repos import knowledge_repo, lecture_repo, quiz_repo, document_repo

logger = logging.getLogger(__name__)

EXTRACT_PROMPT = """你是一位知识图谱专家。请从以下课程笔记中提取核心知识点,并建立它们之间的依赖关系。

要求:
1. 提取 5-15 个知识点(不要太细也不要太粗)
2. 每个知识点需要: name(名称), description(简短描述)
3. 标注前置依赖: 学某知识点之前需要先掌握哪些知识点
4. 知识点名称要简洁(2-8个字),如"牛顿第二定律"、"受力分析"
5. 专业术语请提供中英文对照

请以 JSON 格式返回,不要包含任何其他文字:
{
  "points": [
    {"name": "牛顿第二定律", "description": "描述力与加速度的关系 F=ma (Newton's Second Law)"},
    {"name": "受力分析", "description": "分析物体所受各力 (Free Body Diagram)"}
  ],
  "dependencies": [
    {"point": "牛顿第二定律", "depends_on": "受力分析"}
  ]
}

课程笔记:
"""


def extract_knowledge_points(course_id):
    """从课程笔记 + 课程资料（含图片提取文字）中提取知识点图谱

    返回: {"success": True, "points": N, "dependencies": N}
    """
    # 收集课程所有笔记
    lectures = lecture_repo.get_by_course(course_id)
    notes = []
    for lec in lectures:
        if lec.get('has_note'):
            full = lecture_repo.get_by_id(lec['id'])
            if full and full.get('note'):
                notes.append(full['note'])

    # 补充课程资料内容（含图片文档经视觉模型提取的文字），使图谱覆盖文档
    doc_texts = []
    for d in document_repo.get_meta_by_course(course_id):
        full = document_repo.get_by_id(d['id'])
        if full and full.get('content'):
            doc_texts.append(full['content'][:3000])

    if not notes and not doc_texts:
        return {"success": False, "error": "课程中没有笔记或资料,无法提取知识点"}

    content = "\n\n---\n\n".join(notes + doc_texts)[:6000]

    # 调用 LLM
    try:
        raw = _call_llm(content)
        result = _parse_result(raw)
    except Exception as e:
        logger.warning(f"LLM 提取知识点失败: {e}", exc_info=True)
        return {"success": False, "error": f"提取失败: {str(e)}"}

    if not result or not result.get('points'):
        return {"success": False, "error": "未能解析出知识点"}

    # 清除旧知识点
    knowledge_repo.clear_course_points(course_id)

    # 存入数据库
    point_map = {}  # name -> id
    for p in result['points']:
        pid = knowledge_repo.create_point(
            course_id=course_id,
            name=p['name'],
            description=p.get('description', '')
        )
        point_map[p['name']] = pid

    # 存依赖关系
    dep_count = 0
    for dep in result.get('dependencies', []):
        point_name = dep.get('point')
        depends_on_name = dep.get('depends_on')
        if point_name in point_map and depends_on_name in point_map:
            knowledge_repo.add_dependency(point_map[point_name], point_map[depends_on_name])
            dep_count += 1

    return {
        "success": True,
        "points": len(result['points']),
        "dependencies": dep_count
    }


def link_quiz_to_knowledge(quiz_id, course_id):
    """将测验题关联到知识点（用 LLM 判断题目涉及哪些知识点）"""
    quiz = quiz_repo.get_quiz_by_id(quiz_id)
    if not quiz:
        return {"success": False, "error": "测验题不存在"}

    points = knowledge_repo.get_points_by_course(course_id)
    if not points:
        return {"success": False, "error": "课程还没有知识点"}

    point_names = [p['name'] for p in points]

    prompt = f"""请判断以下测验题涉及哪些知识点。从给定的知识点列表中选择 1-2 个最相关的。

知识点列表: {json.dumps(point_names, ensure_ascii=False)}

测验题: {quiz['question']}

只返回 JSON 数组,包含知识点名称,如: ["牛顿第二定律"]
如果都不相关,返回: []"""

    client = get_llm_client()
    raw = client.chat(
        messages=[{"role": "system", "content": prompt}, {"role": "user", "content": quiz['question']}],
        temperature=0,
        max_tokens=100
    )
    try:
        names = json.loads(raw)
    except json.JSONDecodeError:
        # 尝试提取 JSON 数组
        start = raw.find('[')
        end = raw.rfind(']')
        if start != -1 and end != -1:
            names = json.loads(raw[start:end + 1])
        else:
            names = []

    # 关联到数据库
    linked = 0
    for name in names:
        for p in points:
            if p['name'] == name:
                knowledge_repo.link_quiz(quiz_id, p['id'])
                linked += 1
                break

    return {"success": True, "linked": linked}


def _call_llm(content):
    """调用当前配置的模型提供商提取知识点"""
    client = get_llm_client()
    return client.chat(
        messages=[
            {"role": "system", "content": EXTRACT_PROMPT},
            {"role": "user", "content": content}
        ],
        temperature=0.3,
        max_tokens=2000
    )


def _parse_result(raw_text):
    """解析 LLM 返回的 JSON"""
    text = raw_text.strip()

    # 去掉 markdown 代码块
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
        return None

    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return None
