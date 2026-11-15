import { useQuery } from '@tanstack/react-query';
import { Activity, RadioTower, ScanHeart, Wifi, WifiOff } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Overview } from '@/pages/Overview';
import { CrewPage } from '@/pages/Crew';
import { getApiStatus } from '@/services/api';

export default function App() {
  const { data: status } = useQuery({ queryKey: ['api-status'], queryFn: getApiStatus, refetchInterval: 60_000, retry: 1 });
  return <div className="mustach-shell">
    <header className="mustach-header">
      <div className="brand"><span className="brand-icon"><ScanHeart size={23} strokeWidth={1.65}/></span><span><strong>MUSTACH<span className="brand-cross">✳</span></strong><small>SPACE RADIATION MONITOR</small></span></div>
      <nav className="main-tabs" aria-label="Navegação principal">
        <NavLink to="/" end className={({isActive}) => `main-tab ${isActive?'tab-active':''}`}><Activity size={17}/> Visão geral</NavLink>
        <NavLink to="/tripulantes" className={({isActive}) => `main-tab ${isActive?'tab-active':''}`}><RadioTower size={17}/> Tripulantes</NavLink>
      </nav>
      <div className="header-status" aria-label={status?.api === 'online' ? 'API local conectada' : 'API local não conectada'}>
        {status?.api === 'online' ? <Wifi size={15}/> : <WifiOff size={15}/>}
        <span>{status?.api === 'online' ? 'API LOCAL ONLINE' : 'API NÃO CONECTADA'}</span>
      </div>
    </header>
    <main className="mustach-main"><Routes><Route path="/" element={<Overview/>}/><Route path="/tripulantes" element={<CrewPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></main>
    <footer className="mustach-footer"><span>MUSTACH / NASA SPACE APPS CHALLENGE 2026</span><span>PROTÓTIPO DE INTERFACE • NÃO É DISPOSITIVO MÉDICO</span></footer>
  </div>;
}
