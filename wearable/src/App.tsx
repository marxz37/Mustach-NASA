import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Heart, Info, Sun } from 'lucide-react';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime } from '@shared/solar';
import { getSolarForecast, getWearableStatus } from './services/api';

type Screen = 'health' | 'solar';
const slideLabels: Record<Screen, string> = { health: 'Saúde do tripulante', solar: 'Atividade solar' };

/** Protótipo web do relógio; não representa hardware pareado nem avaliação clínica. */
export default function App() {
  const [screen, setScreen] = useState<Screen>('health');
  const dragStart = useRef<number | null>(null);
  const { data: wearable, isError: wearableError } = useQuery({ queryKey: ['wearable-status'], queryFn: getWearableStatus, refetchInterval: 30_000, retry: 1 });
  const { data: forecast, isError: forecastError } = useQuery({ queryKey: ['solar-forecast'], queryFn: getSolarForecast, refetchInterval: 60_000, retry: 1 });
  const model = forecast?.models[0];
  const move = (direction: 'prev' | 'next') => setScreen(direction === 'next' ? 'solar' : 'health');
  const handlePointerEnd = (x: number) => {
    if (dragStart.current === null) return;
    const delta = x - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) >= 50) move(delta < 0 ? 'next' : 'prev');
  };

  return <div className="wearable-shell">
    <header className="wearable-header"><span className="section-kicker"><span className="pulse-dot"/> MUSTACH WEARABLE / PROTÓTIPO WEB</span><h1>Informação essencial.<br/><em>No seu pulso.</em></h1><p>Uma interface independente, conectada à mesma API do Mustach Web.</p></header>
    <main className="watch-exhibit">
      <div className="watch-decoration watch-decoration--one" aria-hidden="true"/><div className="watch-decoration watch-decoration--two" aria-hidden="true"/>
      <div className="watch-device" aria-label="Simulador da interface do relógio">
        <div className="watch-strap watch-strap--top" aria-hidden="true"/>
        <div className="watch-case">
          <div className="watch-screen" role="region" aria-roledescription="carrossel" aria-label={`Tela do relógio: ${slideLabels[screen]}`} tabIndex={0}
            onPointerDown={event => { dragStart.current = event.clientX; if (event.pointerType !== 'mouse') event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerUp={event => handlePointerEnd(event.clientX)}
            onPointerCancel={() => { dragStart.current = null; }}
            onKeyDown={event => {
              if (event.key === 'ArrowRight') { event.preventDefault(); move('next'); }
              if (event.key === 'ArrowLeft') { event.preventDefault(); move('prev'); }
            }}>
            <div className="watch-screen-top"><span className="watch-wordmark">M<span>✳</span></span><span className="watch-signal"><span className="watch-signal-dot"/> {wearable?.paired ? 'CONECTADO' : 'NÃO PAREADO'}</span></div>
            {screen === 'health' ? <div className="watch-center" key="health">
              <div className="watch-main-icon"><Heart size={55} strokeWidth={1.15}/></div>
              <div className="watch-eyebrow">ESTADO DE SAÚDE</div><strong className="watch-main-title">Sem avaliação</strong><p className="watch-main-desc">Aguardando dados do tripulante</p>
              <div className="watch-health-stats">
                <div><span>FREQUÊNCIA</span><strong>{wearable?.heart_rate_bpm == null ? '—' : wearable.heart_rate_bpm}<small> bpm</small></strong></div>
                <div><span>DOSE PESSOAL</span><strong>{wearable?.accumulated_dose_msv == null ? '—' : wearable.accumulated_dose_msv}<small> mSv</small></strong></div>
              </div>
            </div> : <div className="watch-center watch-center--solar" key="solar">
              <div className="watch-eyebrow"><Sun size={12}/> PREVISÃO SEP · {model?.provenance ?? 'SEM DADOS'}</div>
              <strong className="watch-solar-title">{model ? model.model : 'Sem previsão disponível'}</strong>
              <p className="watch-solar-source">{model ? `${model.provider} · ${model.source}` : forecastError ? 'API não conectada' : 'Aguardando modelos científicos'}</p>
              <div className="watch-solar-summary">
                <div><span>A / OCORRÊNCIA</span><strong>{formatSolarProbability(model?.occurrence_probability_percent)}</strong><small>Probabilidade de evento SEP</small></div>
                <div><span>B / INTENSIDADE</span><strong>{formatSolarFlux(model?.peak_proton_flux, model?.peak_proton_flux_unit)}</strong><small>Energia {formatSolarEnergy(model?.proton_energy_min_mev, model?.proton_energy_max_mev)}</small></div>
                <div><span>C / EVOLUÇÃO</span><strong>{formatSolarTime(model?.event_peak_at)}</strong><small>Pico previsto · início {formatSolarTime(model?.event_start_at)}</small></div>
              </div>
              {forecast && forecast.models.length > 1 && <small className="watch-model-note">1 de {forecast.models.length} modelos · consulte o Mustach Web</small>}
            </div>}
            <div className="watch-screen-footer"><div className="watch-dots" aria-label="Páginas"><span className={screen === 'health' ? 'active' : ''}/><span className={screen === 'solar' ? 'active' : ''}/></div><small>{screen === 'health' ? 'DESLIZE PARA ATIVIDADE SOLAR →' : '← DESLIZE PARA SAÚDE'}</small></div>
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
    </main>
    <footer className="wearable-footer"><p><Info size={15}/> {wearableError ? 'API indisponível. ' : ''}Ausência de dados não significa condição normal. Probabilidade de SEP não é probabilidade de dano à saúde.</p><span>Sem smartwatch físico ou sensores pareados nesta etapa.</span></footer>
  </div>;
}
