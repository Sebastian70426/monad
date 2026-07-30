"""
Monad RAG 评估管道
用法:
    python eval_rag.py              # 运行全部测试
    python eval_rag.py --no-rerank  # 仅测试纯向量检索（before）
    python eval_rag.py --rerank     # 仅测试向量+reranker（after）

指标:
    Recall@k: 召回的 top_k 结果中是否包含正确答案 (0 or 1)
    MRR:      正确答案在结果中的倒数排名 (1/rank, 0 表示未命中)
"""

import os
import sys
import time
import json

# 确保项目根目录在 path 中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.rag_service import (
    _get_client,
    _get_embedding_model,
    _get_reranker_model,
    chunk_document,
    get_embedding,
    index_document,
    retrieve_context,
    retrieve_with_metadata,
)


# ========== 测试数据集 ==========

TEST_DOC_SECTIONS = [
    {
        "text": "牛顿第二定律:物体的加速度与所受合外力成正比,与物体的质量成反比。公式表示为 F = m * a,其中 F 是合外力(单位牛顿),m 是质量(单位千克),a 是加速度(单位米每二次方秒)。",
        "page": 1,
        "source": "力学教材.pdf"
    },
    {
        "text": "牛顿第一定律(惯性定律):一切物体在不受外力作用时,总保持静止状态或匀速直线运动状态。物体的这种保持原有运动状态的性质称为惯性。",
        "page": 2,
        "source": "力学教材.pdf"
    },
    {
        "text": "牛顿第三定律:两个物体之间的作用力和反作用力总是大小相等、方向相反,作用在同一条直线上。即 F_作用 = -F_反作用。",
        "page": 3,
        "source": "力学教材.pdf"
    },
    {
        "text": "动量守恒定律:如果一个系统不受外力或所受外力之和为零,则这个系统的总动量保持不变。公式: m1*v1 + m2*v2 = m1*v1' + m2*v2'。",
        "page": 4,
        "source": "力学教材.pdf"
    },
    {
        "text": "能量守恒定律:能量既不会凭空产生,也不会凭空消失,只能从一种形式转化为另一种形式,或从一个物体转移到另一个物体,而能量的总量保持不变。",
        "page": 5,
        "source": "力学教材.pdf"
    },
    {
        "text": "课程安排:第一周介绍基本概念和单位制,第二周开始受力分析,第三周学习牛顿运动定律,第四周进行期中考试。",
        "page": 6,
        "source": "力学教材.pdf"
    },
    {
        "text": "胡克定律:在弹性限度内,弹簧的弹力与形变量成正比。公式 F = k * x,其中 k 为劲度系数,x 为形变量。这是弹性体力学的基本定律。",
        "page": 7,
        "source": "力学教材.pdf"
    },
    {
        "text": "摩擦力分为静摩擦力和滑动摩擦力。滑动摩擦力大小与正压力成正比,即 f = μ * N,其中 μ 为动摩擦因数,N 为正压力。静摩擦力大小随外力变化,最大值等于最大静摩擦力。",
        "page": 8,
        "source": "力学教材.pdf"
    },
]

# 测试 query + 期望命中的关键词（用于判断是否命中正确 chunk）
TEST_QUERIES = [
    {
        "query": "加速度和力的关系是什么",
        "expected_keywords": ["牛顿第二定律", "F = m * a"],
        "expected_page": 1,
    },
    {
        "query": "物体不受力时会怎样",
        "expected_keywords": ["牛顿第一定律", "惯性"],
        "expected_page": 2,
    },
    {
        "query": "作用力和反作用力的关系",
        "expected_keywords": ["牛顿第三定律", "大小相等", "方向相反"],
        "expected_page": 3,
    },
    {
        "query": "碰撞前后什么量保持不变",
        "expected_keywords": ["动量守恒", "总动量"],
        "expected_page": 4,
    },
    {
        "query": "能量会消失吗",
        "expected_keywords": ["能量守恒", "凭空产生", "凭空消失"],
        "expected_page": 5,
    },
    {
        "query": "弹簧的弹力怎么计算",
        "expected_keywords": ["胡克定律", "F = k * x"],
        "expected_page": 7,
    },
    {
        "query": "摩擦力有哪些类型",
        "expected_keywords": ["静摩擦力", "滑动摩擦力"],
        "expected_page": 8,
    },
    {
        "query": "什么时候考试",
        "expected_keywords": ["课程安排", "期中考试"],
        "expected_page": 6,
    },
]


# ========== 评估逻辑 ==========

def setup_test_index():
    """创建测试文档索引,使用专用 doc_id 避免冲突"""
    TEST_DOC_ID = 99999
    print("正在构建测试索引...")
    index_document(TEST_DOC_ID, TEST_DOC_SECTIONS)
    print(f"索引完成: {len(TEST_DOC_SECTIONS)} sections → indexed")
    return TEST_DOC_ID


def _is_relevant(result_text, expected_keywords):
    """判断检索结果是否命中正确答案"""
    return any(kw in result_text for kw in expected_keywords)


def evaluate_retrieval(doc_id, use_rerank=True, top_k=5):
    """运行检索评估,返回 Recall@k 和 MRR"""
    results = []
    for i, tq in enumerate(TEST_QUERIES):
        query = tq["query"]
        expected_keywords = tq["expected_keywords"]

        if use_rerank:
            result = retrieve_with_metadata([doc_id], query, top_k=top_k)
            retrieved = result["sources"]
        else:
            # 纯向量检索:用 retrieve_with_metadata 但跳过 reranker
            # 临时通过 monkey-patch 禁用 reranker
            import services.rag_service as rs
            original_rerank = rs._rerank
            rs._rerank = lambda q, c, top_k=5: sorted(c, key=lambda x: x["distance"])[:top_k]
            try:
                result = retrieve_with_metadata([doc_id], query, top_k=top_k)
                retrieved = result["sources"]
            finally:
                rs._rerank = original_rerank

        # 计算 Recall@k 和 MRR
        hit = False
        reciprocal_rank = 0.0
        for rank, r in enumerate(retrieved, 1):
            if _is_relevant(r["text"], expected_keywords):
                hit = True
                reciprocal_rank = 1.0 / rank
                break

        results.append({
            "query": query,
            "hit": hit,
            "rank": rank if hit else None,
            "rr": reciprocal_rank,
            "use_rerank": use_rerank,
        })

        status = "✅" if hit else "❌"
        rank_str = f"rank={rank}" if hit else "MISS"
        method = "rerank" if use_rerank else "vector-only"
        print(f"  [{method}] Q{i+1}: {status} {rank_str} | {query}")

    recall = sum(1 for r in results if r["hit"]) / len(results)
    mrr = sum(r["rr"] for r in results) / len(results)
    return {"recall": recall, "mrr": mrr, "details": results}


def run_comparison():
    """对比 before (纯向量) vs after (向量+reranker)"""
    doc_id = setup_test_index()

    print("\n" + "=" * 60)
    print("Phase 2 RAG 评估: Before vs After")
    print("=" * 60)

    # Before: 纯向量
    print("\n--- Before: 纯向量检索 (vector-only) ---")
    t0 = time.time()
    before = evaluate_retrieval(doc_id, use_rerank=False)
    before_time = time.time() - t0
    print(f"Recall@5: {before['recall']:.2%} | MRR: {before['mrr']:.4f} | Time: {before_time:.2f}s")

    # After: 向量 + reranker
    print("\n--- After: 向量检索 + Reranker ---")
    t0 = time.time()
    after = evaluate_retrieval(doc_id, use_rerank=True)
    after_time = time.time() - t0
    print(f"Recall@5: {after['recall']:.2%} | MRR: {after['mrr']:.4f} | Time: {after_time:.2f}s")

    # 对比表
    print("\n" + "=" * 60)
    print(f"{'指标':<20} {'Before':<15} {'After':<15} {'变化':<15}")
    print("-" * 60)
    print(f"{'Recall@5':<20} {before['recall']:.2%}{'':>5} {after['recall']:.2%}{'':>5} {(after['recall']-before['recall']):+.2%}")
    print(f"{'MRR':<20} {before['mrr']:.4f}{'':>7} {after['mrr']:.4f}{'':>7} {(after['mrr']-before['mrr']):+.4f}")
    print(f"{'Avg Latency':<20} {before_time/len(TEST_QUERIES):.3f}s{'':>5} {after_time/len(TEST_QUERIES):.3f}s{'':>5} {(after_time-before_time)/len(TEST_QUERIES):+.3f}s")
    print("=" * 60)

    # 清理测试索引
    client = _get_client()
    try:
        client.delete_collection("doc_99999")
        print("\n测试索引已清理。")
    except Exception:
        pass


if __name__ == "__main__":
    # 首次运行需要加载模型,给出提示
    print("首次运行将加载 embedding 和 reranker 模型,请耐心等待...")
    print()

    if "--no-rerank" in sys.argv:
        doc_id = setup_test_index()
        print("\n--- 纯向量检索 (vector-only) ---")
        result = evaluate_retrieval(doc_id, use_rerank=False)
        print(f"\nRecall@5: {result['recall']:.2%} | MRR: {result['mrr']:.4f}")
    elif "--rerank" in sys.argv:
        doc_id = setup_test_index()
        print("\n--- 向量检索 + Reranker ---")
        result = evaluate_retrieval(doc_id, use_rerank=True)
        print(f"\nRecall@5: {result['recall']:.2%} | MRR: {result['mrr']:.4f}")
    else:
        run_comparison()
