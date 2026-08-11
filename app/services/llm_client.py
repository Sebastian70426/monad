"""统一的 LLM 提供商抽象层：DeepSeek / OpenAI / Groq / Gemini

用法:
    from services.llm_client import get_llm_client, supports_vision
    client = get_llm_client()          # 根据 settings 表当前配置选择提供商
    text = client.chat(messages, temperature=0.7, max_tokens=2000)
    for chunk in client.chat_stream(messages, ...): ...

消息格式统一为 OpenAI 风格:
    [
        {"role": "system", "content": "..."},
        {"role": "user", "content": [
            {"type": "text", "text": "..."},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]}
    ]
"""
import base64
from config import LLM_BASE_URL, LLM_MODEL

# ===== 提供商注册表 =====
PROVIDERS = {
    'deepseek': {
        'label': 'DeepSeek', 'kind': 'openai_compat',
        'base_url': LLM_BASE_URL, 'default_model': LLM_MODEL,
        'key_setting': 'deepseek_key', 'vision_models': [],
    },
    'openai': {
        'label': 'OpenAI (ChatGPT)', 'kind': 'openai_compat',
        'base_url': 'https://api.openai.com/v1', 'default_model': 'gpt-4o-mini',
        'key_setting': 'openai_key',
        'vision_models': ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o4-mini', 'chatgpt-4o-latest'],
    },
    'groq': {
        'label': 'Groq', 'kind': 'openai_compat',
        'base_url': 'https://api.groq.com/openai/v1', 'default_model': 'llama-3.3-70b-versatile',
        'key_setting': 'groq_key', 'vision_models': [],
    },
    'gemini': {
        'label': 'Google Gemini', 'kind': 'gemini',
        'default_model': 'gemini-2.0-flash', 'key_setting': 'gemini_key', 'vision': True,
    },
}


def get_provider_name():
    """当前设置的提供商 id（默认 deepseek）"""
    from repos import settings_repo
    name = settings_repo.get('llm_provider', default='deepseek')
    return name if name in PROVIDERS else 'deepseek'


def supports_vision(provider=None, model=None):
    """判断指定提供商/模型是否支持图片输入"""
    if provider is None:
        provider = get_provider_name()
    meta = PROVIDERS.get(provider, {})
    if meta.get('kind') == 'gemini' or meta.get('vision'):
        return True
    model = (model or meta.get('default_model', '')).lower()
    return any(v in model for v in meta.get('vision_models', []))


def get_llm_client(provider=None, api_key=None, model=None):
    """按当前设置创建 LLM 客户端"""
    from repos import settings_repo
    if provider is None:
        provider = get_provider_name()
    meta = PROVIDERS[provider]
    if api_key is None:
        api_key = settings_repo.get(meta['key_setting'])
    if model is None:
        model = meta.get('default_model')
    if meta['kind'] == 'gemini':
        return _GeminiClient(api_key, model)
    return _OpenAICompatClient(api_key, meta['base_url'], model)


# ===== OpenAI 兼容客户端（DeepSeek / OpenAI / Groq） =====

class _OpenAICompatClient:
    def __init__(self, api_key, base_url, model):
        from openai import OpenAI
        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.provider_kind = 'openai_compat'

    def chat(self, messages, temperature=0.7, max_tokens=2000):
        response = self._client.chat.completions.create(
            model=self.model, messages=messages,
            temperature=temperature, max_tokens=max_tokens,
        )
        return response.choices[0].message.content

    def chat_stream(self, messages, temperature=0.7, max_tokens=2000):
        response = self._client.chat.completions.create(
            model=self.model, messages=messages,
            temperature=temperature, max_tokens=max_tokens, stream=True,
        )
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


# ===== Gemini 客户端（google-genai） =====

class _GeminiClient:
    def __init__(self, api_key, model):
        from google import genai
        self._client = genai.Client(api_key=api_key)
        self.model = model
        self.provider_kind = 'gemini'

    @staticmethod
    def _convert_messages(messages):
        """OpenAI 风格消息 → Gemini contents；system 消息提取为 system_instruction"""
        system_parts = []
        contents = []
        for m in messages:
            if m['role'] == 'system':
                system_parts.append(m['content'])
                continue
            parts = []
            content = m['content']
            if isinstance(content, str):
                parts.append(content)
            else:
                for part in content:
                    if part.get('type') == 'text':
                        parts.append(part['text'])
                    elif part.get('type') == 'image_url':
                        url = part['image_url']['url']
                        mime, b64 = _parse_data_url(url)
                        if mime and b64:
                            parts.append({'inline_data': {'mime_type': mime, 'data': b64}})
            contents.append({'role': _to_gemini_role(m['role']), 'parts': parts})
        return system_parts, contents

    def chat(self, messages, temperature=0.7, max_tokens=2000):
        system_parts, contents = self._convert_messages(messages)
        resp = self._client.models.generate_content(
            model=self.model,
            contents=contents,
            config={'system_instruction': '\n'.join(system_parts) if system_parts else None,
                    'generation_config': {'temperature': temperature, 'max_output_tokens': max_tokens}},
        )
        return resp.text or ''

    def chat_stream(self, messages, temperature=0.7, max_tokens=2000):
        system_parts, contents = self._convert_messages(messages)
        stream = self._client.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config={'system_instruction': '\n'.join(system_parts) if system_parts else None,
                    'generation_config': {'temperature': temperature, 'max_output_tokens': max_tokens}},
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text


def _to_gemini_role(role):
    """OpenAI 角色 → Gemini 角色：assistant → model，其余非 user/model → user"""
    if role == 'assistant':
        return 'model'
    return role if role in ('user', 'model') else 'user'


def _parse_data_url(url):
    """'data:image/jpeg;base64,xxxx' → (mime, base64)"""
    if not url or not url.startswith('data:'):
        return None, None
    try:
        head, b64 = url.split(',', 1)
        mime = head.split(';')[0].split(':', 1)[1]
        return mime, b64
    except Exception:
        return None, None


def image_to_data_url(file_path, max_mb=8):
    """读取本地图片为 data URL（供多模态消息使用）"""
    with open(file_path, 'rb') as f:
        data = f.read()
    ext = file_path.rsplit('.', 1)[-1].lower() if '.' in file_path else 'jpeg'
    mime = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'webp': 'webp'}.get(ext, 'jpeg')
    return 'data:image/%s;base64,%s' % (mime, base64.b64encode(data).decode('ascii'))
