import os
import shutil
from datetime import datetime
from config import AUDIO_DIR, ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE_MB


def validate_audio(file_path):
    """验证音频文件。返回 (True, '') 或 (False, '错误原因')"""
    if not os.path.exists(file_path):
        return False, "文件不存在"

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ALLOWED_AUDIO_TYPES:
        return False, f"不支持的格式 {ext}，仅支持 {', '.join(ALLOWED_AUDIO_TYPES)}"

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return False, f"文件过大（{size_mb:.1f}MB），最大支持 {MAX_FILE_SIZE_MB}MB"

    return True, ""


def copy_to_data_dir(source_path, course_id):
    """复制音频文件到数据目录。返回新文件路径"""
    os.makedirs(os.path.join(AUDIO_DIR, str(course_id)), exist_ok=True)

    ext = os.path.splitext(source_path)[1]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    new_filename = f"{timestamp}{ext}"
    dest_path = os.path.join(AUDIO_DIR, str(course_id), new_filename)

    shutil.copy2(source_path, dest_path)
    return dest_path


def get_file_info(file_path):
    """获取文件基本信息"""
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    ext = os.path.splitext(file_path)[1].lower()
    filename = os.path.basename(file_path)
    return {
        "filename": filename,
        "size_mb": round(size_mb, 1),
        "format": ext
    }