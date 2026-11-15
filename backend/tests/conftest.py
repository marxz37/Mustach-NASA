import pytest


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    monkeypatch.setenv('SENTINELA_DATABASE_PATH', str(tmp_path / 'mustach-test.sqlite3'))
