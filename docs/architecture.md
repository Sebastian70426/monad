# Monad 架构图

## 系统分层架构
┌─────────────────────────────────────────────────────┐
│ Frontend (Eel + HTML/CSS/JS) │
│ Dashboard │ Courses │ Upload │ Knowledge │ Tutor │ Review │
└────────────────────────┬────────────────────────────┘
│ @eel.expose (RPC)
┌────────────────────────┴────────────────────────────┐
│ main.py (API Layer) │
│ api_create_course │ api_tutor_chat │ api_generate_quizzes │
└────────┬───────────┬────────────────┬───────────────┘
│ │ │
┌────────┴──────┐ ┌──┴──────────┐ ┌──┴──────────────┐
│ Services │ │ Repos │ │ RAG Service │
│ tutor_service │ │ course_repo │ │ chunk_document │
│ quiz_service │ │ lecture_repo │ │ retrieve+rerank │
│ doc_service │ │ document_repo│ │ index_document │
│ │ │ chat_repo │ │ │
│ │ │ quiz_repo │ │ │
│ │ │ settings_repo│ │ │
└───────────────┘ └──────┬───────┘ └────────┬─────────┘
│ │
┌────────────────────────┴────┐ ┌───────────┴──────────┐
│ db.py (SQLite) │ │ ChromaDB (Vector DB) │
│ courses │ lectures │ quizzes│ │ doc_1 │ doc_2 │ ... │
│ documents │ reviews │ ... │ │ (bge-small-zh + rerank)│
└─────────────────────────────┘ └──────────────────────┘
│ │
┌────────┴──────────────────┐ ┌──────────────────┴──────┐
│ External APIs │ │ Local Models (懒加载) │
│ Groq Whisper API (STT) │ │ BAAI/bge-small-zh-v1.5 │
│ DeepSeek API (LLM) │ │ BAAI/bge-reranker-base │
└────────────────────────────┘ └──────────────────────────┘                     
## RAG 两阶段检索流程
用户提问
│
▼
Stage 1: 向量召回 (Recall)
│ query → bge-small-zh-v1.5 → embedding
│ ChromaDB query → top_k×3 = 15 候选 chunks
│ (含 page/source 元数据)
▼
Stage 2: 交叉编码器精排 (Rerank)
│ [query, chunk] pairs → bge-reranker-base → scores
│ 按 score 降序 → 取 top_k = 5
▼
输出: context + sources [{page, source, score}]


折叠
保存
复制
1
2
3

## SM-2 间隔重复流程

生成测验题 → create_review(quality=3, next_review=今天)
│
┌───────────────┘
▼
用户答题 → 自评掌握程度 (0-5)
│
▼
SM-2 算法计算
┌────────────────────────┐
│ quality < 3 → 重置 │
│ reps = 0, interval = 1 │
│ │
│ quality >= 3 → 加深 │
│ reps++, interval 增长 │
│ ease_factor 动态调整 │
└────────────────────────┘
│
▼
next_review = today + interval days
│
▼
到期 → 出现在"今日待复习"
EOF                                                                             
---

## 2. ADR 文档（架构决策记录）

```bash
cd ~/Desktop/monad
touch docs/adr.md

cd ~/Desktop/monad
cat > docs/adr.md << 'EOF'
# Architecture Decision Records (ADR)

## ADR-001: 选择 ChromaDB 作为向量数据库

**状态**: Accepted
**日期**: 2025-07

**背景**: 需要存储文档向量并支持相似度检索，候选方案包括 FAISS、ChromaDB、Pinecone。

**决策**: 选择 ChromaDB。

**理由**:
- 持久化存储（PersistentClient），数据不丢失
- 内置元数据过滤，支持 page/source 检索
- 纯 Python 安装，无需额外服务
- 每个文档独立 collection，删除时不影响其他文档

**代价**: 大规模数据（10万+ chunks）时性能不如 FAISS，但当前场景（课程教材）足够。

---

## ADR-002: 两阶段检索（向量召回 + 交叉编码器精排）

**状态**: Accepted
**日期**: 2025-07

**背景**: 纯向量检索（bge-small-zh）的 Recall@5 虽高，但语义相近但无关的内容会混入结果。

**决策**: 引入 BAAI/bge-reranker-base 交叉编码器，先召回 top_k×3，再精排到 top_k。

**理由**:
- 交叉编码器（Cross-Encoder）比双塔模型更准确，因为它同时编码 query 和 document
- bge-reranker-base 仅 400MB，CPU 推理延迟可接受（~1s/query）
- 精排后准确排除"关键词重叠但语义无关"的内容

**代价**: 每次检索增加 ~1.2s 延迟，但显著提升结果质量。

---

## ADR-003: 从 faster-whisper 本地模型切换到 Groq Whisper API

**状态**: Accepted
**日期**: 2025-07

**背景**: faster-whisper small 模型在 CPU 上转录 642KB 音频卡住，HuggingFace 被墙无法下载模型。

**决策**: 改用 Groq 免费 Whisper API（whisper-large-v3）。

**理由**:
- Groq 提供免费 API，whisper-large-v3 比本地 small 模型更准确
- 转录速度从无限卡住降到 5-10 秒
- 不需要 ffmpeg、不需要下载模型、不需要 HuggingFace 连接
- API Key 管理方式与 DeepSeek 一致，用户体验统一

**代价**: 依赖网络和第三方服务，但本地模型在当前环境下完全不可用。

---

## ADR-004: SM-2 间隔重复算法

**状态**: Accepted
**日期**: 2025-07

**背景**: 需要根据学生答题表现安排复习时间，候选算法包括 SM-2、FSRS、 Leitner System。

**决策**: 选择 SM-2 算法。

**理由**:
- 算法简单（6 个公式），纯 Python 实现
- Anki 等主流软件使用相同算法，经过验证
- ease_factor 动态调整，适应不同难度内容
- 存储需求小（每次复习只存 4 个字段）

**代价**: 不如 FSRS 精准（FSRS 基于深度学习），但对于学习项目足够。

---

## ADR-005: 流式输出使用 Eel 回调而非 WebSocket

**状态**: Accepted
**日期**: 2025-07

**背景**: AI Tutor 和笔记生成需要流式输出，Eel 框架不支持 WebSocket。

**决策**: 使用 Eel 的 Python→JS 回调（eel.function_name()()）。

**理由**:
- Eel 原生支持 Python 主动调用前端 JS 函数
- 无需引入额外依赖（Socket.IO 等）
- 回调函数用 eel.expose() 暴露，前端直接接收 chunk

**代价**: 后台线程中的回调不可靠（threading + eel 回调不兼容），转录功能改用轮询模式。
