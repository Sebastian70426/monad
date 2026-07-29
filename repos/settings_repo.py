from db import query_one, execute


def get(key, default=None):
    row = query_one("SELECT value FROM settings WHERE key = ?", (key,))
    return row['value'] if row else default


def set(key, value):
    execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))


def get_all():
    from db import query
    rows = query("SELECT key, value FROM settings")
    return {row['key']: row['value'] for row in rows}


def delete(key):
    execute("DELETE FROM settings WHERE key = ?", (key,))
