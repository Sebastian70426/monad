import os
import fitz


def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text_parts = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            text_parts.append(text)
    doc.close()
    return "\n\n".join(text_parts)


def extract_text_from_pptx(file_path):
    from pptx import Presentation
    prs = Presentation(file_path)
    text_parts = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if text:
                        text_parts.append(text)
    return "\n".join(text_parts)


def extract_text_from_txt(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()


def extract_text(file_path, file_type):
    if file_type == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_type == '.pptx':
        return extract_text_from_pptx(file_path)
    elif file_type in ['.txt', '.md']:
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


# ===== 结构化提取（Phase 2 新增）=====

def extract_structured(file_path, file_type, filename):
    """提取文本并保留结构信息（页码/幻灯片号）。

    返回: [{"text": str, "page": int, "source": str}, ...]
    """
    if file_type == '.pdf':
        return _extract_pdf_structured(file_path, filename)
    elif file_type == '.pptx':
        return _extract_pptx_structured(file_path, filename)
    elif file_type in ['.txt', '.md']:
        return _extract_txt_structured(file_path, filename)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def _extract_pdf_structured(file_path, filename):
    """按页提取 PDF，每页一个 section"""
    doc = fitz.open(file_path)
    sections = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            sections.append({"text": text, "page": i + 1, "source": filename})
    doc.close()
    return sections


def _extract_pptx_structured(file_path, filename):
    """按幻灯片提取 PPTX，每张 slide 一个 section"""
    from pptx import Presentation
    prs = Presentation(file_path)
    sections = []
    for i, slide in enumerate(prs.slides):
        text_parts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if text:
                        text_parts.append(text)
        if text_parts:
            sections.append({
                "text": "\n".join(text_parts),
                "page": i + 1,
                "source": filename
            })
    return sections


def _extract_txt_structured(file_path, filename):
    """按空行分段提取 TXT/MD，每段一个 section"""
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    sections = []
    for i, para in enumerate(paragraphs):
        sections.append({"text": para, "page": i + 1, "source": filename})
    return sections
