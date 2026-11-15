import pytest


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    monkeypatch.setenv('SENTINELA_DATABASE_PATH', str(tmp_path / 'mustach-test.sqlite3'))


@pytest.fixture(autouse=True)
def deterministic_engineering_clock(monkeypatch):
    from datetime import datetime, timezone
    from app import operational
    monkeypatch.setattr(operational, 'current_time', lambda: datetime(2026, 11, 15, 12, tzinfo=timezone.utc))
    monkeypatch.setenv('MUSTACH_DEMO_MAX_READING_AGE_SECONDS', '900')
