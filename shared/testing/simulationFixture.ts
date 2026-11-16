/** HTTP fixture for isolated UI regressions. Production always reads the shared FastAPI. */
import { demoSeries, demoSolarModel } from '../demo';
import type { SimulationState } from '../simulation';
export function simulationFixture(now=Date.now()):SimulationState {
  const points=[...demoSeries(now),{at:now,value:.38}];
  return {run_id:'isolated-ui-fixture',revision:1,running:true,speed:1,base_at:now,elapsed_ms:0,now,scenario:'normal',rate:.38,points,solar_model:demoSolarModel(now),provenance:'SIMULATED'};
}
