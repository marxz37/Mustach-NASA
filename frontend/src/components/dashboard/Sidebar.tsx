import { NavLink } from 'react-router-dom';
import { Activity, BookOpenText, ChevronRight, CircleHelp, Database, FlaskConical, History, LayoutDashboard, RadioTower, Shield, Sun, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
const groups: Array<{label:string;items:Array<{to:string;label:string;icon:LucideIcon}>}> = [
  {label:'MONITORAMENTO',items:[
    {to:'/',label:'Visão geral',icon:LayoutDashboard},
    {to:'/tripulantes',label:'Tripulantes',icon:Users},
    {to:'/radiacao',label:'Radiação',icon:Activity},
    {to:'/clima-espacial',label:'Clima espacial',icon:Sun},
    {to:'/historico',label:'Histórico de doses',icon:History},
  ]},
  {label:'PESQUISA',items:[
    {to:'/simulador',label:'Simulador',icon:FlaskConical},
    {to:'/fontes',label:'Fontes científicas',icon:Database},
    {to:'/documentacao',label:'Documentação',icon:BookOpenText},
  ]},
];
export function Sidebar({open,onClose}: {open:boolean;onClose:()=>void}) {
  return <>
    <div className={cn('sidebar-backdrop',open&&'visible')} onClick={onClose}/>
    <aside className={cn('sidebar',open&&'sidebar-open')}>
      <div className="sidebar-brand">
        <div className="logo-emblem"><RadioTower size={22}/><span className="logo-emblem-orbit"/></div>
        <div><div className="brand-name">SENTINELA<span className="brand-star">✦</span></div><div className="brand-subtitle">RADIATION INTELLIGENCE</div></div>
        <button className="sidebar-close mobile-only" onClick={onClose} aria-label="Fechar menu"><X size={18}/></button>
      </div>
      <div className="mission-badge"><span className="small-dot cyan"/><span>MISSION CONTROL</span><span className="badge-version">V0.1</span></div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {groups.map(group=><div className="nav-group" key={group.label}>
          <p className="nav-group-label">{group.label}</p>
          {group.items.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} onClick={onClose} className={({isActive})=>cn('nav-item',isActive&&'nav-active')}>
            <Icon size={18} strokeWidth={1.8}/><span>{label}</span><ChevronRight size={14} className="nav-chevron"/>
          </NavLink>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="source-note"><div className="source-note-icon"><Shield size={18}/></div><div><strong>Protótipo científico</strong><p>Sem medições reais conectadas nesta versão.</p></div></div>
        <div className="side-footer"><CircleHelp size={15}/><span>NASA Space Apps 2026</span><span className="ml-auto">01 / 06</span></div>
      </div>
    </aside>
  </>;
}
