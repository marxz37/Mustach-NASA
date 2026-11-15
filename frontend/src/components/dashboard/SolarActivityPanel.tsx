import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowUpRight, Clock3, Sun, Zap } from 'lucide-react';
import { getSolarForecast } from '@/services/api';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime, formatSolarWindow } from '@shared/solar';

export function SolarActivityPanel() {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { data, isError } = useQuery({ queryKey: ['solar-forecast'], queryFn: getSolarForecast, refetchInterval: 60_000, retry: 1 });
  const model = data?.models.find(item => item.id === selectedModelId) ?? data?.models[0];
  const unavailable = 'Aguardando dados';

  return <section className="quiet-panel solar-section" aria-labelledby="solar-title">
    <div className="panel-heading"><Sun size={19}/><h2 id="solar-title">Atividade solar</h2><span>SEP / PREVISÃO</span></div>
    <div className="solar-lead">
      <div><span className="panel-kicker">EVENTOS DE PARTÍCULAS SOLARES</span><strong>{model ? model.model : 'Sem previsão disponível'}</strong><p>{model ? `${model.provider} · ${model.source}` : 'Modelos científicos ainda não conectados.'}</p></div>
      {data && data.models.length > 1 && <label className="solar-model-picker">Modelo
        <select value={model?.id ?? ''} onChange={event => setSelectedModelId(event.target.value)}>
          {data.models.map(item => <option key={item.id} value={item.id}>{item.provider} / {item.model}</option>)}
        </select>
      </label>}
    </div>
    <div className="solar-categories">
      <div className="solar-category" aria-label="A — Ocorrência">
        <Activity size={18} strokeWidth={1.5} aria-hidden="true"/>
        <div><h3>A <span>—</span> Ocorrência</h3><p>Probabilidade de evento de partículas solares</p>
          <strong>{formatSolarProbability(model?.occurrence_probability_percent)}</strong>
          <dl><div><dt>Período</dt><dd>{formatSolarWindow(model?.valid_from, model?.valid_until)}</dd></div><div><dt>Modelo</dt><dd>{model?.model ?? unavailable}</dd></div><div><dt>Atualização</dt><dd>{formatSolarTime(model?.issued_at)}</dd></div></dl>
        </div>
      </div>
      <div className="solar-category" aria-label="B — Intensidade">
        <Zap size={18} strokeWidth={1.5} aria-hidden="true"/>
        <div><h3>B <span>—</span> Intensidade</h3><p>Fluxo máximo de prótons previsto</p>
          <strong>{formatSolarFlux(model?.peak_proton_flux, model?.peak_proton_flux_unit)}</strong>
          <dl><div><dt>Energia</dt><dd>{formatSolarEnergy(model?.proton_energy_min_mev, model?.proton_energy_max_mev)}</dd></div><div><dt>Unidade</dt><dd>{model?.peak_proton_flux_unit ?? unavailable}</dd></div><div><dt>Modelo</dt><dd>{model?.model ?? unavailable}</dd></div></dl>
        </div>
      </div>
      <div className="solar-category" aria-label="C — Evolução temporal">
        <Clock3 size={18} strokeWidth={1.5} aria-hidden="true"/>
        <div><h3>C <span>—</span> Evolução temporal</h3><p>Início, pico e término previstos</p>
          <dl><div><dt>Início</dt><dd>{formatSolarTime(model?.event_start_at)}</dd></div><div><dt>Pico</dt><dd>{formatSolarTime(model?.event_peak_at)}</dd></div><div><dt>Término</dt><dd>{formatSolarTime(model?.event_end_at)}</dd></div><div><dt>Janela</dt><dd>{formatSolarWindow(model?.valid_from, model?.valid_until)}</dd></div><div><dt>Emissão</dt><dd>{formatSolarTime(model?.issued_at)}</dd></div></dl>
        </div>
      </div>
    </div>
    <div className="panel-foot"><span>{isError ? 'API NÃO CONECTADA' : model ? `FONTE: ${model.source} · ${model.provenance}` : 'OBSERVADO ≠ PREVISTO ≠ SIMULADO'}</span><span>Fluxo SEP não é dose individual <ArrowUpRight size={13}/></span></div>
  </section>;
}
