"""Explicit scientific collection; never run automatically on API startup."""
import argparse
from datetime import datetime, timedelta, timezone

from . import db, science

RADLAB_START = datetime(2022, 4, 1, 23, 0, tzinfo=timezone.utc)
RADLAB_END = datetime(2022, 4, 1, 23, 20, tzinfo=timezone.utc)


def collect_radlab(*, instrument_id='DosTel1', start=RADLAB_START, end=RADLAB_END) -> int:
    url = science.radlab_url(instrument_id, start, end)
    payload = science.fetch_json(url)
    items = science.parse_radlab(payload, url, datetime.now(timezone.utc))
    if not items:
        raise ValueError('RadLab returned no measurements for the selected interval')
    if any(item.instrument != instrument_id for item in items):
        raise ValueError('RadLab returned a different instrument')
    return db.save_measurements(items)


def collect_goes() -> int:
    items = science.parse_goes(science.fetch_json(science.GOES_URL), datetime.now(timezone.utc))
    if not items:
        raise ValueError('NOAA GOES returned no supported channels')
    return db.save_measurements(items)


def collect_noaa_forecast() -> int:
    models = science.parse_noaa_probabilities(science.fetch_json(science.NOAA_PROB_URL),
                                               science.fetch_text(science.NOAA_TEXT_URL))
    return db.save_forecasts(models, science.NOAA_PROB_URL, datetime.now(timezone.utc).isoformat())


def collect_noaa_alerts() -> int:
    alerts = science.parse_noaa_alerts(science.fetch_json(science.NOAA_ALERTS_URL), datetime.now(timezone.utc))
    return db.save_alerts(alerts)


def collect_ccmc() -> int:
    payload, resolved_url = science.fetch_json_with_url(science.CCMC_RELEASE_URL)
    models = science.parse_ccmc_release(payload, resolved_url)
    if not models:
        raise ValueError('CCMC returned no supported REleASE channel')
    return db.save_forecasts(models, resolved_url, datetime.now(timezone.utc).isoformat())


def collect_donki(*, start: datetime | None = None, end: datetime | None = None) -> int:
    end = end or datetime.now(timezone.utc)
    start = start or end - timedelta(days=7)
    events = science.parse_donki_sep(science.fetch_json(science.donki_sep_url(start, end)), datetime.now(timezone.utc))
    return db.save_events(events)


COLLECTORS = {'radlab': collect_radlab, 'goes': collect_goes, 'noaa-forecast': collect_noaa_forecast,
              'noaa-alerts': collect_noaa_alerts, 'ccmc': collect_ccmc, 'donki': collect_donki}


def run(source: str, **kwargs) -> dict:
    db.init_db()
    try:
        added = COLLECTORS[source](**kwargs)
    except Exception as exc:
        db.record_ingestion(source, 'ERROR', error=f'{type(exc).__name__}: {exc}')
        raise
    db.record_ingestion(source, 'OK', records_added=added)
    return {'source': source, 'records_added': added}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Collect official scientific data into local SQLite')
    parser.add_argument('source', choices=[*COLLECTORS, 'all'])
    parser.add_argument('--start', help='DONKI only: YYYY-MM-DD')
    parser.add_argument('--end', help='DONKI only: YYYY-MM-DD')
    args = parser.parse_args()
    if (args.start or args.end) and args.source != 'donki':
        parser.error('--start and --end apply only to DONKI')
    for selected in (COLLECTORS if args.source == 'all' else [args.source]):
        try:
            if selected == 'donki' and (args.start or args.end):
                start = datetime.fromisoformat(args.start).replace(tzinfo=timezone.utc) if args.start else None
                end = datetime.fromisoformat(args.end).replace(tzinfo=timezone.utc) if args.end else None
                print(run('donki',start=start,end=end))
            else:
                print(run(selected))
        except Exception as exc:
            print(f'{selected}: {type(exc).__name__}: {exc}')
            if args.source != 'all':
                raise SystemExit(1) from exc
