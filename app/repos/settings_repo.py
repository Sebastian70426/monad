from db import query_one, execute


def get(key, default=None):
    row = query_one("SELECT value FROM settings WHERE key = ?", (key,))
    return row['value'] if row else default


def set(key, value):
    execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))


def delete(key):
    execute("DELETE FROM settings WHERE key = ?", (key,))
