import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ClipboardCheck, CircleHelp, Info, Layers, Radio, X, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formattedClock, type Language } from '@shared/i18n';
import { formatSolarTime } from '@shared/solar';
import { acknowledgeOperationalEvent, changeOperationalScenario, getOperationalEvent, receiveDemoPersonalMeasurement, type OperationalEvent, type PreparationStepId, type PreparationState, type ScenarioId } from '@shared/operational';
import { operationalCopy, type OperationalCopyKey } from '@shared/operationalCopy';

const base = import.meta.env.VITE_API_BASE_URL ?? '';
const queryKey = ['operational-event'];
const scenarioIds: ScenarioId[] = ['missing_personal', 'solar_review', 'complete', 'missing_environment', 'missing_context', 'stale_personal', 'wrong_personal', 'quality_review'];
const actionStep: Record<OperationalEvent['assessment']['next_action'], PreparationStepId> = {
  REFRESH_PERSONAL: 'personal', CHECK_ASSOCIATION: 'personal', CHECK_QUALITY: 'personal',
  CONFIRM_ACTIVITY: 'context', CHECK_ENVIRONMENT: 'radiological', CHECK_PERSONAL: 'personal',
  REVIEW_SOLAR_EVENT: 'radiological', RECORD_REVIEW: 'context', FOLLOW_UP: 'radiological', NONE: 'context',
};
function StateIcon({ state, size = 22 }: { state: PreparationState; size?: number }) {
  return state === 'AVAILABLE' ? <Check size={size}/> : state === 'ATTENTION' ? <AlertTriangle size={size}/> : <CircleHelp size={size}/>;
}
interface DetailProps {
  event: OperationalEvent; language: Language; selected: PreparationStepId;
  onSelect: (step: PreparationStepId) => void; onClose: () => void;
  onRecord: () => void; onReceive: () => void; onScenario: (scenario: ScenarioId) => void;
  blocked: boolean; saving: boolean; error: string | null; stale: boolean;
}
function PreparationDetails({ event, language, selected, onSelect, onClose, onRecord, onReceive, onScenario, blocked, saving, error, stale }: DetailProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const c = (key: OperationalCopyKey) => operationalCopy(language, key);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = trigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  const step = event.assessment.steps.find(item => item.id === selected)!;
  const reading = selected === 'personal' ? event.evidence.personal_measurement : selected === 'radiological' ? event.evidence.environment_measurement : null;
  const check = selected === 'personal' ? event.assessment.personal_check : event.assessment.environment_check;
  return <dialog ref={dialog} className="preparation-drawer" aria-labelledby="preparation-detail-title"
    onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="preparation-drawer-content">
      <header className="preparation-drawer-header"><div><span className="section-kicker">{event.activity} / {event.next_check}</span><h2 id="preparation-detail-title">{c('detailTitle')}</h2></div><button type="button" className="prep-icon-button" aria-label={c('close')} onClick={onClose}><X size={22}/></button></header>
      <div className="prep-detail-tabs" role="group" aria-label={c('flow')}>{event.assessment.steps.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}><span data-state={item.state}><StateIcon state={item.state} size={16}/></span>{c(item.id)}</button>)}</div>
      <section className="prep-detail-section" aria-label={c(selected)}>
        <span className="prep-label">{c(selected)}</span><h3>{c(step.reason)}</h3>
        <span className="prep-state-tag" data-state={step.state}>{c(selected === 'context' ? step.state : check.state)}</span>
        <p>{c(selected === 'context' ? 'contextDetail' : selected === 'radiological' ? 'radiologicalDetail' : 'personalDetail')}</p>
        <dl className="prep-evidence">
          {selected === 'context' ? <><div><dt>{c('scheduledTime')}</dt><dd>{formatSolarTime(event.scheduled_at, language)}</dd></div><div><dt>{c('preparation')}</dt><dd>{event.inputs.activity_available ? event.activity : '—'}</dd></div><div><dt>{c('astronaut')}</dt><dd>{event.evidence.activity?.astronaut_name ?? '—'}</dd></div></> : selected === 'radiological' ? <>
            <div><dt>{c('environment')}</dt><dd>{c(event.inputs.environment_context_available ? 'AVAILABLE' : 'MISSING')}</dd></div>
            <div><dt>{c('remoteFlagged')}</dt><dd>{c(event.inputs.solar_event_flagged ? 'SOLAR_EVENT' : 'remoteNone')}</dd></div>
            {event.evidence.solar_event && <div><dt>{c('source')}</dt><dd>{event.evidence.solar_event.source} · {formatSolarTime(event.evidence.solar_event.issued_at, language)}</dd></div>}
          </> : <div><dt>{c('personal')}</dt><dd>{c(step.reason)}</dd></div>}
          {reading && <>
            <div><dt>{c('measurementId')}</dt><dd>{reading.id}</dd></div>
            <div><dt>{c('measurementValue')}</dt><dd>{reading.value} {reading.unit} · {reading.quantity}</dd></div>
            <div><dt>{c('association')}</dt><dd>{reading.astronaut_id ?? '—'} · {reading.activity_id ?? '—'}</dd></div>
            <div><dt>{c('source')}</dt><dd>{reading.source}</dd></div><div><dt>{c('instrument')}</dt><dd>{reading.instrument}</dd></div>
            <div><dt>{c('mission')} / {c('location')}</dt><dd>{reading.mission} · {reading.location ?? '—'}</dd></div>
            <div><dt>{c('measurementTime')}</dt><dd>{formatSolarTime(reading.measured_at, language)}</dd></div>
            <div><dt>{c('provenance')} / {c('quality')}</dt><dd>{reading.provenance} · {c(`quality_${reading.quality}`)}</dd></div>
          </>}
          <div><dt>{c('scenarioTime')}</dt><dd>{formatSolarTime(event.scenario_at, language)}</dd></div>
          <div><dt>{c('evaluatedAt')}</dt><dd>{formatSolarTime(event.evaluated_at, language)}</dd></div>
        </dl>
        {selected === 'radiological' && !event.inputs.environment_context_available && <p>{c('environmentalGap')}</p>}
        {selected !== 'context' && <>
          <ul className="prep-reading-issues">{check.issues.map(issue => <li key={issue}>{c(issue)}</li>)}</ul>
          <p>{c('freshness')}: {check.max_age_seconds / 60} min. {c('freshnessNote')}</p>
        </>}
        {selected === 'personal' && event.evidence.activity && <button type="button" className="prep-receive-button" disabled={blocked} onClick={onReceive}>{c('receiveReading')}</button>}
      </section>
      <div className="prep-detail-next"><span className="prep-label">{c('next')}</span><strong>{c(event.assessment.next_action)}</strong><small>{event.next_check} · {event.id}</small></div>
      {stale && <p className="prep-feedback" role="status">{c('stale')} · {c('offline')}</p>}
      {error && <p className="prep-feedback" role="alert">{error}</p>}
      {event.acknowledged_at && <div className="prep-recorded" role="status"><Check size={17}/><div><strong>{c('recorded')} · {formattedClock(event.acknowledged_at, language, true)}</strong><p>{c(event.assessment.requires_attention ? 'followUp' : 'complete')}</p></div></div>}
      <footer className="prep-drawer-actions"><button type="button" className="prep-primary-button" disabled={blocked || !!event.acknowledged_at} onClick={onRecord}><ClipboardCheck size={18}/>{saving ? c('saving') : c('register')}</button><p>{c('recordNote')}</p></footer>
      <details className="prep-scenario"><summary>{c('scenario')}</summary><label>{c('scenario')}<select aria-label={c('scenario')} value={event.scenario_id} disabled={blocked} onChange={e => onScenario(e.target.value as ScenarioId)}>{scenarioIds.map(id => <option key={id} value={id}>{c(id === 'complete' ? 'completeScenario' : id)}</option>)}</select></label><p>{c('scenarioNote')}</p></details>
    </div>
  </dialog>;
}

export function OperationalCheck() {
  const { language, mode } = useApp();
  const [selected, setSelected] = useState<PreparationStepId | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn: () => getOperationalEvent(base), enabled: mode === 'simulation', refetchInterval: 3000, retry: 1 });
  const mutation = useMutation({
    mutationFn: ({ event, scenario, receive }: { event: OperationalEvent; scenario?: ScenarioId; receive?: boolean }) => receive
      ? receiveDemoPersonalMeasurement(base, event) : scenario ? changeOperationalScenario(base, event, scenario) : acknowledgeOperationalEvent(base, event),
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: updated => client.setQueryData(queryKey, updated),
    onError: () => { void client.invalidateQueries({ queryKey }); },
  });
  const c = (key: OperationalCopyKey) => operationalCopy(language, key);
  if (mode !== 'simulation') return null;
  const event = query.data;
  const assessment = event?.assessment;
  const error = mutation.isError ? c(mutation.error.message === 'SCENARIO_CHANGED' ? 'changed' : 'failed') : null;
  const dataLabel = assessment?.data_state === 'INCOMPLETE' ? c('INCOMPLETE') : assessment?.data_state === 'ATTENTION' ? c('dataAttention') : c('dataAvailable');
  return <section className="quiet-panel operational-check" aria-label={c('title')}>
    <div className="panel-heading"><ClipboardCheck size={21}/><h2>{c('title')}</h2><span>{event ? `${event.activity} · ${c(assessment?.requires_attention ? 'pending' : 'recorded')}` : c('preparation')}</span></div>
    {event && assessment ? <div className="preparation-grid">
      <article className="prep-activity-card">
        <div className="prep-orbit" aria-hidden="true"/>
        <span className="prep-label">{event.activity} / {c(event.inputs.activity_available ? 'scheduled' : 'scheduleMissing')}</span>
        <h3>{c('activityTitle')}</h3>{event.evidence.activity && <strong className="prep-personal-name">{event.evidence.activity.astronaut_name} · {event.evidence.activity.mission}</strong>}<p className="prep-activity-note">{c('activityNote')}</p>
        <div className="prep-metadata"><span><CalendarDays size={16}/>{formatSolarTime(event.scheduled_at, language)}</span><span><Layers size={16}/>{event.id}</span><span><Radio size={16}/>{event.source}</span></div>
        <div className="prep-assessment" data-state={assessment.data_state}><Info size={24}/><div><span className="prep-label">{c('dataSummary')}</span><strong>{dataLabel}</strong></div><span className="prep-review-tag"><ClipboardCheck size={14}/>{c(assessment.review_state === 'RECORDED' ? 'recorded' : 'reviewPending')}</span></div>
        <p className="prep-separation">{c(assessment.radiological_state)}</p>{event.reading_received_at && assessment.personal_check.state === 'USABLE' && <p className="prep-reading-resolved">{c('readingReceived')}</p>}
      </article>
      <article className="prep-flow-card">
        <header><h3>{c('flow')}</h3><span className="prep-count">{assessment.available_count}/3 {c('availableCount')}</span></header>
        <ol className="preparation-steps" aria-label={c('flow')}>{assessment.steps.map(step => <li key={step.id} data-state={step.state}>
          <button type="button" title={c(step.reason)} aria-label={`${c(step.id)}: ${c(step.state)}`} onClick={() => setSelected(step.id)}><span className="prep-step-symbol"><StateIcon state={step.state}/></span><strong>{c(step.id)}</strong><span className="prep-step-state">{c(step.id === 'personal' ? assessment.personal_check.state : step.reason === 'SOLAR_EVENT' ? 'remoteFlagged' : step.state)}</span></button>
        </li>)}</ol>
        <div className="prep-next-callout"><Info size={19}/><div><span className="prep-label">{c('next')}</span><strong>{c(assessment.next_action)}</strong></div></div>
        <button type="button" className="prep-primary-button" onClick={() => setSelected(actionStep[assessment.next_action])}><ArrowUpRight size={20}/><span>{c('open')}<small>{event.next_check}</small></span><ArrowRight size={20}/></button>
      </article>
    </div> : query.isPending ? <p>{c('loading')}</p> : null}
    {query.isError && <p className="prep-feedback" role="status">{event ? `${c('stale')} · ` : ''}{c('offline')} <button type="button" onClick={() => { void query.refetch(); }}>{c('retry')}</button></p>}
    {event && selected && <PreparationDetails event={event} language={language} selected={selected} onSelect={setSelected} onClose={() => setSelected(null)}
      blocked={query.isError || mutation.isPending} saving={mutation.isPending} error={error} stale={query.isError}
      onRecord={() => mutation.mutate({ event })} onReceive={() => mutation.mutate({ event, receive: true })} onScenario={scenario => mutation.mutate({ event, scenario })}/>}
  </section>;
}
