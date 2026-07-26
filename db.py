import sqlite3
import os
from config import DB_PATH, DATA_DIR


def get_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库和表"""
    # 确保数据目录存在
    os.makedirs(DATA_DIR, exist_ok=True)

    conn = get_connection()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS courses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL UNIQUE,
            created_at  TEXT    DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS lectures (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id   INTEGER NOT NULL,
            title       TEXT    NOT NULL,
            audio_path  TEXT,
            transcript  TEXT,
            note        TEXT,
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            key         TEXT PRIMARY KEY,
            value       TEXT
        );
    ''')
    conn.commit()
    conn.close()


def execute(sql, params=()):
    """执行写操作，返回最后插入的ID"""
    conn = get_connection()
    cursor = conn.execute(sql, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def query(sql, params=()):
    """查询多条记录，返回字典列表"""
    conn = get_connection()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def query_one(sql, params=()):
    """查询单条记录"""
    conn = get_connection()
    row = conn.execute(sql, params).fetchone()
    conn.close()
    return dict(row) if row else None