"""Conservative demonstration notification policy, never a personal health classifier."""
from datetime import datetime, timedelta, timezone
import re
from . import db


def eligible_notices(now=None):
    now = now or datetime.now(timezone.utc)
    notices = []
    seen_products = set()
    for alert in db.get_alerts(100):
        issued = datetime.fromisoformat(alert['issued_at'])
        if issued > now:
            continue
        product = alert.get('product_id')
        if product:
            if product in seen_products:
                continue
            seen_products.add(product)
        text = alert.get('original_message') or alert['message']
        # G/R, electrons and cancellations must not become SEP warnings.
        if not re.search(r'proton|solar radiation storm|\bSEP\b', alert['message'], re.I):
            continue
        if re.search(r'cancel|below|ended|expired', text, re.I):
            continue
        until = alert.get('valid_until')
        # ALERT describes a threshold reached, not ongoing exposure: at most one hour.
        expiry = datetime.fromisoformat(until) if until else issued + timedelta(hours=1)
        if not issued <= now < expiry or now-issued > timedelta(hours=24):
            continue
        notices.append(dict(id='official-'+alert['id'], kind='OFFICIAL', source=alert['source'],
            issued_at=alert['issued_at'], valid_until=expiry.isoformat(),
            code='proton_observed' if alert['kind']=='ALERT' else 'proton_warning',
            detail=alert['message'], provenance='OBSERVED' if alert['kind']=='ALERT' else 'FORECAST'))
    for model in db.get_forecasts():
        issued = datetime.fromisoformat(model['issued_at'])
        until = model.get('valid_until')
        if not until or not issued <= now < datetime.fromisoformat(until):
            continue
        if now-issued > timedelta(days=1):
            continue
        probability = model.get('occurrence_probability_percent')
        # Fictional attention threshold, not an official warning or a clinical threshold.
        eligible = model['source']=='NOAA SWPC' and probability is not None and probability>=50
        # Channel-specific differential units stay differential. No conversion to pfu.
        ccmc = (model['source']=='NASA CCMC SEP Scoreboard' and
                model.get('peak_proton_flux_unit')=='MeV^-1*s^-1*cm^-2*sr^-1' and
                (model.get('proton_energy_min_mev'),model.get('proton_energy_max_mev')) in ((15.8,39.8),(28.2,50.1)) and
                (model.get('peak_proton_flux') or 0)>=.1)
        if eligible or ccmc:
            # One ID per issuance/model/channel; NOAA daily horizons grouped, never combined.
            key = f"{model['source']}/{model['model']}/{model['issued_at']}"
            if ccmc:
                key += f"/{model['proton_energy_min_mev']}/{model['proton_energy_max_mev']}"
            notice = dict(id='forecast-'+key, kind='FORECAST', source=model['source'],
                issued_at=model['issued_at'], valid_until=until, code='forecast_attention',
                detail=f"{model['model']} · {probability:g}% · day {model.get('forecast_horizon_day')} · {model.get('valid_from')}" if eligible else f"{model['model']} · {model['peak_proton_flux']} {model['peak_proton_flux_unit']} · {model['proton_energy_min_mev']}–{model['proton_energy_max_mev']} MeV",
                provenance='FORECAST')
            if not any(item['id']==notice['id'] for item in notices):
                notices.append(notice)
    return sorted(notices, key=lambda n:n['issued_at'], reverse=True)
