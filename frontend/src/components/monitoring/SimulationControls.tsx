import { useMutation, useQueryClient } from '@tanstack/react-query';
import { controlSimulation, simulationCopy, type Scenario, type SimulationCommand } from '@shared/simulation';
import { readableDuration } from '@shared/radiation';
import { useApp } from '@/context/AppContext';
export function SimulationControls(){
  const {mode,language,simulation,simulationOffline}=useApp();
  const client=useQueryClient();
  const copy=simulationCopy[language];
  const command=useMutation({mutationFn:(body:SimulationCommand)=>controlSimulation(body,import.meta.env.VITE_API_BASE_URL??''),onSuccess:data=>{client.setQueryData(['shared-simulation'],data);},onError:()=>{void client.invalidateQueries({queryKey:['shared-simulation']});}});
  if(mode!=='simulation')return null;
  const send=(action:SimulationCommand['action'],extra:Partial<SimulationCommand>={})=>{if(simulation)command.mutate({action,expected_revision:simulation.revision,...extra});};
  return <section className="simulation-controls" aria-label={copy.title}>
    <strong>{copy.title}</strong>{!simulation||simulationOffline?<p role="status">{copy.offline}</p>:<>
      <label>{copy.scenario}<select aria-label={copy.scenario} value={simulation.scenario} disabled={command.isPending} onChange={e=>send('select',{scenario:e.target.value as Scenario})}>{(['normal','predicted','ongoing','recovery'] as const).map(id=><option key={id} value={id}>{copy[id]}</option>)}</select></label>
      <button disabled={command.isPending} onClick={()=>send(simulation.running?'pause':simulation.elapsed_ms===0?'start':'resume')}>{simulation.running?copy.pause:simulation.elapsed_ms===0?copy.start:copy.resume}</button>
      <button disabled={command.isPending} onClick={()=>send('reset')}>{copy.reset}</button>
      <label>{copy.speed}<select aria-label={copy.speed} value={simulation.speed} disabled={command.isPending} onChange={e=>send('speed',{speed:Number(e.target.value)})}>{[1,10,60].map(speed=><option key={speed} value={speed}>{speed}×</option>)}</select></label>
      <span data-testid="simulation-clock">{readableDuration(simulation.elapsed_ms)} · {simulation.running?copy.running:copy.paused}</span><small>{copy.fictitious}</small>
    </>}{command.isError&&<p role="status">{copy.offline}</p>}
  </section>;
}
