"""Official-source adapters. Network access is explicit; importing this module never collects data."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import json
import math
import os
import re
from urllib.parse import quote
from urllib.request import Request, urlopen

from .measurements import Measurement

RADLAB_BASE = 'https://visualization.osdr.nasa.gov/radlab/api/'
GOES_URL = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json'
NOAA_PROB_URL = 'https://services.swpc.noaa.gov/json/solar_probabilities.json'
NOAA_TEXT_URL = 'https://services.swpc.noaa.gov/text/3-day-forecast.txt'
NOAA_ALERTS_URL = 'https://services.swpc.noaa.gov/products/alerts.json'
CCMC_RELEASE_URL = 'https://iswa.ccmc.gsfc.nasa.gov/api/redirect?dataID=1215'
DONKI_SEP_BASE = 'https://api.nasa.gov/DONKI/SEP'


def fetch_text(url: str) -> str:
    with urlopen(Request(url, headers={'User-Agent': 'Radiance-Research/0.5 (NASA Space Apps)'}), timeout=20) as response:
        content = response.read(4_000_001)
        if len(content) > 4_000_000:
            raise ValueError('Scientific response exceeds 4 MB limit')
        return content.decode('utf-8')


def fetch_json(url: str):
    return json.loads(fetch_text(url))


def fetch_json_with_url(url: str):
    """Return data and the resolved source URL (important for CCMC's latest redirect)."""
    with urlopen(Request(url, headers={'User-Agent': 'Radiance-Research/0.5 (NASA Space Apps)'}), timeout=20) as response:
        content = response.read(4_000_001)
        if len(content) > 4_000_000:
            raise ValueError('Scientific response exceeds 4 MB limit')
        return json.loads(content), response.geturl()


def utc_timestamp(value: str, *, radlab: bool = False) -> datetime:
    if not isinstance(value, str):
        raise ValueError('Timestamp is missing')
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        if not radlab:
            raise ValueError('Timestamp has no timezone')
        # RadLab API emits UTC timestamps without an offset.
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def finite_nonnegative(value) -> float:
    if isinstance(value, bool):
        raise ValueError('Boolean is not a measurement')
    number = float(value)
    if not math.isfinite(number) or number < 0:
        raise ValueError('Invalid nonnegative number')
    return number


def record_id(*parts: str) -> str:
    return sha256('|'.join(parts).encode('utf-8')).hexdigest()[:32]


def radlab_url(instrument_id: str, start: datetime, end: datetime) -> str:
    if not re.fullmatch(r'[A-Za-z0-9_-]+', instrument_id):
        raise ValueError('Invalid instrument ID')
    if end <= start or end - start > timedelta(days=2):
        raise ValueError('RadLab interval must be positive and at most two days')
    lower = quote(start.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S'))
    upper = quote(end.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S'))
    # RadLab's comparison operators are part of each query token, not ordinary key=value pairs.
    fields = ('absorbed_dose_rate', 'dose_equivalent_rate', 'flux', 'instrument_family',
              'spacecraft', 'module', 'latitude', 'longitude', 'altitude', 'b', 'l')
    return (f'{RADLAB_BASE}?instrument_id={instrument_id}&timestamp%3E={lower}&timestamp%3C{upper}&'
            + '&'.join(fields) + '&format=json')


def parse_radlab(payload: dict, url: str, collected_at: datetime) -> list[Measurement]:
    columns, data = payload.get('columns'), payload.get('data')
    if not isinstance(columns, list) or not isinstance(data, list) or not {'timestamp', 'instrument_id'} <= set(columns):
        raise ValueError('Invalid RadLab table')
    output = []
    units = {'absorbed_dose_rate': 'µGy/h', 'dose_equivalent_rate': 'µSv/h',
             'flux': 'cm^-2 sr^-1 s^-1'}
    for values in data:
        if not isinstance(values, list) or len(values) != len(columns):
            raise ValueError('Malformed RadLab row')
        raw = dict(zip(columns, values))
        at = utc_timestamp(raw['timestamp'], radlab=True)
        instrument = str(raw['instrument_id'])
        mission = str(raw.get('spacecraft') or 'UNKNOWN')
        if not instrument or mission == 'UNKNOWN':
            raise ValueError('RadLab row missing instrument or spacecraft')
        for quantity, unit in units.items():
            if raw.get(quantity) is None:
                continue
            output.append(Measurement(id=record_id('radlab', instrument, at.isoformat(), quantity),
                source='NASA OSDR RadLab', provenance='OBSERVED', instrument=instrument,
                measured_at=at, quantity=quantity, value=finite_nonnegative(raw[quantity]),
                unit=unit, mission=mission, region=raw.get('module'), scope='ENVIRONMENTAL',
                quality='VALID', collected_at=collected_at, source_url=url,
                details={'original': raw, 'timestamp_assumption': 'UTC (RadLab API)'}))
    return output


def parse_goes(payload: list, collected_at: datetime) -> list[Measurement]:
    if not isinstance(payload, list):
        raise ValueError('Invalid GOES response')
    output = []
    for raw in payload:
        if not isinstance(raw, dict) or raw.get('energy') not in ('>=10 MeV', '>=50 MeV', '>=100 MeV'):
            continue
        if raw.get('flux') is None:
            continue
        at = utc_timestamp(raw['time_tag'])
        channel = raw['energy']
        satellite = str(raw.get('satellite') or 'unknown')
        output.append(Measurement(id=record_id('goes', satellite, channel, at.isoformat()),
            source='NOAA GOES/SWPC', provenance='OBSERVED', instrument=f'GOES-{satellite} {channel}',
            measured_at=at, quantity='integral_proton_flux', value=finite_nonnegative(raw['flux']),
            unit='pfu', mission=f'GOES-{satellite}', scope='ENVIRONMENTAL', quality='VALID',
            collected_at=collected_at, source_url=GOES_URL,
            details={'energy_channel': channel, 'flux_type': 'integral', 'original': raw}))
    return output


def parse_noaa_probabilities(payload: list, forecast_text: str) -> list[dict]:
    if not isinstance(payload, list) or not payload:
        raise ValueError('NOAA probabilities unavailable')
    match = re.search(r'^:Issued:\s*(\d{4} \w{3} \d{1,2} \d{4}) UTC', forecast_text, re.M)
    if not match:
        raise ValueError('NOAA forecast issuance not found')
    issued = datetime.strptime(match.group(1), '%Y %b %d %H%M').replace(tzinfo=timezone.utc)
    row = max(payload, key=lambda item: item['date'])
    day = utc_timestamp(row['date'], radlab=True)
    if day.date() != issued.date():
        raise ValueError('NOAA JSON date and issued forecast disagree')
    result = []
    for horizon in (1, 2, 3):
        probability = finite_nonnegative(row[f'10mev_protons_{horizon}_day'])
        if probability > 100:
            raise ValueError('NOAA probability exceeds 100 percent')
        start = day + timedelta(days=horizon - 1)
        end = start + timedelta(days=1)
        result.append({'id': record_id('noaa-prob', issued.isoformat(), str(horizon)),
            'source': 'NOAA SWPC', 'provider': 'NOAA SWPC', 'model': '3-Day Forecast',
            'provenance': 'FORECAST', 'issued_at': issued.isoformat(),
            'valid_from': start.isoformat(), 'valid_until': end.isoformat(),
            'occurrence_probability_percent': probability, 'peak_proton_flux': None,
            'peak_proton_flux_unit': None, 'proton_energy_min_mev': 10.0,
            'proton_energy_max_mev': None, 'event_start_at': None, 'event_peak_at': None,
            'event_end_at': None, 'forecast_horizon_day': horizon,
            'threshold': 'S1 or greater (>=10 MeV proton flux >=10 pfu)',
            'source_url': NOAA_PROB_URL})
    return result


def parse_ccmc_release(payload: dict, source_url: str) -> list[dict]:
    root = payload.get('sep_forecast_submission')
    if not isinstance(root, dict) or root.get('mode') != 'forecast':
        raise ValueError('Invalid CCMC SEP forecast')
    issued = utc_timestamp(root['issue_time'])
    model = root['model']['short_name']
    result = []
    for forecast in root.get('forecasts', []):
        channel = forecast['energy_channel']
        if channel.get('units') != 'MeV' or forecast.get('species') != 'proton':
            continue
        minimum = finite_nonnegative(channel['min'])
        maximum = finite_nonnegative(channel['max'])
        if maximum <= minimum:
            raise ValueError('Invalid CCMC energy channel')
        peak = forecast.get('peak_intensity')
        if not peak or not peak.get('units'):
            continue
        if peak['units'] != 'MeV^-1*s^-1*cm^-2*sr^-1':
            raise ValueError('Unexpected REleASE differential flux unit')
        window = forecast['prediction_window']
        start, end = utc_timestamp(window['start_time']), utc_timestamp(window['end_time'])
        if end < start:
            raise ValueError('Inverted CCMC prediction window')
        peak_at = utc_timestamp(peak['time']) if peak.get('time') else None
        location = forecast.get('location')
        result.append({'id': record_id('ccmc', model, issued.isoformat(), str(minimum), str(maximum), str(location)),
            'source': 'NASA CCMC SEP Scoreboard', 'provider': 'CCMC / HESPERIA', 'model': model,
            'provenance': 'FORECAST', 'issued_at': issued.isoformat(),
            'valid_from': start.isoformat(), 'valid_until': end.isoformat(),
            'occurrence_probability_percent': None,
            'peak_proton_flux': finite_nonnegative(peak['intensity']),
            'peak_proton_flux_unit': peak['units'], 'proton_energy_min_mev': minimum,
            'proton_energy_max_mev': maximum, 'event_start_at': None,
            'event_peak_at': peak_at.isoformat() if peak_at else None, 'event_end_at': None,
            'location': location, 'source_url': source_url})
    return result


def parse_noaa_alerts(payload: list, collected_at: datetime) -> list[dict]:
    if not isinstance(payload, list):
        raise ValueError('Invalid NOAA alerts')
    result = []
    for raw in payload:
        message = raw.get('message', '')
        headline = next((line.strip() for line in message.splitlines() if re.match(r'^(?:CANCEL |CONTINUED )?(ALERT|WATCH|WARNING):',line.strip())), None)
        if not headline:
            continue
        issued = utc_timestamp(raw['issue_datetime'], radlab=True)
        validity = re.search(r'Valid To:\s*(\d{4} \w{3} \d{1,2} \d{4}) UTC', message)
        valid_until = datetime.strptime(validity.group(1), '%Y %b %d %H%M').replace(tzinfo=timezone.utc).isoformat() if validity else None
        result.append({'id': record_id('noaa-alert', str(raw.get('product_id')), issued.isoformat()),
            'source': 'NOAA SWPC', 'issued_at': issued.isoformat(),
            'kind': headline.split(':', 1)[0], 'message': headline,
            'collected_at': collected_at.isoformat(), 'source_url': NOAA_ALERTS_URL,
            'original_message': message, 'valid_until': valid_until, 'product_id': raw.get('product_id')})
    return result


def donki_sep_url(start: datetime, end: datetime) -> str:
    if end <= start or end - start > timedelta(days=30):
        raise ValueError('DONKI interval must be positive and at most 30 days')
    key = os.getenv('NASA_API_KEY', 'DEMO_KEY')
    return (f'{DONKI_SEP_BASE}?startDate={start.date().isoformat()}'
            f'&endDate={end.date().isoformat()}&api_key={quote(key)}')


def parse_donki_sep(payload: list, collected_at: datetime) -> list[dict]:
    if not isinstance(payload, list):
        raise ValueError('Invalid DONKI SEP response')
    result = []
    for raw in payload:
        at = utc_timestamp(raw['eventTime'])
        event_id = raw['sepID']
        result.append({'id': event_id, 'source': 'NASA DONKI', 'kind': 'SEP',
            'event_at': at.isoformat(), 'collected_at': collected_at.isoformat(),
            'source_url': raw.get('link') or DONKI_SEP_BASE,
            'details': {'instruments': raw.get('instruments'), 'linked_events': raw.get('linkedEvents'),
                        'submission_time': raw.get('submissionTime'), 'version_id': raw.get('versionId')}})
    return result
