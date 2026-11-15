import { useState } from 'react';
import { Activity, ArrowUpRight, CalendarDays, HeartPulse, Info, Radio, Sun } from 'lucide-react';
import { EmptyChart } from '@/components/visualizations/EmptyChart';
import { HeatmapBody, type BodyTarget } from '@/components/visualizations/HeatmapBody';
import { OrganDetails } from '@/components/visualizations/OrganDetails';

const periods = ['24h', '7 dias', '30 dias'] as const;

export function Overview() {
  const [active, setActive] = useState<BodyTarget | null>(null);
  const [period, setPeriod] = useState<(typeof periods)[number]>('7 dias');

  return <div className="dashboard-page">
    <div className="dashboard-intro">
      <div>
        <span className="section-kicker">MUSTACH / MISSION MONITORING</span>
        <h1>O espaço deixa marcas.<br/><em>Vamos compreendê-las.</em></h1>
        <p>Uma leitura integrada da exposição espacial e do cuidado com a tripulação.</p>
      </div>
      <span className="preview-chip"><span className="status-dot"/> Sem telemetria conectada</span>
    </div>

    <section className="readout-strip" aria-label="Indicadores da missão">
      <div><span>01 / TAXA DE DOSE ABSORVIDA</span><strong>— <small>µGy/h</small></strong><p>Aguardando fonte dosimétrica</p></div>
      <div><span>02 / DOSE ACUMULADA</span><strong>— <small>mSv</small></strong><p>Sem histórico validado</p></div>
      <div><span>03 / ESTADO DA TRIPULAÇÃO</span><strong>Não avaliado</strong><p>Sem dados individuais</p></div>
    </section>

    <div className="overview-grid">
      <section className="body-section" aria-labelledby="body-title">
        <div className="section-heading"><div><span className="section-kicker">01 / EXPLORAÇÃO CORPORAL</span><h2 id="body-title">Mapa de exposição</h2></div><span className="section-aside">2D · INTERATIVO</span></div>
        <p className="section-description">Selecione uma região para examinar sua ficha ampliada. A silhueta permanece neutra até existir uma medição aplicável e validada.</p>
        <HeatmapBody selected={active} onSelect={setActive}/>
        <div className="body-legend"><span className="legend-swatch"/><span>Sem dados de dose por órgão</span><span>Escala de risco indisponível</span></div>
      </section>

      <div className="overview-aside">
        <section className="quiet-panel solar-section" aria-labelledby="solar-title">
          <div className="panel-heading"><Sun size={19}/><h2 id="solar-title">Atividade solar</h2><span>NOAA / CCMC</span></div>
          <div className="solar-content"><div className="solar-orbit"><Sun size={31} strokeWidth={1.2}/></div><div><span className="panel-kicker">CONDIÇÃO ATUAL + PREVISÃO SEP</span><strong>Sem previsão disponível</strong><p>Eventos solares e previsões de tempestades aparecerão aqui quando as fontes forem conectadas.</p></div></div>
          <div className="panel-foot"><span>GOES · SEP SCOREBOARD</span><span>Fonte não conectada</span></div>
        </section>

        <section className="quiet-panel radiation-section" aria-labelledby="radiation-title">
          <div className="panel-heading"><Radio size={19}/><h2 id="radiation-title">Radiação</h2><span>SEM SINAL</span></div>
          <div className="reading-row"><div><strong>NASA RadLab</strong><span>Taxa de dose absorvida</span></div><b>— <small>µGy/h</small></b></div>
          <div className="reading-row"><div><strong>ISS-RAD / REM</strong><span>Ambiente da missão</span></div><b>— <small>µSv/h</small></b></div>
          <div className="reading-row"><div><strong>Dosímetro pessoal</strong><span>Exposição individual</span></div><b>— <small>mSv</small></b></div>
          <div className="panel-foot"><span>Observado ≠ previsto ≠ simulado</span><Info size={14}/></div>
        </section>
      </div>
    </div>

    <div className="lower-grid">
      <section className="quiet-panel history-section" aria-labelledby="history-title">
        <div className="panel-heading"><Activity size={19}/><h2 id="history-title">Histórico de exposição</h2><div className="period-tabs" role="group" aria-label="Período do histórico">{periods.map(item=><button type="button" key={item} className={period===item?'active':''} onClick={()=>setPeriod(item)} aria-pressed={period===item}>{item}</button>)}</div></div>
        <div className="history-subtitle"><CalendarDays size={14}/> Dose acumulada · {period} <span>mSv</span></div>
        <EmptyChart height={195} label={`Sem medições para ${period}`}/>
      </section>
      <section className="quiet-panel health-section" aria-labelledby="health-title">
        <div className="panel-heading"><HeartPulse size={19}/><h2 id="health-title">Saúde da tripulação</h2><span>SEM AVALIAÇÃO</span></div>
        <div className="health-message"><span className="status-dot"/><strong>Nenhuma avaliação disponível</strong><p>Indicadores individuais aparecerão apenas quando houver dados autorizados.</p></div>
        <div className="panel-foot"><span>Não constitui avaliação médica</span><ArrowUpRight size={14}/></div>
      </section>
    </div>
    <OrganDetails target={active} onClose={()=>setActive(null)}/>
  </div>;
}
