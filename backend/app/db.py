"""Persistência local: evidência SIMULATED da ocorrência separada das observações."""
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from . import operational as op
from .measurements import Measurement

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
        for column in ('context_json', 'assessment_signature', 'reading_received_at'):
            if column not in columns:
                conn.execute(f'ALTER TABLE demo_operational_event ADD COLUMN {column} TEXT')
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM demo_operational_event WHERE id = 'DEMO-EVT-001'").fetchone()
        if row['context_json'] is None:
            context = op.build_scenario(row['scenario_id'])
            signature = op.assessment_signature(op.assess_preparation(context, False))
            # Old acknowledgements did not cover structured evidence; invalidate once on migration.
            conn.execute("UPDATE demo_operational_event SET context_json = ?, assessment_signature = ?, "
                         "revision = revision + CASE WHEN acknowledged_at IS NULL THEN 0 ELSE 1 END, acknowledged_at = NULL WHERE id = ?",
                         (context.model_dump_json(), signature, 'DEMO-EVT-001'))
        conn.commit()


def get_measurements(limit: int = 500) -> list[dict]:
    with sqlite3.connect(database_path()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, source, provenance, instrument, measured_at, quantity, value, unit, mission, region "
            "FROM measurements ORDER BY measured_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]


def _refresh_event(conn: sqlite3.Connection, at: datetime) -> dict:
    conn.row_factory = sqlite3.Row
    row = dict(conn.execute("SELECT * FROM demo_operational_event WHERE id = 'DEMO-EVT-001'").fetchone())
    context = op.ScenarioInputs.model_validate_json(row['context_json'])
    assessment = op.assess_preparation(context, row['acknowledged_at'] is not None, at)
    signature = op.assessment_signature(assessment)
    if signature != row['assessment_signature']:
        conn.execute("UPDATE demo_operational_event SET acknowledged_at = NULL, revision = revision + 1, "
                     "assessment_signature = ? WHERE id = ?", (signature, 'DEMO-EVT-001'))
        row['revision'] += 1
        row['acknowledged_at'] = None
        assessment = op.assess_preparation(context, False, at)
    row['_context'], row['_assessment'], row['_evaluated_at'] = context, assessment, at
    return row


def get_demo_event(at: datetime | None = None) -> dict:
    with sqlite3.connect(database_path()) as conn:
        conn.execute('BEGIN IMMEDIATE')
        return _refresh_event(conn, at or op.current_time())


def update_demo_event(expected_revision: int, *, reading_available: bool | None = None,
                      acknowledged_at: str | None = None, scenario_id: str | None = None,
                      measurement: Measurement | None = None) -> bool:
    """Evidence updates and expiry share the same optimistic revision as consultation."""
    with sqlite3.connect(database_path()) as conn:
        conn.execute('BEGIN IMMEDIATE')
        at = op.current_time()
        row = _refresh_event(conn, at)
        if row['revision'] != expected_revision:
            return False
        if reading_available is not None or scenario_id is not None or measurement is not None:
            if measurement is None:
                scenario_id = scenario_id or ('solar_review' if reading_available else 'missing_personal')
                context = op.build_scenario(scenario_id, at)
            else:
                scenario_id = row['scenario_id']
                context = row['_context'].model_copy(update={'personal_measurement': measurement})
            assessment = op.assess_preparation(context, False, at)
            conn.execute("UPDATE demo_operational_event SET context_json = ?, scenario_id = ?, personal_reading_available = ?, "
                         "acknowledged_at = NULL, revision = revision + 1, assessment_signature = ?, reading_received_at = ? WHERE id = ?",
                         (context.model_dump_json(), scenario_id, int(assessment.personal_check.state == 'USABLE'),
                          op.assessment_signature(assessment), at.isoformat() if measurement else None, 'DEMO-EVT-001'))
        else:
            conn.execute("UPDATE demo_operational_event SET acknowledged_at = COALESCE(acknowledged_at, ?), "
                         "revision = revision + 1 WHERE id = ?", (acknowledged_at, 'DEMO-EVT-001'))
        return True
