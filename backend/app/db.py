"""Banco local para medições futuras. Nenhuma amostra é criada automaticamente."""
import os
import sqlite3
from pathlib import Path
from .operational import SCENARIOS

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
        # Demo workflow is deliberately separate from scientific measurements.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS demo_operational_event (
                id TEXT PRIMARY KEY,
                personal_reading_available INTEGER NOT NULL DEFAULT 0,
                acknowledged_at TEXT,
                revision INTEGER NOT NULL DEFAULT 1
            )
        """)
        conn.execute("INSERT OR IGNORE INTO demo_operational_event (id) VALUES ('DEMO-EVT-001')")
        # Additive migration preserves records created by V0.8.
        columns = {row[1] for row in conn.execute('PRAGMA table_info(demo_operational_event)')}
        if 'scenario_id' not in columns:
            conn.execute("ALTER TABLE demo_operational_event ADD COLUMN scenario_id TEXT NOT NULL DEFAULT 'missing_personal'")
            conn.execute("UPDATE demo_operational_event SET scenario_id = CASE WHEN personal_reading_available = 1 THEN 'solar_review' ELSE 'missing_personal' END")
        conn.commit()


def get_measurements(limit: int = 500) -> list[dict]:
    with sqlite3.connect(database_path()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, source, provenance, instrument, measured_at, quantity, value, unit, mission, region "
            "FROM measurements ORDER BY measured_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_demo_event() -> dict:
    with sqlite3.connect(database_path()) as conn:
        conn.row_factory = sqlite3.Row
        return dict(conn.execute("SELECT * FROM demo_operational_event WHERE id = 'DEMO-EVT-001'").fetchone())


def update_demo_event(expected_revision: int, *, reading_available: bool | None = None,
                      acknowledged_at: str | None = None, scenario_id: str | None = None) -> bool:
    """Compare-and-set avoids registering a check against an outdated scenario."""
    with sqlite3.connect(database_path()) as conn:
        if reading_available is not None or scenario_id is not None:
            scenario_id = scenario_id or ('solar_review' if reading_available else 'missing_personal')
            reading_available = SCENARIOS[scenario_id].personal_reading_available
            result = conn.execute(
                "UPDATE demo_operational_event SET personal_reading_available = ?, scenario_id = ?, "
                "acknowledged_at = NULL, revision = revision + 1 WHERE id = ? AND revision = ?",
                (int(reading_available), scenario_id, 'DEMO-EVT-001', expected_revision),
            )
        else:
            result = conn.execute(
                "UPDATE demo_operational_event SET acknowledged_at = COALESCE(acknowledged_at, ?), "
                "revision = revision + 1 WHERE id = ? AND revision = ?",
                (acknowledged_at, 'DEMO-EVT-001', expected_revision),
            )
        return result.rowcount == 1
