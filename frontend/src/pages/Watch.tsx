import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowLeft, ArrowRight, Heart, Info, Radio, Sun, Watch as WatchIcon } from 'lucide-react';
import { getWearableStatus } from '@/services/api';

type Screen = 'health' | 'solar';

const slideLabels: Record<Screen, string> = {
  health: 'Saúde do tripulante',
  solar: 'Atividade solar',
};

/** Simulador visual responsivo. Não representa um dispositivo vestível pareado. */
export function WatchPage() {
  const [screen, setScreen] = useState<Screen>('health');
  const dragStart = useRef<number | null>(null);
  const { data, isError } = useQuery({
    queryKey: ['wearable-status'],
    queryFn: getWearableStatus,
    refetchInterval: 30_000,
    retry: 1,
  });
  const move = (direction: 'prev' | 'next') => setScreen(direction === 'next' ? 'solar' : 'health');
  const handlePointerEnd = (x: number) => {
    if (dragStart.current === null) return;
    const delta = x - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) >= 50) move(delta < 0 ? 'next' : 'prev');
  };
  return <div className="watch-page">
    <div className="watch-page-header">
      <span className="section-kicker"><span className="pulse-dot"/> INTERFACE VESTÍVEL / MUSTACH</span>
      <h1>Informação essencial.<br/><em>No seu pulso.</em></h1>
      <p>Prévia do dispositivo conectado ao mesmo back-end da plataforma. Sem sensores pareados e sem avaliações clínicas nesta versão.</p>
    </div>

    <div className="watch-exhibit">
      <div className="watch-decoration watch-decoration--one" aria-hidden="true"/>
      <div className="watch-decoration watch-decoration--two" aria-hidden="true"/>
      <div className="watch-device" aria-label="Simulador da interface do relógio">
        <div className="watch-strap watch-strap--top" aria-hidden="true"/>
        <div className="watch-case">
          <div
            className="watch-screen"
            role="region"
            aria-roledescription="carrossel"
            aria-label={`Tela do relógio: ${slideLabels[screen]}`}
            tabIndex={0}
            onPointerDown={event => { dragStart.current = event.clientX; if (event.pointerType !== 'mouse') event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerUp={event => handlePointerEnd(event.clientX)}
            onPointerCancel={() => { dragStart.current = null; }}
            onKeyDown={event => {
              if (event.key === 'ArrowRight') { event.preventDefault(); move('next'); }
              if (event.key === 'ArrowLeft') { event.preventDefault(); move('prev'); }
            }}
          >
            <div className="watch-screen-top"><span className="watch-wordmark">M<span>✳</span></span><span className="watch-signal"><span className="watch-signal-dot"/> {data?.paired ? 'CONECTADO' : 'NÃO PAREADO'}</span></div>
            {screen === 'health' ? <div className="watch-center" key="health">
              <div className="watch-main-icon"><Heart size={55} strokeWidth={1.15}/></div>
              <div className="watch-eyebrow">ESTADO DE SAÚDE</div>
              <strong className="watch-main-title">Sem avaliação</strong>
              <p className="watch-main-desc">Aguardando dados do tripulante</p>
              <div className="watch-health-stats">
                <div><span>FREQUÊNCIA</span><strong>{data?.heart_rate_bpm == null ? '—' : data.heart_rate_bpm}<small> bpm</small></strong></div>
                <div><span>DOSE PESSOAL</span><strong>{data?.accumulated_dose_msv == null ? '—' : data.accumulated_dose_msv}<small> mSv</small></strong></div>
              </div>
            </div> : <div className="watch-center" key="solar">
              <div className="watch-main-icon watch-main-icon--solar"><Sun size={59} strokeWidth={1.05}/></div>
              <div className="watch-eyebrow">CLIMA ESPACIAL</div>
              <strong className="watch-main-title">Sem previsão</strong>
              <p className="watch-main-desc">Aguardando informações NOAA / CCMC</p>
              <div className="watch-solar-stats"><span>EVENTO SEP</span><strong>—</strong><span>ÚLTIMA LEITURA</span><strong>—</strong></div>
            </div>}
            <div className="watch-screen-footer">
              <div className="watch-dots" aria-label="Páginas">
                <span className={screen === 'health' ? 'active' : ''}/><span className={screen === 'solar' ? 'active' : ''}/>
              </div>
              <small>{screen === 'health' ? 'DESLIZE PARA ATIVIDADE SOLAR →' : '← DESLIZE PARA SAÚDE'}</small>
            </div>
          </div>
          <div className="watch-crown" aria-hidden="true"/>
        </div>
        <div className="watch-strap watch-strap--bottom" aria-hidden="true"/>
      </div>
      <div className="watch-controls" role="group" aria-label="Navegação da interface do relógio">
        <button className="watch-nav-button" type="button" onClick={() => move('prev')} disabled={screen === 'health'} aria-label="Ver tela de saúde"><ArrowLeft size={18}/></button>
        <span>{screen === 'health' ? '01 / 02 — SAÚDE' : '02 / 02 — ATIVIDADE SOLAR'}</span>
        <button className="watch-nav-button" type="button" onClick={() => move('next')} disabled={screen === 'solar'} aria-label="Ver atividade solar"><ArrowRight size={18}/></button>
      </div>
    </div>

    <div className="watch-info-grid">
      <section className="watch-info-card"><Activity size={20}/><div><h2>Saúde individual</h2><p>Interface preparada para frequência cardíaca e dose pessoal. Valores só serão exibidos quando houver uma fonte legítima de medição.</p></div></section>
      <section className="watch-info-card"><Sun size={20}/><div><h2>Atividade solar</h2><p>Uma segunda tela acessível por deslize ou pelos controles de navegação, futura consumidora de alertas NOAA / CCMC.</p></div></section>
      <section className="watch-info-card"><Radio size={20}/><div><h2>Ligação com a plataforma</h2><p>{isError ? 'API indisponível no momento.' : data ? 'API respondendo; nenhum dispositivo ou sensor pareado.' : 'Consultando API local…'} A interface atual é uma simulação de relógio no navegador.</p></div></section>
    </div>
    <p className="watch-safety-note"><Info size={15}/> Nenhum estado de saúde ou nível de segurança foi inferido. A ausência de dados não significa condição normal.</p>
    <div className="watch-page-foot"><WatchIcon size={15}/> Prévia web do relógio · sem integração Bluetooth ou hardware nesta etapa</div>
  </div>;
}
