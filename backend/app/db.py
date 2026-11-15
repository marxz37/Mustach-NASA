"""Persistência local: evidência SIMULATED da ocorrência separada das observações."""
import os
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from . import operational as op
from .measurements import Measurement

DEFAULT_DB = Path(__file__).resolve().parent.parent / "sentinela.sqlite3"


def database_path() -> Path:
    return Path(os.getenv("SENTINELA_DATABASE_PATH", str(DEFAULT_DB)))


def init_db() -> None:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(path)) as conn, conn:
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
        columns = {row[1] for row in conn.execute('PRAGMA table_info(measurements)')}
        for column, sql_type in (('scope', "TEXT NOT NULL DEFAULT 'ENVIRONMENTAL'"),
                                 ('quality', "TEXT NOT NULL DEFAULT 'UNKNOWN'"),
                                 ('collected_at', 'TEXT'), ('source_url', 'TEXT'), ('details_json', 'TEXT'),
                                 ('astronaut_id', 'TEXT'), ('activity_id', 'TEXT'), ('location', 'TEXT')):
            if column not in columns:
                conn.execute(f'ALTER TABLE measurements ADD COLUMN {column} {sql_type}')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_measurements_source_instrument_time ON measurements(source, instrument, measured_at)')
        conn.execute('''CREATE TABLE IF NOT EXISTS scientific_forecasts (
            id TEXT PRIMARY KEY, source TEXT NOT NULL, issued_at TEXT NOT NULL,
            valid_until TEXT, payload_json TEXT NOT NULL, collected_at TEXT NOT NULL,
            source_url TEXT NOT NULL)''')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_forecasts_source_issued ON scientific_forecasts(source, issued_at)')
        conn.execute('''CREATE TABLE IF NOT EXISTS scientific_alerts (
            id TEXT PRIMARY KEY, source TEXT NOT NULL, issued_at TEXT NOT NULL,
            kind TEXT NOT NULL, message TEXT NOT NULL, collected_at TEXT NOT NULL,
            source_url TEXT NOT NULL)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS scientific_events (
            id TEXT PRIMARY KEY, source TEXT NOT NULL, kind TEXT NOT NULL,
            event_at TEXT NOT NULL, payload_json TEXT NOT NULL, collected_at TEXT NOT NULL,
            source_url TEXT NOT NULL)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS ingestion_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, attempted_at TEXT NOT NULL,
            status TEXT NOT NULL, records_added INTEGER NOT NULL DEFAULT 0, error TEXT)''')
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


def get_measurements(limit: int = 500, *, source: str | None = None,
                     quantity: str | None = None, start: str | None = None,
                     end: str | None = None) -> list[dict]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.row_factory = sqlite3.Row
        conditions, args = [], []
        for field, value, operator in (('source', source, '='), ('quantity', quantity, '='),
                                       ('measured_at', start, '>='), ('measured_at', end, '<')):
            if value is not None:
                conditions.append(f'{field} {operator} ?')
                args.append(value)
        where = ' WHERE ' + ' AND '.join(conditions) if conditions else ''
        rows = conn.execute('SELECT * FROM measurements' + where + ' ORDER BY measured_at DESC LIMIT ?', (*args, limit)).fetchall()
        return [{**dict(row), 'details': json.loads(row['details_json']) if row['details_json'] else None}
                for row in rows]


def get_measurement_stats() -> tuple[int, str | None]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        row = conn.execute('SELECT COUNT(*), MAX(collected_at) FROM measurements').fetchone()
        return row[0], row[1]


def save_measurements(items: list[Measurement]) -> int:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        before = conn.total_changes
        for item in items:
            identity = (item.source, item.provenance, item.instrument, item.measured_at.isoformat(),
                        item.quantity, item.value, item.unit, item.mission, item.region, item.scope)
            existing = conn.execute('''SELECT source,provenance,instrument,measured_at,quantity,value,unit,mission,region,scope
                FROM measurements WHERE id = ?''', (item.id,)).fetchone()
            if existing is not None:
                if tuple(existing) != identity:
                    raise ValueError(f'Conflicting measurement ID: {item.id}')
                continue
            conn.execute('''INSERT OR IGNORE INTO measurements
                (id, source, provenance, instrument, measured_at, quantity, value, unit, mission,
                 region, scope, quality, collected_at, source_url, details_json, astronaut_id, activity_id, location)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                (item.id, *identity,
                 item.quality, item.collected_at.isoformat() if item.collected_at else None,
                 item.source_url, json.dumps(item.details) if item.details else None,
                 item.astronaut_id, item.activity_id, item.location))
        return conn.total_changes - before


def save_forecasts(models: list[dict], source_url: str, collected_at: str) -> int:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        before = conn.total_changes
        for model in models:
            conn.execute('''INSERT OR IGNORE INTO scientific_forecasts
                (id, source, issued_at, valid_until, payload_json, collected_at, source_url)
                VALUES (?,?,?,?,?,?,?)''', (model['id'], model['source'], model['issued_at'],
                model.get('valid_until'), json.dumps(model), collected_at, source_url))
        return conn.total_changes - before


def get_forecasts(limit: int = 100) -> list[dict]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        rows = conn.execute('SELECT payload_json FROM scientific_forecasts ORDER BY issued_at DESC LIMIT ?', (limit,)).fetchall()
        return [json.loads(row[0]) for row in rows]


def record_ingestion(source: str, status: str, records_added: int = 0, error: str | None = None) -> None:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.execute('INSERT INTO ingestion_runs(source,attempted_at,status,records_added,error) VALUES (?,?,?,?,?)',
                     (source, datetime.now(timezone.utc).isoformat(), status, records_added, error))


def get_ingestion_runs(limit: int = 30) -> list[dict]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.row_factory = sqlite3.Row
        return [dict(row) for row in conn.execute('SELECT * FROM ingestion_runs ORDER BY id DESC LIMIT ?', (limit,))]


def save_alerts(alerts: list[dict]) -> int:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        before = conn.total_changes
        for alert in alerts:
            conn.execute('''INSERT OR IGNORE INTO scientific_alerts
                (id,source,issued_at,kind,message,collected_at,source_url) VALUES (?,?,?,?,?,?,?)''',
                tuple(alert[key] for key in ('id', 'source', 'issued_at', 'kind', 'message', 'collected_at', 'source_url')))
        return conn.total_changes - before


def get_alerts(limit: int = 30) -> list[dict]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.row_factory = sqlite3.Row
        return [dict(row) for row in conn.execute('SELECT * FROM scientific_alerts ORDER BY issued_at DESC LIMIT ?', (limit,))]


def get_source_states() -> dict[str, dict]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute('''SELECT r.* FROM ingestion_runs r JOIN
            (SELECT source, MAX(id) AS latest FROM ingestion_runs GROUP BY source) x
            ON r.id = x.latest''').fetchall()
        return {row['source']: dict(row) for row in rows}


def save_events(events: list[dict]) -> int:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        before = conn.total_changes
        for event in events:
            conn.execute('''INSERT OR IGNORE INTO scientific_events
                (id,source,kind,event_at,payload_json,collected_at,source_url) VALUES (?,?,?,?,?,?,?)''',
                (event['id'],event['source'],event['kind'],event['event_at'],json.dumps(event),
                 event['collected_at'],event['source_url']))
        return conn.total_changes - before


def get_events(limit: int = 30) -> list[dict]:
    with closing(sqlite3.connect(database_path())) as conn, conn:
        rows = conn.execute('SELECT payload_json FROM scientific_events ORDER BY event_at DESC LIMIT ?', (limit,)).fetchall()
        return [json.loads(row[0]) for row in rows]


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
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.execute('BEGIN IMMEDIATE')
        return _refresh_event(conn, at or op.current_time())


def update_demo_event(expected_revision: int, *, reading_available: bool | None = None,
                      acknowledged_at: str | None = None, scenario_id: str | None = None,
                      measurement: Measurement | None = None) -> bool:
    """Evidence updates and expiry share the same optimistic revision as consultation."""
    with closing(sqlite3.connect(database_path())) as conn, conn:
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
