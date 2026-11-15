"""Banco local para medições futuras. Nenhuma amostra é criada automaticamente."""
import os
import sqlite3
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parent.parent / "sentinela.sqlite3"


def database_path() -> Path:
    return Path(os.getenv("SENTINELA_DATABASE_PATH", str(DEFAULT_DB)))


def init_db() -> None:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS measurements (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                provenance TEXT NOT NULL CHECK (provenance IN ('OBSERVED','FORECAST','SIMULATED')),
                instrument TEXT NOT NULL,
                measured_at TEXT NOT NULL,
                quantity TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT NOT NULL,
                mission TEXT NOT NULL,
                region TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_measurements_time ON measurements(measured_at)")
        conn.commit()


def get_measurements(limit: int = 500) -> list[dict]:
    with sqlite3.connect(database_path()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, source, provenance, instrument, measured_at, quantity, value, unit, mission, region "
            "FROM measurements ORDER BY measured_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]
