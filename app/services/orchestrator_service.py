"""
Orchestrator Agent — 任务识别 + 路由 + 协作编排

三层路由:
  Layer 1: 规则引擎（关键词 + 正则匹配，快速）
  Layer 2: LLM 语义分类（规则未命中时）
  Layer 3: 多 Agent 协作检测（跨领域任务拆解）
"""

import json
import re
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)


# ========== Agent Prompts ==========

AGENT_PROMPTS = {
    "cad": """你是一位 CAD 建模专家,精通 SolidWorks、CATIA、Fusion 360。
帮助学生解决建模问题、分析截图、提供设计建议。
回答结构:
1. 问题诊断
2. 解决步骤（含快捷键提示）
3. 注意事项
如果没有课程资料,请用你自己的专业知识回答。
使用中文回答,专业术语提供中英文对照。""",

    "simulation": """你是一位仿真分析专家,精通 CFD 和 FEA (ANSYS Fluent, OpenFOAM, Abaqus)。
帮助学生设置仿真参数、分析结果、解决收敛问题。
回答结构:
1. 问题分析
2. 参数建议/操作步骤
3. 理论依据
如果没有课程资料,请用你自己的专业知识回答。
使用中文回答,专业术语提供中英文对照。""",

    "calculation": """你是一位工程计算专家,擅长力学、热力学、流体力学计算。
请逐步计算,每步说明原理。
回答结构:
1. 已知条件
2. 使用的公式
3. 代入计算过程
4. 最终结果（含单位）
5. 验证/合理性检查
公式用纯文本格式,如 F = m * a。
使用中文回答,专业术语提供中英文对照。""",

    "code": """你是一位工程编程专家,精通 MATLAB 和 Python。
帮助学生编写和调试工程脚本。
回答结构:
1. 问题说明
2. 代码（有注释）
3. 使用方法
4. 常见错误
代码用英文,解释用中文。""",

    "tutor": """你是一位资深工程教授,擅长讲解工程概念。
讲解规则:
1. 一句话概括(含中英文术语对照)
2. 生活类比帮助理解
3. 逐步展开,每步说明原理
4. 具体例子
5. 常见误区提醒
如果没有课程资料,请用你自己的知识详细回答,不要拒绝。
使用中文回答,专业术语提供中英文对照。""",

    "review": """你是一位设计审查专家,熟悉 GB/ISO/DIN 标准。
检查设计方案是否合规,指出问题和改进建议。
回答结构:
1. 审查项目清单
2. 合规项 ✓ / 不合规项 ⚠
3. 改进建议
4. 风险评估
如果没有课程资料,请用你自己的专业知识审查。
使用中文回答,专业术语提供中英文对照。"""
}


# ========== 路由规则 ==========

ROUTING_RULES = {
    "cad": {
        "keywords": [
            "solidworks", "catia", "fusion 360", "inventor", "ug", "nx",
            "建模", "草图", "拉伸", "旋转", "扫掠", "放样", "装配",
            "配合", "干涉", "工程图", "剖面", "倒角", "圆角",
            "特征树", "重建失败", "悬空", "尺寸标注", "零件", "钣金"
        ],
        "file_types": [".sldprt", ".sldasm", ".step", ".stl", ".iges"]
    },
    "simulation": {
        "keywords": [
            "cfd", "fea", "ansys", "fluent", "openfoam", "abaqus",
            "仿真", "网格", "边界条件", "收敛", "残差",
            "湍流", "层流", "雷诺数", "y+", "云图",
            "应力", "应变", "模态", "屈曲", "疲劳",
            "流场", "压力分布", "速度场", "温度场"
        ],
        "file_types": [".cas", ".dat", ".odb", ".inp", ".frd"]
    },
    "calculation": {
        "keywords": [
            "计算", "求", "等于多少", "公式代入",
            "扭矩", "功率", "转速", "弯矩", "剪力",
            "单位换算", "pa", "mpa", "kn", "安全系数"
        ],
        "patterns": [
            r"[\d.]+\s*[×÷\*/]\s*[\d.]+",
            r"求.*的.*值",
            r"计算.*力|扭矩|功率|应力"
        ]
    },
    "code": {
        "keywords": [
            "matlab", "python", "脚本", "代码", "编程",
            "plot", "矩阵", "数组", "函数", "for循环",
            "报错", "syntax error", "运行错误", "numpy", "scipy"
        ],
        "file_types": [".m", ".py", ".ipynb"]
    },
    "review": {
        "keywords": [
            "检查", "审查", "规范", "标准", "公差",
            "gb", "iso", "din", "ansi",
            "配合", "间隙", "过盈", "壁厚",
            "失效", "强度校核", "安全系数", "合规"
        ]
    },
    "tutor": {
        "keywords": [
            "什么是", "解释", "为什么", "原理",
            "定义", "概念", "推导", "证明",
            "复习", "考试", "总结", "区别"
        ]
    }
}

# 多 Agent 协作模板
COLLABORATION_TEMPLATES = {
    "design_task": {
        "agents": ["calculation", "cad", "review"],
        "mode": "sequential",
        "description": "设计任务: 计算 → 建模 → 审查"
    },
    "debug_task": {
        "agents": ["cad", "tutor"],
        "mode": "parallel",
        "description": "调试任务: 诊断 + 讲解"
    },
    "exam_prep": {
        "agents": ["tutor", "calculation"],
        "mode": "sequential",
        "description": "考试复习: 讲解 + 练习计算"
    }
}


# ========== Orchestrator 主入口 ==========

def orchestrate(message, history, course_id, lecture_id, api_key,
                rag_context="", user_profile=None, has_image=False):
    """Orchestrator 主入口

    返回: {
        "route": str,           # 主路由 Agent
        "agents": [str],        # 涉及的 Agent 列表
        "mode": str,            # single | sequential | parallel
        "subtasks": [dict],     # 拆解的子任务
        "diagnosis": dict,      # 诊断信息
        "stream": generator,    # 流式输出
        "sources": list
    }
    """
    # Step 1: 规则引擎快速匹配
    rule_route = _rule_based_route(message, has_image)

    # Step 2: 规则未命中 → LLM 语义分类
    if not rule_route:
        llm_route = _llm_classify(message, api_key)
        route = llm_route.get("agent", "tutor")
    else:
        route = rule_route

    # Step 3: 判断是否需要多 Agent 协作
    collaboration = _detect_collaboration(message, route)

    if collaboration and len(collaboration["agents"]) > 1:
        return _orchestrate_multi_agent(
            message, history, course_id, lecture_id, api_key,
            rag_context, collaboration
        )
    else:
        return _orchestrate_single_agent(
            message, history, course_id, lecture_id, api_key,
            rag_context, route
        )


# ========== Layer 1: 规则引擎 ==========

def _rule_based_route(message, has_image=False):
    """基于关键词和模式匹配的快速路由"""
    msg_lower = message.lower()

    for agent_type, rules in ROUTING_RULES.items():
        for kw in rules.get("keywords", []):
            if kw in msg_lower:
                return agent_type
        for pattern in rules.get("patterns", []):
            if re.search(pattern, msg_lower):
                return agent_type

    if has_image:
        return "cad"

    return None


# ========== Layer 2: LLM 语义分类 ==========

CLASSIFY_PROMPT = """你是一个工程任务路由器。分析用户的提问,判断应该由哪个专业 Agent 处理。

可选 Agent:
- cad: CAD 建模相关 (SolidWorks/CATIA/Fusion 360, 建模/装配/工程图)
- simulation: 仿真相关 (CFD/FEA, ANSYS/Fluent, 网格/边界条件/收敛)
- calculation: 工程计算 (数值计算, 公式应用, 单位换算)
- code: 编程相关 (MATLAB/Python, 脚本, 代码调试)
- tutor: 理论学习 (概念讲解, 公式推导, 考试复习)
- review: 设计审查 (规范检查, 公差分析, 强度校核)

请以 JSON 返回:
{"agent": "cad|simulation|calculation|code|tutor|review", "confidence": 0.0-1.0}

用户提问: """


def _llm_classify(message, api_key):
    """LLM 语义分类"""
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

    try:
        response = client.chat.completions.create(
            model="deepseek-v4-flash",
            messages=[
                {"role": "system", "content": CLASSIFY_PROMPT},
                {"role": "user", "content": message}
            ],
            temperature=0,
            max_tokens=100
        )
        raw = response.choices[0].message.content.strip()
        return _parse_json(raw)
    except Exception as e:
        logger.warning(f"LLM 分类失败: {e}")
        return {"agent": "tutor", "confidence": 0.0}


# ========== Layer 3: 多 Agent 协作 ==========

def _detect_collaboration(message, primary_route):
    """判断是否需要多 Agent 协作"""
    msg_lower = message.lower()

    design_keywords = ["设计", "design", "方案", "选型", "设计一个"]
    if any(kw in msg_lower for kw in design_keywords) and primary_route in ["cad", "calculation"]:
        return COLLABORATION_TEMPLATES["design_task"]

    debug_keywords = ["报错", "错误", "失败", "为什么不对", "问题在哪", "不对"]
    if any(kw in msg_lower for kw in debug_keywords) and primary_route == "cad":
        return COLLABORATION_TEMPLATES["debug_task"]

    exam_keywords = ["复习", "考试", "考前", "重点考什么"]
    if any(kw in msg_lower for kw in exam_keywords) and primary_route == "tutor":
        return COLLABORATION_TEMPLATES["exam_prep"]

    return None


def _orchestrate_multi_agent(message, history, course_id, lecture_id, api_key,
                              rag_context, collaboration):
    """多 Agent 协作编排"""
    agents = collaboration["agents"]
    mode = collaboration["mode"]

    subtasks = []
    for i, agent_type in enumerate(agents):
        subtasks.append({
            "agent": agent_type,
            "task": _create_subtask(message, agent_type, i, len(agents))
        })

    return {
        "route": agents[0],
        "agents": agents,
        "mode": mode,
        "subtasks": subtasks,
        "diagnosis": {"collaboration": collaboration["description"]},
        "stream": _multi_agent_stream(subtasks, history, course_id, api_key, rag_context),
        "sources": []
    }


def _orchestrate_single_agent(message, history, course_id, lecture_id, api_key,
                               rag_context, route):
    """单 Agent 执行"""
    return {
        "route": route,
        "agents": [route],
        "mode": "single",
        "subtasks": [{"agent": route, "task": message}],
        "diagnosis": {"agent": route},
        "stream": _single_agent_stream(route, message, history, api_key, rag_context),
        "sources": []
    }


def _create_subtask(message, agent_type, index, total):
    """为协作模式中的每个 Agent 创建子任务"""
    if total == 1:
        return message
    if agent_type == "calculation":
        return f"针对以下需求,计算所需工程参数: {message}"
    elif agent_type == "cad":
        return f"基于以下需求,提供建模步骤和设计建议: {message}"
    elif agent_type == "review":
        return f"审查以下设计方案的合规性和安全性: {message}"
    elif agent_type == "tutor":
        return f"解释相关理论概念: {message}"
    return message


# ========== Agent 执行层 ==========

AGENT_LABELS = {
    "cad": "🔧 CAD Agent",
    "simulation": "🔬 Simulation Agent",
    "calculation": "🧮 Calculation Agent",
    "code": "💻 Code Agent",
    "tutor": "📖 Tutor Agent",
    "review": "🔍 Review Agent"
}


def _single_agent_stream(agent_type, message, history, api_key, rag_context):
    """单 Agent 流式执行"""
    prompt = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS["tutor"])

    if rag_context:
        prompt += f"\n\n## 课程参考资料\n{rag_context}\n\n请优先参考以上资料回答。如果没有参考资料,请用你自己的知识详细回答。"

    messages = [{"role": "system", "content": prompt}]
    for h in history:
        messages.append({"role": h['role'], "content": h['content']})
    messages.append({"role": "user", "content": message})

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

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


def _multi_agent_stream(subtasks, history, course_id, api_key, rag_context):
    """多 Agent 流式执行"""
    for i, subtask in enumerate(subtasks):
        label = AGENT_LABELS.get(subtask["agent"], "🤖 Agent")

        yield f"\n{'='*40}\n**{label}**\n{'='*40}\n\n"

        for chunk in _single_agent_stream(
            subtask["agent"], subtask["task"], history,
            api_key, rag_context
        ):
            yield chunk

        if i < len(subtasks) - 1:
            yield "\n\n"

    yield f"\n{'='*40}\n**📋 Orchestrator 汇总**\n{'='*40}\n\n以上是各专业 Agent 的协作结果,请综合参考。"


# ========== 工具函数 ==========

def _parse_json(raw_text):
    """解析 LLM 返回的 JSON"""
    text = raw_text.strip()

    if text.startswith('```'):
        lines = text.split('\n')
        text = '\n'.join(lines[1:-1]) if len(lines) > 2 else text

    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1:
        return {"agent": "tutor", "confidence": 0.0}

    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return {"agent": "tutor", "confidence": 0.0}


def get_agent_label(route):
    """获取 Agent 标签（供 main.py 调用）"""
    return AGENT_LABELS.get(route, "🤖 AI Tutor")
