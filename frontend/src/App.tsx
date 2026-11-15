import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { Overview } from '@/pages/Overview';
import { CrewPage, DocumentationPage, HistoryPage, NotFoundPage, RadiationPage, SimulatorPage, SolarPage, SourcesPage } from '@/pages/Secondary';
import { getApiStatus } from '@/services/api';
const titles: Record<string,string> = {'/':'VISÃO GERAL','/tripulantes':'TRIPULANTES','/radiacao':'RADIAÇÃO','/clima-espacial':'CLIMA ESPACIAL','/historico':'HISTÓRICO','/simulador':'SIMULADOR','/fontes':'FONTES CIENTÍFICAS','/documentacao':'DOCUMENTAÇÃO'};
export default function App(){
  const [menuOpen,setMenuOpen]=useState(false);
  const location=useLocation();
  const {data:status}=useQuery({queryKey:['api-status'],queryFn:getApiStatus,refetchInterval:60_000});
  return <div className="app-shell"><Sidebar open={menuOpen} onClose={()=>setMenuOpen(false)}/><div className="main-column"><TopBar title={titles[location.pathname]??'PÁGINA'} onMenu={()=>setMenuOpen(true)} apiOnline={status?.api==='online'}/><main><Routes><Route path="/" element={<Overview/>}/><Route path="/tripulantes" element={<CrewPage/>}/><Route path="/radiacao" element={<RadiationPage/>}/><Route path="/clima-espacial" element={<SolarPage/>}/><Route path="/historico" element={<HistoryPage/>}/><Route path="/simulador" element={<SimulatorPage/>}/><Route path="/fontes" element={<SourcesPage/>}/><Route path="/documentacao" element={<DocumentationPage/>}/><Route path="*" element={<NotFoundPage/>}/></Routes></main></div></div>;
}
