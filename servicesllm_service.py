from openai import OpenAI
import os


def _load_prompt():
    """读取 System Prompt"""
    prompt_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'prompts', 'note_prompt.txt'
    )
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()


def generate_note(transcript, course_name, api_key):
    """调用 DeepSeek API 生成笔记"""
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com/v1"
    )

    system_prompt = _load_prompt().replace("{course_name}", course_name)

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"课堂转录文字：\n\n{transcript}"}
        ],
        temperature=0.7,
        max_tokens=4000
    )

    return response.choices[0].message.content