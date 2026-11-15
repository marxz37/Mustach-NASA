import { Info, UserRound } from 'lucide-react';

export function CrewPage() {
  return <div className="crew-page">
    <div className="crew-intro"><span className="section-kicker">MUSTACH / TRIPULAÇÃO</span><h1>Pessoas antes dos números.</h1><p>Uma ficha individual para acompanhar exposição e saúde — somente com registros autorizados.</p></div>
    <div className="crew-section-title"><span>TRIPULANTES</span><span>0 REGISTROS</span></div>
    <section className="crew-profile" aria-label="Estado da lista de tripulantes">
      <div className="crew-portrait"><UserRound size={58} strokeWidth={1}/><span>SEM FOTO</span></div>
      <div className="crew-identity"><span className="section-kicker">CADASTRO AINDA NÃO DISPONÍVEL</span><h2>Nenhum tripulante cadastrado</h2><p>Nome, missão e informações individuais aparecerão aqui quando forem fornecidos.</p><div className="crew-fields"><span>MISSÃO <strong>—</strong></span><span>STATUS <strong>Sem dados</strong></span></div></div>
      <div className="crew-exposure"><span>EXPOSIÇÃO INDIVIDUAL</span><div className="crew-bars" aria-label="Sem histórico de exposição disponível">{Array.from({length: 9}, (_, index) => <i key={index}/>)}</div><strong>— <small>mSv</small></strong><p>Sem série dosimétrica</p></div>
    </section>
    <p className="crew-caution"><Info size={16}/> Nenhum astronauta ou valor de exposição fictício foi inserido. Medições ambientais não equivalem à dose individual.</p>
  </div>;
}
