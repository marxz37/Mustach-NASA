from fastapi.testclient import TestClient
from app.main import app


def test_health():
    with TestClient(app) as client:
        response = client.get('/health')
        assert response.status_code == 200
        assert response.json()['prototype'] is True


def test_measurements_empty():
    with TestClient(app) as client:
        response = client.get('/api/v1/measurements')
        assert response.status_code == 200
        assert response.json() == []


def test_source_provenance():
    with TestClient(app) as client:
        response = client.get('/api/v1/sources')
        assert response.status_code == 200
        assert all(source['connected'] is False for source in response.json())


def test_limit_validation():
    with TestClient(app) as client:
        assert client.get('/api/v1/measurements?limit=0').status_code == 422
