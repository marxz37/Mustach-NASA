from datetime import datetime, timedelta, timezone
import sqlite3
import pytest
from fastapi.testclient import TestClient
from app import db, science, simulation
from app.main import app
from app.solar_notices import eligible_notices

AT = datetime(2026, 11, 15, 20, tzinfo=timezone.utc)


def test_shared_clock_pause_resume_speed_reset_and_restart(monkeypatch):
    clock = [int(AT.timestamp()*1000)]
    monkeypatch.setattr(simulation, 'clock_ms', lambda: clock[0])
    with TestClient(app) as web, TestClient(app) as watch:
        state = web.get('/api/v1/demo/simulation').json()
        def command(action, **kwargs):
            nonlocal state
            result = web.post('/api/v1/demo/simulation', json=dict(action=action, expected_revision=state['revision'], **kwargs))
            assert result.status_code == 200
            state = result.json()
            return state
        clock[0] += 10000
        command('pause')
        assert state['elapsed_ms']==10000
        clock[0] += 10000
        assert watch.get('/api/v1/demo/simulation').json()['now']==state['now']
        command('speed', speed=60)
        command('resume')
        clock[0] += 1000
        command('pause')
        assert state['elapsed_ms']==70000
        assert watch.get('/api/v1/demo/simulation').json()==state
        old_id=state['run_id']
        command('reset')
        assert state['run_id']!=old_id and state['elapsed_ms']==0 and not state['running']
        assert web.post('/api/v1/demo/simulation',json=dict(action='pause',expected_revision=1)).status_code==409
    with TestClient(app) as restarted:
        assert restarted.get('/api/v1/demo/simulation').json()==state


@pytest.mark.parametrize('scenario', simulation.SCENARIOS)
def test_scenarios_evolve_without_touching_scientific_or_eva_evidence(scenario, monkeypatch):
    clock=[int(AT.timestamp()*1000)]
    monkeypatch.setattr(simulation,'clock_ms',lambda:clock[0])
    with TestClient(app) as client:
        eva=client.get('/api/v1/demo/operational-event').json()
        state=simulation.access()
        state=simulation.access('select',state['revision'],scenario)
        initial_rate=state['rate']
        clock[0]+=600000
        later=simulation.access()
        assert later['scenario']==scenario and later['rate']!=initial_rate
        assert later['provenance']=='SIMULATED'
        assert later['solar_model']['source']=='MUSTACH SYNTHETIC FIXTURE'
        if scenario=='recovery':
            assert later['rate']<initial_rate
        assert all(p['value']>=0 for p in later['points'])
        assert client.get('/api/v1/measurements').json()==[]
        assert client.get('/api/v1/solar/forecast/history').json()==[]
        assert client.get('/api/v1/demo/operational-event').json()==eva


def store_alert(message, at=AT, validity=None):
    raw=[dict(product_id=message,issue_datetime=at.isoformat(),message=message+(f'\nValid To: {validity}' if validity else ''))]
    db.save_alerts(science.parse_noaa_alerts(raw, AT))


def test_only_recent_proton_notices_never_g_r_electron_or_cancelled():
    db.init_db()
    store_alert('ALERT: Proton event threshold reached')
    store_alert('WARNING: Proton event expected',validity='2026 Nov 15 2200 UTC')
    store_alert('ALERT: Geomagnetic G3 reached')
    store_alert('ALERT: Electron flux increased')
    store_alert('WARNING: Proton event cancelled')
    store_alert('ALERT: Proton event old',AT-timedelta(days=2))
    store_alert('ALERT: Proton event future',AT+timedelta(hours=1))
    store_alert('WARNING: Proton event expired',validity='2026 Nov 15 1900 UTC')
    notices=eligible_notices(AT+timedelta(minutes=1))
    assert len(notices)==2
    assert {n['provenance'] for n in notices}=={'OBSERVED','FORECAST'}
    assert eligible_notices(AT+timedelta(days=3))==[]
    assert eligible_notices(AT+timedelta(minutes=1))==notices


def test_forecast_demo_policy_small_probabilities_units_and_expiry():
    db.init_db()
    models=science.parse_noaa_probabilities([dict(date='2026-11-15T00:00:00',
        **{'10mev_protons_1_day':5,'10mev_protons_2_day':60,'10mev_protons_3_day':65})],
        ':Issued: 2026 Nov 15 1230 UTC')
    db.save_forecasts(models,science.NOAA_PROB_URL,AT.isoformat())
    notices=eligible_notices(AT)
    assert len(notices)==1 and notices[0]['kind']=='FORECAST'
    assert '60%' in notices[0]['detail']
    assert eligible_notices(AT+timedelta(days=5))==[]


def test_official_cancellation_supersedes_previous_warning_product():
    db.init_db()
    raw=[dict(product_id='WARPX1',issue_datetime=AT.isoformat(),message='WARNING: Proton event expected\nValid To: 2026 Nov 15 2200 UTC'),
         dict(product_id='WARPX1',issue_datetime=(AT+timedelta(minutes=1)).isoformat(),message='CANCEL WARNING: Proton event warning cancelled')]
    db.save_alerts(science.parse_noaa_alerts(raw,AT))
    assert len(eligible_notices(AT))==1
    assert eligible_notices(AT+timedelta(minutes=2))==[]


def test_ccmc_attention_is_channel_specific_and_differential_not_pfu():
    import json
    from pathlib import Path
    db.init_db()
    payload=json.loads((Path(__file__).parent/'fixtures/ccmc-release-2026-03-10.json').read_text())
    root=payload['sep_forecast_submission']
    root['issue_time']=AT.isoformat()
    for row in root['forecasts']:
        row['prediction_window']={'start_time':AT.isoformat(),'end_time':(AT+timedelta(minutes=30)).isoformat()}
        row['peak_intensity']['intensity']=.2
    models=science.parse_ccmc_release(payload,science.CCMC_RELEASE_URL)
    db.save_forecasts(models,science.CCMC_RELEASE_URL,AT.isoformat())
    notices=eligible_notices(AT)
    assert len(notices)==2
    assert all('MeV^-1' in n['detail'] and 'pfu' not in n['detail'] for n in notices)


def test_restart_preserves_forecast_event_alert_and_backup_integrity(tmp_path):
    from app.backup import backup_database, restore_database
    with TestClient(app):
        store_alert('ALERT: Proton event threshold reached')
        before=db.get_alerts()
        target=backup_database(tmp_path/'copy.sqlite3')
        restore_database(target,force=True)
    with TestClient(app):
        assert db.get_alerts()==before
        with sqlite3.connect(db.database_path()) as conn:
            assert conn.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
