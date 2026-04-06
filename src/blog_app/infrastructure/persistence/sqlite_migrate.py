"""Best-effort SQLite column adds for existing DBs (no Alembic)."""

from sqlalchemy import Connection, Engine, inspect, text


def _user_columns(conn: Connection) -> set[str]:
    r = conn.execute(text("PRAGMA table_info(users)"))
    return {row[1] for row in r}


def _post_columns(conn: Connection) -> set[str]:
    r = conn.execute(text("PRAGMA table_info(posts)"))
    return {row[1] for row in r}


def ensure_sqlite_columns(engine: Engine) -> None:
    url = str(engine.url)
    if not url.startswith("sqlite"):
        return
    insp = inspect(engine)
    with engine.begin() as conn:
        if insp.has_table("users"):
            cols = _user_columns(conn)
            if "display_name" not in cols:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN display_name VARCHAR(100) NOT NULL DEFAULT ''"
                    )
                )
            cols = _user_columns(conn)
            if "profile_image_path" not in cols:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN profile_image_path VARCHAR(500)")
                )
        if insp.has_table("posts"):
            cols = _post_columns(conn)
            if "image_path" not in cols:
                conn.execute(
                    text("ALTER TABLE posts ADD COLUMN image_path VARCHAR(500)")
                )
