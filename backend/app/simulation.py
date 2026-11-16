"""Shared, persisted fictional timeline. Never writes to scientific or EVA evidence tables."""
from contextlib import closing
import json
import math
import sqlite3
import time
from uuid import uuid4
from datetime import datetime, timezone
from .db import database_path

SCENARIOS = ('normal', 'predicted', 'ongoing', 'recovery')


def clock_ms():
    return int(time.time() * 1000)


def initial(at):
    return dict(run_id=str(uuid4()), revision=1, base_at=at, elapsed_ms=0,
                anchor_at=at, running=True, speed=1, segments=[dict(start=0, scenario='normal')])


def elapsed(state, at):
    return state['elapsed_ms'] + (max(0, at-state['anchor_at']) * state['speed'] if state['running'] else 0)


def rate_at(state, offset):
    segment = next((s for s in reversed(state['segments']) if s['start'] <= offset), None)
    scenario = segment['scenario'] if segment else 'normal'
    phase = max(0, offset - (segment['start'] if segment else 0)) / 1000
    wave = .025 * math.sin(phase/20)
    return {'normal': .35+wave, 'predicted': .52+wave,
            'ongoing': 1.6+.3*math.sin(phase/45)**2,
            'recovery': .35+1.2*math.exp(-phase/600)}[scenario]


def snapshot(state, at):
    offset = elapsed(state, at)
    now = state['base_at'] + offset
    # A fictional baseline week, 30-second current day and 2-second recent detail.
    # Old samples use a 5-minute grid; boundary points avoid bridging a scenario transition.
    # Anchor each grid to the run, not to a moving window edge. Otherwise every poll
    # resamples the same wave at a different phase, especially visible at 60x.
    def grid(start, end, step):
        return range(math.ceil(start/step)*step, math.ceil(end), step)
    times = set(grid(offset-7*86400000, offset-86400000, 300000))
    times.update(grid(max(0, offset-86400000), offset, 30000))
    times.update(grid(max(0, offset-600000), offset, 2000))
    times.update(grid(offset-86400000, min(0, offset), 300000))
    times.update((offset-7*86400000, offset-86400000))
    times.add(offset)
    for segment in state['segments']:
        if offset-7*86400000 <= segment['start'] <= offset:
            times.add(segment['start'])
            times.add(segment['start']-1)
    points = [dict(at=state['base_at']+t, value=rate_at(state, t)) for t in sorted(times)]
    scenario = state['segments'][-1]['scenario']
    start = state['base_at'] + state['segments'][-1]['start']
    iso = lambda value: datetime.fromtimestamp(value/1000, timezone.utc).isoformat()
    event_offsets = {'normal':None,'predicted':(600000,1200000,3600000),
                     'ongoing':(0,600000,2400000),'recovery':(-3600000,-2400000,0)}[scenario]
    solar = dict(id=f"sim-{state['run_id']}-{len(state['segments'])}", source='MUSTACH SYNTHETIC FIXTURE',
                 provider='MUSTACH LAB', model=f'SYN-SEP / {scenario}', provenance='FORECAST',
                 issued_at=iso(start), valid_from=iso(start), valid_until=iso(start+86400000),
                 occurrence_probability_percent={'normal':18,'predicted':65,'ongoing':100,'recovery':15}[scenario],
                 peak_proton_flux={'normal':2.4,'predicted':12,'ongoing':35,'recovery':4}[scenario],
                 peak_proton_flux_unit='pfu', proton_energy_min_mev=10, proton_energy_max_mev=None,
                 event_start_at=iso(start+event_offsets[0]) if event_offsets else None,
                 event_peak_at=iso(start+event_offsets[1]) if event_offsets else None,
                 event_end_at=iso(start+event_offsets[2]) if event_offsets else None)
    return {**state, 'now':now, 'elapsed_ms':offset, 'scenario':scenario, 'rate':rate_at(state,offset),
            'points':points, 'solar_model':solar, 'provenance':'SIMULATED'}


def access(action=None, expected_revision=None, scenario=None, speed=None):
    at = clock_ms()
    with closing(sqlite3.connect(database_path())) as conn, conn:
        conn.execute('BEGIN IMMEDIATE')
        conn.execute('CREATE TABLE IF NOT EXISTS simulation_state (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL)')
        row = conn.execute('SELECT payload FROM simulation_state WHERE id=1').fetchone()
        state = json.loads(row[0]) if row else initial(at)
        if action:
            if expected_revision != state['revision']:
                raise ValueError('Simulation changed. Reload before controlling it.')
            state['elapsed_ms'] = elapsed(state, at)
            state['anchor_at'] = at
            if action == 'reset':
                revision = state['revision']
                selected = state['segments'][-1]['scenario']
                state = initial(at)
                state['revision'] = revision
                state['running'] = False
                state['segments'][0]['scenario'] = selected
            elif action == 'select':
                if scenario not in SCENARIOS:
                    raise ValueError('Unknown scenario')
                state['segments'].append(dict(start=state['elapsed_ms'], scenario=scenario))
            elif action in ('start', 'resume'):
                state['running'] = True
            elif action == 'pause':
                state['running'] = False
            elif action == 'speed':
                if speed not in (1, 10, 60):
                    raise ValueError('Unsupported speed')
                state['speed'] = speed
            state['revision'] += 1
        if action or not row:
            conn.execute('INSERT OR REPLACE INTO simulation_state VALUES (1, ?)', (json.dumps(state),))
    return snapshot(state, at)
