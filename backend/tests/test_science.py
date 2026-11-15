import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3
from urllib.error import HTTPError

import pytest
from fastapi.testclient import TestClient

from app import collect, db, science
from app.backup import backup_database, restore_database
from app.main import app

FIXTURES = Path(__file__).parent / 'fixtures'
AT = datetime(2026, 11, 15, 21, tzinfo=timezone.utc)


def fixture(name):
    return json.loads((FIXTURES / name).read_text(encoding='utf-8'))


def test_radlab_query_uses_documented_filters():
    url = science.radlab_url('DosTel1', collect.RADLAB_START, collect.RADLAB_END)
    assert 'instrument_id=DosTel1' in url
    assert 'timestamp%3E=' in url and 'timestamp%3C' in url
    with pytest.raises(ValueError):
        science.radlab_url('DosTel1', collect.RADLAB_END, collect.RADLAB_START)


def test_radlab_real_fixture_preserves_units_metadata_and_deduplicates(monkeypatch):
    payload = fixture('radlab-dostel1-2022-04-01.json')
    monkeypatch.setattr(science, 'fetch_json', lambda _url: payload)
    with TestClient(app) as client:
        assert collect.run('radlab')['records_added'] == 4
        assert collect.run('radlab')['records_added'] == 0
        rows = client.get('/api/v1/measurements?source=NASA%20OSDR%20RadLab').json()
        assert len(rows) == 4
        absorbed = next(row for row in rows if row['quantity'] == 'absorbed_dose_rate' and row['measured_at'].startswith('2022-04-01T23:00:00'))
        assert absorbed['value'] == 9.815504 and absorbed['unit'] == 'µGy/h'
        assert absorbed['scope'] == 'ENVIRONMENTAL' and absorbed['details']['original']['module'] == 'Columbus'
        assert absorbed['measured_at'].endswith('Z') or absorbed['measured_at'].endswith('+00:00')
    # Reinitializing the schema models an API restart; no observation is re-dated or lost.
    with TestClient(app) as restarted:
        again = restarted.get('/api/v1/measurements?source=NASA%20OSDR%20RadLab').json()
        assert len(again) == 4
        assert next(row for row in again if row['id'] == absorbed['id']) == absorbed


def test_radlab_rejects_invalid_timestamp_and_value():
    payload = fixture('radlab-dostel1-2022-04-01.json')
    payload['data'][0][0] = 'not-a-time'
    with pytest.raises(ValueError):
        science.parse_radlab(payload, 'https://example.test', AT)
    payload['data'][0][0] = '2022-04-01T23:00:00'
    payload['data'][0][2] = -1
    with pytest.raises(ValueError):
        science.parse_radlab(payload, 'https://example.test', AT)


def test_collector_records_network_failure(monkeypatch):
    def timeout(_url):
        raise TimeoutError('test timeout')
    monkeypatch.setattr(science, 'fetch_json', timeout)
    with pytest.raises(TimeoutError):
        collect.run('radlab')
    assert db.get_ingestion_runs()[0]['status'] == 'ERROR'
    assert 'test timeout' in db.get_ingestion_runs()[0]['error']


def test_collector_records_http_error_without_partial_rows(monkeypatch):
    def failed(_url):
        raise HTTPError('https://official.example', 503, 'Unavailable', None, None)
    monkeypatch.setattr(science, 'fetch_json', failed)
    with pytest.raises(HTTPError):
        collect.run('goes')
    assert db.get_ingestion_runs()[0]['status'] == 'ERROR'
    assert db.get_measurements() == []


def test_goes_channels_are_distinct_and_no_dose_is_derived(monkeypatch):
    source = [{'time_tag':'2026-11-15T20:00:00Z','satellite':18,'energy':channel,'flux':value}
              for channel,value in [('>=10 MeV',2.5),('>=50 MeV',0.4),('>=100 MeV',0.1)]]
    monkeypatch.setattr(science, 'fetch_json', lambda _url: source)
    with TestClient(app) as client:
        assert collect.run('goes')['records_added'] == 3
        rows = client.get('/api/v1/measurements?quantity=integral_proton_flux').json()
        assert {row['instrument'] for row in rows} == {'GOES-18 >=10 MeV', 'GOES-18 >=50 MeV', 'GOES-18 >=100 MeV'}
        assert all(row['unit'] == 'pfu' and row['scope'] == 'ENVIRONMENTAL' for row in rows)
        assert not any(row['quantity'].endswith('dose_rate') for row in rows)
    with pytest.raises(ValueError):
        science.parse_goes([dict(source[0], flux=-1)], AT)


def test_noaa_three_day_probabilities_preserve_horizons():
    rows = science.parse_noaa_probabilities([{'date':'2026-11-15T00:00:00',
        '10mev_protons_1_day':5,'10mev_protons_2_day':10,'10mev_protons_3_day':15}],
        ':Issued: 2026 Nov 15 1230 UTC\nSolar Radiation Storm Forecast')
    assert [row['occurrence_probability_percent'] for row in rows] == [5,10,15]
    assert len({row['valid_from'] for row in rows}) == 3
    assert all(row['peak_proton_flux'] is None for row in rows)
    with pytest.raises(ValueError):
        science.parse_noaa_probabilities([], ':Issued: 2026 Nov 15 1230 UTC')
    with pytest.raises(ValueError):
        science.parse_noaa_probabilities([{'date':'2026-11-14T00:00:00'}], ':Issued: 2026 Nov 15 1230 UTC')


def test_ccmc_historical_fixture_is_not_current_forecast():
    models = science.parse_ccmc_release(fixture('ccmc-release-2026-03-10.json'), science.CCMC_RELEASE_URL)
    assert len(models) == 2
    assert models[0]['peak_proton_flux'] == 0.000071988
    assert models[0]['peak_proton_flux_unit'] == 'MeV^-1*s^-1*cm^-2*sr^-1'
    assert models[0]['proton_energy_min_mev'] == 15.8
    with TestClient(app) as client:
        assert db.save_forecasts(models, science.CCMC_RELEASE_URL, AT.isoformat()) == 2
        assert client.get('/api/v1/solar/forecast').json() == {'status':'no_forecast','models':[]}
        assert len(client.get('/api/v1/solar/forecast/history').json()) == 2


def test_ccmc_incompatible_unit_rejected():
    payload = fixture('ccmc-release-2026-03-10.json')
    payload['sep_forecast_submission']['forecasts'][0]['peak_intensity']['units'] = 'pfu'
    with pytest.raises(ValueError):
        science.parse_ccmc_release(payload, science.CCMC_RELEASE_URL)


def test_ccmc_incomplete_model_keeps_missing_fields_missing():
    payload = fixture('ccmc-release-2026-03-10.json')
    payload['sep_forecast_submission']['forecasts'][0].pop('peak_intensity')
    models = science.parse_ccmc_release(payload, science.CCMC_RELEASE_URL)
    assert len(models) == 1
    assert models[0]['occurrence_probability_percent'] is None
    assert models[0]['event_start_at'] is None and models[0]['event_end_at'] is None


def test_noaa_alert_type_is_kept_separate_from_forecast():
    alerts = science.parse_noaa_alerts([{'product_id':'A20F',
        'issue_datetime':'2026-11-15 13:34:32.160',
        'message':'Space Weather Message\nWATCH: Geomagnetic Storm Category G1 Predicted'}], AT)
    assert alerts[0]['kind'] == 'WATCH'
    assert alerts[0]['source'] == 'NOAA SWPC'


def test_noaa_forecast_persists_across_restart_and_keeps_models_separate():
    now = datetime.now(timezone.utc)
    day = now.strftime('%Y-%m-%dT00:00:00')
    issued = now.strftime(':Issued: %Y %b %d %H%M UTC')
    models = science.parse_noaa_probabilities([{'date':day,
        '10mev_protons_1_day':5,'10mev_protons_2_day':10,'10mev_protons_3_day':15}], issued)
    with TestClient(app) as client:
        assert db.save_forecasts(models, science.NOAA_PROB_URL, now.isoformat()) == 3
        response = client.get('/api/v1/solar/forecast').json()
        assert response['status'] == 'available'
        assert [item['occurrence_probability_percent'] for item in response['models']] == [5,10,15]
    with TestClient(app) as restarted:
        assert len(restarted.get('/api/v1/solar/forecast').json()['models']) == 3


def test_donki_historical_event_is_context_not_a_dose():
    payload = [{'sepID':'2024-05-09T13:59:00-SEP-001','eventTime':'2024-05-09T13:59Z',
                'instruments':[{'displayName':'MODEL: REleASE:ACE/EPAM 15.8-39.8 MeV'}],
                'link':'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30609/-1',
                'linkedEvents':[{'activityID':'2024-05-09T08:45:00-FLR-001'}]}]
    events = science.parse_donki_sep(payload, AT)
    with TestClient(app) as client:
        assert db.save_events(events) == 1
        assert db.save_events(events) == 0
        result = client.get('/api/v1/solar-events').json()
        assert result[0]['kind'] == 'SEP' and 'dose' not in result[0]


def test_offline_source_failure_does_not_erase_local_history(monkeypatch):
    payload = fixture('radlab-dostel1-2022-04-01.json')
    monkeypatch.setattr(science, 'fetch_json', lambda _url: payload)
    with TestClient(app) as client:
        collect.run('radlab')
        def unavailable(_url):
            raise TimeoutError('offline')
        monkeypatch.setattr(science, 'fetch_json', unavailable)
        with pytest.raises(TimeoutError):
            collect.run('radlab')
        assert len(client.get('/api/v1/measurements?source=NASA%20OSDR%20RadLab').json()) == 4
        source = next(item for item in client.get('/api/v1/sources').json() if item['id'] == 'radlab')
        assert source['connected'] is False and 'offline' in source['error']


def test_ingest_requires_token_and_validates_scope_and_unit(monkeypatch):
    body = {'id':'local-1','source':'LOCAL_SENSOR','provenance':'OBSERVED','instrument':'DOS-1',
            'measured_at':'2022-04-01T23:00:00Z','quantity':'absorbed_dose_rate','value':1.2,
            'unit':'µGy/h','mission':'TEST','scope':'ENVIRONMENTAL'}
    with TestClient(app) as client:
        assert client.post('/api/v1/science/measurements',json=body).status_code == 503
        monkeypatch.setenv('MUSTACH_INGEST_TOKEN', 'test-secret')
        assert client.post('/api/v1/science/measurements',json=body).status_code == 401
        headers={'X-Mustach-Ingest-Token':'test-secret'}
        assert client.post('/api/v1/science/measurements',json=body,headers=headers).json()['inserted'] is True
        assert client.post('/api/v1/science/measurements',json=body,headers=headers).json()['inserted'] is False
        assert client.post('/api/v1/science/measurements',json=dict(body,value=2.4),headers=headers).status_code == 409
        assert client.post('/api/v1/science/measurements',json=dict(body,unit='µSv/h'),headers=headers).status_code == 422
        rejected = db.get_ingestion_runs()[0]
        assert rejected['source'] == 'local-measurement' and rejected['status'] == 'ERROR'
        assert client.post('/api/v1/science/measurements',json=dict(body,source='NASA OSDR RadLab'),headers=headers).status_code == 422
        assert client.post('/api/v1/science/measurements',json=dict(body,scope='PERSONAL'),headers=headers).status_code == 422
        assert client.get('/api/v1/measurements?start=2022-04-01T23:00:00').status_code == 422


def test_online_sqlite_backup_and_safe_restore(tmp_path):
    db.init_db()
    destination=backup_database(tmp_path / 'saved.sqlite3')
    with sqlite3.connect(destination) as conn:
        assert conn.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    with pytest.raises(FileExistsError):
        restore_database(destination)
    assert restore_database(destination,force=True) == db.database_path().resolve()
    assert db.database_path().with_name(db.database_path().name+'.pre-restore').exists()
