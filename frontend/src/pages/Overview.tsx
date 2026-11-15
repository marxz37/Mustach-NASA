import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Atom, BarChart3, ChevronDown, CircleDot, Clock3, Crosshair, Database, Gauge, HeartPulse, Info, Layers3, Microscope, Orbit, Radio, ScanFace, ShieldCheck, Sun, Zap } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { HumanBody, regionLabels } from '@/components/visualizations/HumanBody';
import { EmptyChart } from '@/components/visualizations/EmptyChart';
import type { Region } from '@/types/domain';

type Period = '24h'|'7 dias'|'30 dias';
const regions: Region[] = ['cabeca','torax','abdomen','bracos','pernas'];

function SectionHeading({eyebrow,title,description}: {eyebrow:string;title:string;description:string}) {
  return <div className="overview-title-row"><div><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="title-action"><span className="outline-badge"><CircleDot size={13}/> VERSÃO DE INTERFACE</span><span className="outline-badge secondary-badge"><Clock3 size={13}/> SEM TELEMETRIA</span></div></div>;
}

function PanelTitle({icon:Icon,title,badge,aside}: {icon:typeof Activity;title:string;badge?:string;aside?:ReactNode}) {
  return <CardHeader><div className="panel-title"><span className="panel-title-icon"><Icon size={16}/></span><h2>{title}</h2>{badge&&<span className="panel-badge">{badge}</span>}</div>{aside}</CardHeader>;
}

export function Overview() {
  const [selected,setSelected] = useState<Region>('cabeca');
  const [period,setPeriod] = useState<Period>('7 dias');
  const [bodyMode,setBodyMode] = useState<'anatomia'|'exposicao'>('anatomia');
  return <div className="page-content overview-page">
    <SectionHeading eyebrow="SISTEMA DE MONITORAMENTO / 001" title="Visão geral da missão" description="Monitoramento radiológico e acompanhamento de saúde em missões espaciais."/>
    <div className="data-banner"><Info size={15}/><span><strong>Modo de prototipação:</strong> interface sem dados conectados. Indicadores e gráficos aguardam integração científica.</span><Link to="/fontes">Ver fontes <ArrowRight size={14}/></Link></div>
    <div className="metric-grid">
      <MetricCard icon={Activity} label="TAXA DE DOSE ABSORVIDA" unit="µGy/h" hint="Aguardando RadLab / dosímetro" variant="aqua"/>
      <MetricCard icon={Gauge} label="DOSE ACUMULADA" unit="mSv" hint="Sem período dosimétrico disponível" variant="blue"/>
      <MetricCard icon={Sun} label="CONDIÇÃO SOLAR" unit="NOAA / SEP" hint="Previsão ainda não conectada" variant="violet"/>
    </div>

    <div className="monitor-grid">
      <Card className="organ-panel">
        <PanelTitle icon={ScanFace} title="Exposição por órgão" badge="ANATOMIA"/>
        <div className="organ-focus">
          <div className="organ-orb"><span className="organ-inner-ring"/><div className="organ-head"><div className="organ-cranium"/><div className="organ-neck"/></div><span className="organ-cross cross-one"/><span className="organ-cross cross-two"/></div>
          <span className="organ-focus-label"><span className="small-dot cyan"/> REGIÃO SELECIONADA</span>
          <h3>{regionLabels[selected]}</h3><p>Selecione uma área no modelo anatômico para inspecionar o espaço reservado à dosimetria regional.</p>
        </div>
        <div className="region-list-label">REGIÕES MONITORÁVEIS <span>05</span></div>
        <div className="region-list">
          {regions.map((region,i)=><button className={`region-row ${selected===region?'active':''}`} key={region} onClick={()=>setSelected(region)} aria-pressed={selected===region}><span className="region-index">0{i+1}</span><span>{regionLabels[region]}</span><span className="region-status">—</span></button>)}
        </div>
        <div className="organ-footnote"><Info size={13}/> As cores são ilustrativas; não indicam dose.</div>
      </Card>

      <Card className="anatomy-panel">
        <PanelTitle icon={Crosshair} title="Mapa corporal" badge="INTERATIVO" aside={<div className="view-switch"><button className={bodyMode==='anatomia'?'active':''} onClick={()=>setBodyMode('anatomia')}>Anatomia</button><button className={bodyMode==='exposicao'?'active':''} onClick={()=>setBodyMode('exposicao')}>Exposição</button></div>}/>
        <div className="body-panel-meta"><span>MODELO DE REFERÊNCIA</span><span>VISTA FRONTAL · 2D</span></div>
        <HumanBody selected={selected} onSelect={setSelected}/>
        <div className="body-panel-bottom"><div><span className="small-dot cyan"/> {bodyMode==='exposicao'?'CAMADA RADIOLÓGICA INDISPONÍVEL':'REGIÃO EM FOCO'} <strong>{regionLabels[selected].toUpperCase()}</strong></div><span>CLIQUE NAS REGIÕES</span></div>
        {bodyMode==='exposicao'&&<div className="anatomy-warning"><Layers3 size={14}/> A camada de exposição será ativada após integração de dados ou modelos validados.</div>}
      </Card>

      <div className="right-stack">
        <Card className="telemetry-panel">
          <PanelTitle icon={Radio} title="Telemetria de radiação" badge="SEM SINAL" aside={<Link className="panel-link" to="/radiacao">Detalhes <ArrowRight size={13}/></Link>}/>
          <div className="telemetry-tabs"><span className="selected">SENSORES</span><span>PARTÍCULAS</span><span>DOSES</span></div>
          <div className="telemetry-list">
            <div className="telemetry-item"><span className="telemetry-item-icon"><Atom size={17}/></span><div><strong>NASA RadLab</strong><small>Taxa de dose absorvida</small></div><span className="telemetry-value">— <small>µGy/h</small></span></div>
            <div className="telemetry-item"><span className="telemetry-item-icon"><Radio size={17}/></span><div><strong>ISS-RAD / REM</strong><small>Medição ambiental</small></div><span className="telemetry-value">— <small>µSv/h</small></span></div>
            <div className="telemetry-item"><span className="telemetry-item-icon"><CircleDot size={17}/></span><div><strong>Dosímetro individual</strong><small>Registro pessoal</small></div><span className="telemetry-value">— <small>mSv</small></span></div>
          </div>
          <div className="telemetry-footer"><span><span className="small-dot"/> 0 FONTES ATIVAS</span><span>DADOS NÃO CONFIGURADOS</span></div>
        </Card>
        <Card className="solar-panel">
          <PanelTitle icon={Sun} title="Previsão de tempestades" badge="NOAA" aside={<Link className="panel-link" to="/clima-espacial">Expandir <ArrowRight size={13}/></Link>}/>
          <div className="solar-preview"><div className="sun-graphic"><div className="sun-corona"><Sun size={33} strokeWidth={1.1}/></div></div><div><span className="solar-caption">ATIVIDADE SOLAR</span><strong>Sem previsão</strong><p>Os dados do clima espacial ainda não estão conectados.</p></div></div>
          <div className="solar-foot"><span><Zap size={13}/> GOES / SWPC</span><span>SEP SCOREBOARD <ChevronDown size={12}/></span></div>
        </Card>
      </div>
    </div>

    <div className="bottom-grid">
      <Card className="history-panel">
        <PanelTitle icon={BarChart3} title="Evolução da dose acumulada" badge="HISTÓRICO" aside={<div className="period-switch">{(['24h','7 dias','30 dias'] as Period[]).map(p=><button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div>}/>
        <div className="chart-labels"><span>DOSE ACUMULADA · mSv</span><span>VISUALIZAÇÃO {period.toUpperCase()}</span></div>
        <EmptyChart label={`Sem medições para ${period.toLowerCase()}`}/>
        <div className="history-footer"><span><span className="small-dot"/> 0 REGISTROS DISPONÍVEIS</span><Link to="/historico">Abrir histórico <ArrowRight size={13}/></Link></div>
      </Card>
      <Card className="health-panel">
        <PanelTitle icon={HeartPulse} title="Estado corporal" badge="TRIPULAÇÃO" aside={<Link className="panel-link" to="/tripulantes">Tripulantes <ArrowRight size={13}/></Link>}/>
        <div className="health-main"><span className="health-icon"><HeartPulse size={29}/></span><div><span className="health-eyebrow">STATUS DE SAÚDE</span><strong>Não avaliado</strong><p>Aguardando seleção de tripulante e indicadores fisiológicos.</p></div></div>
        <div className="health-readings"><div><span><HeartPulse size={14}/> Frequência cardíaca</span><strong>— <small>bpm</small></strong></div><div><span><Microscope size={14}/> Biomarcadores</span><strong>—</strong></div><div><span><ShieldCheck size={14}/> Avaliação radiológica</span><strong>—</strong></div></div>
        <div className="health-disclaimer"><Info size={13}/> Nenhuma avaliação médica foi realizada.</div>
      </Card>
    </div>
    <div className="overview-footer"><span><Orbit size={15}/> SENTINELA / SPACE APPS 2026</span><span><Database size={14}/> NASA · NOAA · CSA — INTEGRAÇÕES PLANEJADAS</span></div>
  </div>;
}
