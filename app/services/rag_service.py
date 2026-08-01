import logging
import os
import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

# ChromaDB 持久化路径
from config import DATA_DIR
CHROMA_PATH = os.path.join(DATA_DIR, 'chroma')

_client = None

def _get_client():
    global _client
    if _client is None:
        os.makedirs(CHROMA_PATH, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_PATH, settings=Settings(anonymized_telemetry=False))
    return _client


# ===== 文本切分 =====

def _chunk_text_legacy(text, chunk_size=800, overlap=100):
    """[已弃用] 固定长度切分，仅用于向后兼容旧索引"""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start = end - overlap
    return chunks


def chunk_document(sections, max_chunk_size=800, overlap=100):
    """结构感知文本切分。

    输入: [{"text": str, "page": int, "source": str}, ...]
    输出: [{"text": str, "page": int, "source": str}, ...]

    策略:
    1. 短段合并: 连续短段落合并到接近 max_chunk_size
    2. 长段切分: 超长段落按 \\n 边界切分，仍超则硬切
    3. 元数据: 每个 chunk 继承起始内容的 page/source
    4. 重叠: 相邻 chunk 间保留 overlap 字符的上下文
    """
    chunks = []
    buffer = ""
    buffer_page = None
    buffer_source = None

    for section in sections:
        text = section["text"].strip()
        if not text:
            continue
        page = section["page"]
        source = section["source"]

        # ---- 长段落：需要拆分 ----
        if len(text) > max_chunk_size:
            # 先刷出已有内容
            if buffer.strip():
                chunks.append({
                    "text": buffer.strip(),
                    "page": buffer_page,
                    "source": buffer_source
                })
                buffer = ""
            buffer_page = page
            buffer_source = source

            # 按 \n 拆分
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            for line in lines:
                if len(line) > max_chunk_size:
                    # 单行仍然太长 → 先刷出 buffer，再硬切
                    if buffer.strip():
                        chunks.append({
                            "text": buffer.strip(),
                            "page": buffer_page,
                            "source": buffer_source
                        })
                        buffer = ""
                    buffer_page = page
                    buffer_source = source
                    while len(line) > max_chunk_size:
                        chunks.append({
                            "text": line[:max_chunk_size],
                            "page": page,
                            "source": source
                        })
                        line = line[max_chunk_size - overlap:]
                    if line.strip():
                        buffer = line
                else:
                    # 正常行：尝试并入 buffer
                    if buffer and len(buffer) + len(line) + 1 > max_chunk_size:
                        chunks.append({
                            "text": buffer.strip(),
                            "page": buffer_page,
                            "source": buffer_source
                        })
                        buffer = buffer[-overlap:] if len(buffer) > overlap else ""
                        buffer_page = page
                        buffer_source = source
                    if not buffer:
                        buffer_page = page
                        buffer_source = source
                    buffer = buffer + "\n" + line if buffer else line

        # ---- 短段落：尝试合并 ----
        else:
            if buffer and len(buffer) + len(text) + 2 > max_chunk_size:
                chunks.append({
                    "text": buffer.strip(),
                    "page": buffer_page,
                    "source": buffer_source
                })
                buffer = buffer[-overlap:] if len(buffer) > overlap else ""
                buffer_page = page
                buffer_source = source
            if not buffer:
                buffer_page = page
                buffer_source = source
            buffer = buffer + "\n\n" + text if buffer else text

    # 刷出剩余内容
    if buffer.strip():
        chunks.append({
            "text": buffer.strip(),
            "page": buffer_page,
            "source": buffer_source
        })

    return chunks


# ===== Embedding 模型（懒加载）=====

_embedding_model = None

def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer('BAAI/bge-small-zh-v1.5')
    return _embedding_model


def get_embedding(text):
    model = _get_embedding_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


# ===== Reranker 模型（懒加载）=====

_reranker_model = None

def _get_reranker_model():
    """懒加载交叉编码器 reranker 模型"""
    global _reranker_model
    if _reranker_model is None:
        from sentence_transformers import CrossEncoder
        _reranker_model = CrossEncoder('BAAI/bge-reranker-base')
    return _reranker_model


def _rerank(query, candidates, top_k=5):
    """用交叉编码器对候选 chunk 精排。

    输入:
        query: 用户查询文本
        candidates: [{"text": str, "page": int, "source": str, "distance": float}, ...]
        top_k: 返回前 N 个
    输出:
        排序后的 candidates 列表（按相关性降序）
    """
    if not candidates:
        return []

    model = _get_reranker_model()

    # 构造 query-document 对
    pairs = [[query, c["text"]] for c in candidates]

    # 批量打分
    scores = model.predict(pairs)

    # 将分数附加到候选列表
    for i, candidate in enumerate(candidates):
        candidate["rerank_score"] = float(scores[i])

    # 按 rerank_score 降序排序
    candidates.sort(key=lambda x: x["rerank_score"], reverse=True)

    return candidates[:top_k]


# ===== 索引 & 检索 =====

def index_document(doc_id, content, api_key=None):
    """将文档内容切块、向量化、存入 ChromaDB。

    参数:
        doc_id: 文档 ID
        content: 结构化段落列表 [{"text": str, "page": int, "source": str}, ...]
                 或纯文本字符串（旧模式，向后兼容）
    返回:
        chunk 数量
    """
    client = _get_client()

    collection_name = f"doc_{doc_id}"
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.create_collection(name=collection_name)

    # 判断是新模式（结构化列表）还是旧模式（纯字符串）
    if isinstance(content, list):
        chunks = chunk_document(content)
        texts = [c["text"] for c in chunks]
        metadatas = [{"page": c["page"], "source": c["source"]} for c in chunks]
    else:
        texts = _chunk_text_legacy(content)
        metadatas = None

    if not texts:
        return 0

    # 批量获取 embeddings
    embeddings = []
    for text in texts:
        emb = get_embedding(text)
        embeddings.append(emb)

    ids = [f"chunk_{i}" for i in range(len(texts))]

    if metadatas:
        collection.add(
            embeddings=embeddings,
            documents=texts,
            ids=ids,
            metadatas=metadatas
        )
    else:
        collection.add(
            embeddings=embeddings,
            documents=texts,
            ids=ids
        )

    return len(texts)


def retrieve_context(doc_ids, query, api_key=None, top_k=5):
    """从指定文档中检索与 query 最相关的文本块。

    返回: 拼接后的上下文字符串（向后兼容）
    """
    result = retrieve_with_metadata(doc_ids, query, api_key, top_k)
    return result["context"]


def retrieve_with_metadata(doc_ids, query, api_key=None, top_k=5):
    """两阶段检索：向量召回 + 交叉编码器精排。

    Stage 1 (Recall):  向量检索召回 top_k × 3 条候选
    Stage 2 (Rerank):  bge-reranker-base 精排，取 top_k 条

    返回: {
        "context": str,           # 拼接的上下文文本
        "sources": [              # 来源信息列表
            {"text": str, "page": int|None, "source": str|None, "distance": float, "rerank_score": float}
        ]
    }
    """
    if not doc_ids:
        return {"context": "", "sources": []}

    client = _get_client()
    query_emb = get_embedding(query)

    # Stage 1: 向量召回（扩大召回范围）
    recall_k = top_k * 3
    all_results = []
    for doc_id in doc_ids:
        collection_name = f"doc_{doc_id}"
        try:
            collection = client.get_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_emb],
                n_results=recall_k,
                include=["documents", "metadatas", "distances"]
            )
            if results['documents'] and results['documents'][0]:
                docs = results['documents'][0]
                metas = results.get('metadatas', [[]])
                metas = metas[0] if metas else [None] * len(docs)
                dists = results.get('distances', [[]])
                dists = dists[0] if dists else [0.0] * len(docs)

                for i, doc in enumerate(docs):
                    meta = metas[i] if i < len(metas) and metas[i] else {}
                    all_results.append({
                        "text": doc,
                        "page": meta.get("page"),
                        "source": meta.get("source"),
                        "distance": dists[i] if i < len(dists) else 0.0
                    })

        except Exception as e:
            logger.warning(f"检索文档 {doc_id} 失败: {e}", exc_info=True)
            continue

    if not all_results:
        return {"context": "", "sources": []}

    # 去重
    seen = set()
    unique = []
    for r in all_results:
        if r["text"] not in seen:
            seen.add(r["text"])
            unique.append(r)

    # Stage 2: 交叉编码器精排
    try:
        top_results = _rerank(query, unique, top_k=top_k)
    except Exception as e:
        logger.warning(f"Reranking 失败，回退到向量排序: {e}")
        # 回退：按向量距离排序（距离越小越相似）
        unique.sort(key=lambda x: x["distance"])
        top_results = unique[:top_k]

    context = "\n\n---\n\n".join(r["text"] for r in top_results)
    return {
        "context": context[:3000],
        "sources": top_results
    }
