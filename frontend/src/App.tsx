import { Activity, RadioTower, ScanHeart, Wifi, WifiOff, Watch, Languages } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Overview } from '@/pages/Overview';
import { CrewPage } from '@/pages/Crew';
import { useApp } from '@/context/AppContext';
import { formattedClock, languageNames, type Language } from '@shared/i18n';

export default function App() {
  const {t,mode,setMode,language,setLanguage,apiOnline,lastApiCheck,lastMeasurement,wearablePreviewActive,wearableLastSeen}=useApp();
  return <div className="mustach-shell">
    <header className="mustach-header">
      <div className="brand"><span className="brand-icon"><ScanHeart size={23} strokeWidth={1.65}/></span><span><strong>MUSTACH<span className="brand-cross">✳</span></strong><small>{t('webMonitor')}</small></span></div>
      <nav className="main-tabs" aria-label="Primary navigation">
        <NavLink to="/" end className={({isActive})=>`main-tab ${isActive?'tab-active':''}`}><Activity size={17}/>{t('overview')}</NavLink>
        <NavLink to="/tripulantes" className={({isActive})=>`main-tab ${isActive?'tab-active':''}`}><RadioTower size={17}/>{t('crew')}</NavLink>
      </nav>
      <div className="header-utilities">
        <div className="header-status" aria-label={apiOnline?t('apiOnline'):t('apiOffline')}>{apiOnline?<Wifi size={15}/>:<WifiOff size={15}/>}<span>{apiOnline?t('apiOnline'):t('apiOffline')}</span></div>
        <label className="utility-select"><span>{t('dataMode')}</span><select aria-label={t('dataMode')} value={mode} onChange={event=>setMode(event.target.value as 'none'|'real'|'simulation')}><option value="none">{t('noData')}</option><option value="real">{t('real')}</option><option value="simulation">{t('simulation')}</option></select></label>
        <label className="utility-select language-select"><Languages size={15} aria-hidden="true"/><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={language} onChange={event=>setLanguage(event.target.value as Language)}>{(Object.keys(languageNames) as Language[]).map(lang=><option key={lang} value={lang}>{languageNames[lang]}</option>)}</select></label>
      </div>
    </header>
    <div className="sync-line" role="status"><span><Wifi size={12}/>{t('lastCheck')}: {formattedClock(lastApiCheck,language,true)}</span><span>{t('lastMeasurement')}: {formattedClock(lastMeasurement,language,true)}</span><span><Watch size={12}/>{wearablePreviewActive?t('wearableActive'):t('wearableInactive')} · {t('lastSync')}: {formattedClock(wearableLastSeen,language,true)}</span><span>{t('deviceNote')}</span></div>
    <main className="mustach-main"><Routes><Route path="/" element={<Overview/>}/><Route path="/tripulantes" element={<CrewPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></main>
    <footer className="mustach-footer"><span>MUSTACH / NASA SPACE APPS CHALLENGE 2026</span><span>{t('protoDisclaimer')}</span></footer>
  </div>;
}
