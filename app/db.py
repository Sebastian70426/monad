import sqlite3
import os
from contextlib import contextmanager
from config import DB_PATH, DATA_DIR


def get_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db():
    """上下文管理器：自动 commit / rollback / close。

    用法：
        with get_db() as conn:
            conn.execute("INSERT INTO ...")
            conn.execute("UPDATE ...")
        # 退出时自动 commit；如果中间抛异常，自动 rollback
    """
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """初始化数据库表"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with get_db() as conn:
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

        CREATE TABLE IF NOT EXISTS documents (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id   INTEGER NOT NULL,
            filename    TEXT    NOT NULL,
            file_path   TEXT    NOT NULL,
            file_type   TEXT    NOT NULL,
            content     TEXT,
            chunk_count INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        CREATE TABLE IF NOT EXISTS chat_sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id   INTEGER,
            lecture_id  INTEGER,
            title       TEXT    DEFAULT 'New Chat',
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            updated_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (course_id) REFERENCES courses(id),
            FOREIGN KEY (lecture_id) REFERENCES lectures(id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id  INTEGER NOT NULL,
            role        TEXT    NOT NULL,
            content     TEXT    NOT NULL,
            sources     TEXT,
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS quizzes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id   INTEGER NOT NULL,
            lecture_id  INTEGER,
            question    TEXT    NOT NULL,
            options     TEXT,
            answer      TEXT    NOT NULL,
            explanation TEXT,
            difficulty  TEXT    DEFAULT 'medium',
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (course_id) REFERENCES courses(id),
            FOREIGN KEY (lecture_id) REFERENCES lectures(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id     INTEGER NOT NULL,
            quality     INTEGER NOT NULL,
            ease_factor REAL    DEFAULT 2.5,
            interval    INTEGER DEFAULT 1,
            repetitions INTEGER DEFAULT 0,
            next_review TEXT    NOT NULL,
            last_review TEXT,
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        );

        CREATE TABLE IF NOT EXISTS knowledge_points (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id   INTEGER NOT NULL,
            name        TEXT    NOT NULL,
            description TEXT,
            parent_id   INTEGER,
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (course_id) REFERENCES courses(id),
            FOREIGN KEY (parent_id) REFERENCES knowledge_points(id)
        );

        CREATE TABLE IF NOT EXISTS knowledge_dependencies (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            point_id    INTEGER NOT NULL,
            depends_on_id INTEGER NOT NULL,
            FOREIGN KEY (point_id) REFERENCES knowledge_points(id),
            FOREIGN KEY (depends_on_id) REFERENCES knowledge_points(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_knowledge_points (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id     INTEGER NOT NULL,
            point_id    INTEGER NOT NULL,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
            FOREIGN KEY (point_id) REFERENCES knowledge_points(id)
        );

        CREATE TABLE IF NOT EXISTS knowledge_mastery (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            point_id    INTEGER NOT NULL UNIQUE,
            mastery_level  REAL DEFAULT 0.0,
            total_reviews  INTEGER DEFAULT 0,
            correct_reviews INTEGER DEFAULT 0,
            last_updated   TEXT,
            FOREIGN KEY (point_id) REFERENCES knowledge_points(id)
        );
        ''')


def execute(sql, params=()):
    """执行写操作，返回最后插入的 ID"""
    with get_db() as conn:
        cursor = conn.execute(sql, params)
        return cursor.lastrowid


def query(sql, params=()):
    """查询多条记录，返回字典列表"""
    with get_db() as conn:
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]


def query_one(sql, params=()):
    """查询单条记录"""
    with get_db() as conn:
        row = conn.execute(sql, params).fetchone()
        return dict(row) if row else None