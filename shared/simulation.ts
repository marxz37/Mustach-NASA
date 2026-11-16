import type { RatePoint } from './radiation';
import type { SolarForecastModel } from './solar';
export type Scenario = 'normal'|'predicted'|'ongoing'|'recovery';
export interface SimulationState {
  run_id:string; revision:number; running:boolean; speed:1|10|60; base_at:number;
  elapsed_ms:number; now:number; scenario:Scenario; rate:number; points:RatePoint[];
  solar_model:SolarForecastModel; provenance:'SIMULATED';
}
export interface SimulationCommand {action:'select'|'start'|'pause'|'resume'|'reset'|'speed';expected_revision:number;scenario?:Scenario;speed?:number;}
export async function getSimulation(base=''):Promise<SimulationState> {
  const response=await fetch(`${base}/api/v1/demo/simulation`);
  if(!response.ok)throw Error(`Simulation HTTP ${response.status}`);
  return response.json() as Promise<SimulationState>;
}
export async function controlSimulation(body:SimulationCommand,base=''):Promise<SimulationState> {
  const response=await fetch(`${base}/api/v1/demo/simulation`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!response.ok)throw Error(`Simulation HTTP ${response.status}`);
  return response.json() as Promise<SimulationState>;
}
export const simulationCopy={
  en:{title:'Shared simulation',normal:'Normal conditions',predicted:'Solar event predicted',ongoing:'Event in progress',recovery:'Recovery after event',start:'Start',pause:'Pause simulation',resume:'Resume simulation',reset:'Restart scenario',speed:'Demo speed',scenario:'Scenario',offline:'Shared simulation unavailable — local API required',running:'Running',paused:'Paused',fictitious:'Fictional scenario · not clinical data'},
  pt:{title:'Simulação compartilhada',normal:'Condições normais',predicted:'Evento solar previsto',ongoing:'Evento em andamento',recovery:'Recuperação após o evento',start:'Iniciar',pause:'Pausar simulação',resume:'Retomar simulação',reset:'Reiniciar cenário',speed:'Velocidade demonstrativa',scenario:'Cenário',offline:'Simulação compartilhada indisponível — requer API local',running:'Em execução',paused:'Pausada',fictitious:'Cenário fictício · não são dados clínicos'},
  es:{title:'Simulación compartida',normal:'Condiciones normales',predicted:'Evento solar previsto',ongoing:'Evento en curso',recovery:'Recuperación tras el evento',start:'Iniciar',pause:'Pausar simulación',resume:'Reanudar simulación',reset:'Reiniciar escenario',speed:'Velocidad demostrativa',scenario:'Escenario',offline:'Simulación compartida no disponible — requiere API local',running:'En curso',paused:'Pausada',fictitious:'Escenario ficticio · no son datos clínicos'},
};
