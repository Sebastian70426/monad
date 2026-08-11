import os

# 项目根目录
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 数据目录（存数据库和音频文件）
DATA_DIR = os.path.join(ROOT_DIR, 'data')
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