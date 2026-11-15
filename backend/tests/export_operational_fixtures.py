"""Export browser fixtures using the actual handlers and one fixed engineering clock."""
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from datetime import datetime, timezone
from app import operational as op
from app.db import init_db, get_demo_event, update_demo_event
from app.main import demo_operational_event, receive_demo_measurement, DemoMeasurementUpdate


def export():
    at = datetime(2026, 11, 15, 12, tzinfo=timezone.utc)
    with tempfile.TemporaryDirectory(prefix='mustach-fixtures-') as folder, patch.dict('os.environ', {'SENTINELA_DATABASE_PATH': str(Path(folder) / 'demo.sqlite3'), 'MUSTACH_DEMO_MAX_READING_AGE_SECONDS': '900'}), patch.object(op, 'current_time', return_value=at):
        init_db()
        fixtures = {}
        for scenario in op.SCENARIO_IDS:
            for recorded in (False, True):
                update_demo_event(get_demo_event()['revision'], scenario_id=scenario)
                if recorded:
                    update_demo_event(get_demo_event()['revision'], acknowledged_at=at.isoformat())
                event = demo_operational_event().model_dump(mode='json')
                event['revision'] = 2 if recorded else 1
                fixtures[scenario + ('_recorded' if recorded else '')] = event
        update_demo_event(get_demo_event()['revision'], scenario_id='missing_personal')
        received = receive_demo_measurement(DemoMeasurementUpdate(expected_revision=get_demo_event()['revision'])).model_dump(mode='json')
        received['revision'] = 3
        fixtures['personal_received'] = received
        destination = Path(__file__).resolve().parents[2] / 'shared/testing/operational-events.json'
        destination.write_text(json.dumps(fixtures, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'Exported {len(fixtures)} API fixtures')


if __name__ == '__main__':
    export()
