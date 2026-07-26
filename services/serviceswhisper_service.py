from faster_whisper import WhisperModel
import os

# 全局加载一次模型（启动时加载，不用每次转录都重新加载）
_model = None


def _get_model():
    """懒加载模型，第一次调用时下载"""
    global _model
    if _model is None:
        # 使用 small 模型（约1GB），平衡速度和准确率
        # 可选: tiny(最快)/base/small/medium/large(最准但最慢)
        _model = WhisperModel("small", device="cpu", compute_type="int8")
    return _model


def transcribe(audio_path, api_key=None):
    """
    使用本地 faster-whisper 转录音频。
    api_key 参数保留但不使用（兼容之前的调用方式）。
    返回转录文本。
    """
    model = _get_model()

    segments, info = model.transcribe(
        audio_path,
        language="zh",          # 中文
        vad_filter=True,        # 自动过滤静音
        beam_size=5
    )

    # 拼接所有片段
    transcript_parts = []
    for segment in segments:
        transcript_parts.append(segment.text)

    full_text = "".join(transcript_parts)

    if not full_text.strip():
        raise Exception("转录结果为空，请检查音频文件是否包含有效语音")

    return full_text