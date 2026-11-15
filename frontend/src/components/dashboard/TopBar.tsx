import { Bell, ChevronRight, Menu, RadioTower, Satellite, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function TopBar({title, onMenu, apiOnline}: {title:string;onMenu:()=>void;apiOnline:boolean}) {
  return <header className="topbar">
    <div className="topbar-left">
      <Button size="icon" variant="ghost" className="mobile-only" onClick={onMenu} aria-label="Abrir menu"><Menu size={20}/></Button>
      <div className="breadcrumbs"><span>MISSION OPERATIONS</span><ChevronRight size={13}/><span className="breadcrumb-current">{title}</span></div>
    </div>
    <div className="topbar-right">
      <span className="topbar-mini"><Satellite size={15}/> SPACE APPS 2026</span>
      <span className={`connection-pill ${apiOnline?'connected':'disconnected'}`}><span className="small-dot"/>{apiOnline ? 'API LOCAL ONLINE' : 'API NÃO CONECTADA'}</span>
      <Button size="icon" variant="ghost" aria-label="Configurações" title="Configurações"><Settings2 size={17}/></Button>
      <Button size="icon" variant="ghost" aria-label="Notificações" title="Nenhuma notificação"><Bell size={17}/></Button>
      <div className="header-avatar"><RadioTower size={18}/></div>
    </div>
  </header>;
}
