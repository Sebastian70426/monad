import os
import chromadb
from chromadb.config import Settings

# ChromaDB 持久化路径
CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'chroma')

_client = None

def _get_client():
    global _client
    if _client is None:
        os.makedirs(CHROMA_PATH, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_PATH, settings=Settings(anonymized_telemetry=False))
    return _client


def chunk_text(text, chunk_size=800, overlap=100):
    """将长文本切分为重叠的块，每个块约 chunk_size 字符"""
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


def get_embedding(text, api_key):
    """调用 DeepSeek Embedding API 获取向量"""
    from openai import OpenAI
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    response = client.embeddings.create(
        model="deepseek-chat",
        input=text
    )
    return response.data[0].embedding


def index_document(doc_id, content, api_key):
    """将文档内容切块、向量化、存入 ChromaDB"""
    client = _get_client()

    # 每个课程一个 collection
    collection_name = f"doc_{doc_id}"
    # 删除旧 collection（如果存在），重新索引
    try:
        client.delete_collection(collection_name)
    except:
        pass

    collection = client.create_collection(name=collection_name)

    chunks = chunk_text(content)
    if not chunks:
        return 0

    # 批量获取 embeddings
    embeddings = []
    for chunk in chunks:
        emb = get_embedding(chunk, api_key)
        embeddings.append(emb)

    # 存入 ChromaDB
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(
        embeddings=embeddings,
        documents=chunks,
        ids=ids
    )

    return len(chunks)


def retrieve_context(doc_ids, query, api_key, top_k=5):
    """从指定文档中检索与 query 最相关的文本块"""
    if not doc_ids:
        return ""

    client = _get_client()
    query_emb = get_embedding(query, api_key)

    all_results = []
    for doc_id in doc_ids:
        collection_name = f"doc_{doc_id}"
        try:
            collection = client.get_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_emb],
                n_results=top_k
            )
            if results['documents'] and results['documents'][0]:
                for doc in results['documents'][0]:
                    all_results.append(doc)
        except:
            continue

    if not all_results:
        return ""

    # 去重并拼接，限制总长度
    seen = set()
    unique = []
    for r in all_results:
        if r not in seen:
            seen.add(r)
            unique.append(r)

    context = "\n\n---\n\n".join(unique[:top_k])
    return context[:3000]  # 限制上下文长度，避免 token 超限
    