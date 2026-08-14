import os
import sys

# 项目根目录
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _default_data_dir():
    """数据目录。

    打包运行（PyInstaller）时程序本体在临时解压目录（退出即清空），
    数据必须放到持久化的用户目录，否则每次启动数据全部丢失。
    """
    if getattr(sys, 'frozen', False):
        if sys.platform == 'darwin':
            return os.path.join(os.path.expanduser('~'), 'Library', 'Application Support', 'Monad')
        return os.path.join(os.environ.get('APPDATA') or os.path.expanduser('~'), 'Monad')
    return os.path.join(ROOT_DIR, 'data')


# 数据目录（存数据库和音频文件）
DATA_DIR = _default_data_dir()
AUDIO_DIR = os.path.join(DATA_DIR, 'audio')
DB_PATH = os.path.join(DATA_DIR, 'database.db')

# 支持的音频格式
ALLOWED_AUDIO_TYPES = ['.mp3', '.m4a', '.wav', '.flac', '.ogg']
MAX_FILE_SIZE_MB = 200

# 上传文档大小上限（MB）
MAX_DOC_SIZE_MB = 50

# ===== LLM 配置（DeepSeek） =====
LLM_BASE_URL = "https://api.deepseek.com/v1"
LLM_MODEL = "deepseek-v4-flash"
LLM_MAX_TOKENS = 4000
LLM_TEMPERATURE = 0.7
