# Rastreabilidade de dados, fontes e funcionalidades — Radiance

**Objetivo:** registrar o comportamento verificado na `main`, separando implementações de pesquisa futura. Auditoria documental de 15/11/2026: fontes comparadas com coletores, parsers, contratos, testes e registros locais existentes, sem executar novas coletas ou alterar o banco.

- [Catálogo e links oficiais das fontes](FONTES-CIENTIFICAS.md)
- [Contratos e limites científicos](CONTRATOS.md)
- [Tecnologias e estrutura do código](TECNOLOGIAS.md)
- [Inventário em inglês para submissão](RECURSOS-SUBMISSAO.md)

## Legenda de implantação

- **Interface pronta:** existe tela/contrato, mas sem integração externa.
- **Integrada e testada:** fonte oficial consultada, amostra validada e armazenada localmente. Não implica sincronização contínua.
- **Simulação funcional:** relógio e séries reconstruídos em `backend/app/simulation.py`, com estado em SQLite e leitura pela FastAPI; `shared/demo.ts` transforma perfis fictícios e mantém auxiliares de teste, enquanto `shared/demoBands.ts` define somente faixas visuais fictícias.
- **Pendente:** ainda depende de implementação, autorização ou método científico.
- **Bloqueada:** não deve ser liberada sem dosimetria ou validação apropriada.

## Matriz: recurso → fonte → aplicação

| Recurso da interface | Fontes associadas (IDs do catálogo) | Grandezas/campos esperados | Onde encaixar no código | Situação atual / condição de aceite |
|---|---|---|---|---|
| **Visão geral — Atividade solar, A ocorrência** | D02 previsão SWPC | Probabilidade S1+ %, dia de validade, horário de emissão | `SolarActivityPanel.tsx`; `shared/solar.ts`; `/api/v1/solar/forecast` | **Integrada e testada**. Não confundir probabilidade SEP com dano humano |
| **Atividade solar, B intensidade** | D04 REleASE; D02 GOES em seção observada distinta | Fluxo diferencial previsto por canal (REleASE); fluxo integral observado em pfu (GOES) | `SolarActivityPanel.tsx`; `backend/app/science.py` | **Integrada e testada**; nenhuma conversão entre grandezas |
| **Atividade solar, C evolução** | D04 REleASE; D05 DONKI para contexto independente | Pico e janela quando fornecidos; início/término ausentes permanecem vazios | `SolarActivityPanel.tsx`; `wearable/src/App.tsx` | **Parcial:** REleASE informa pico e janela instantânea; não há início/término previstos |
| **Visão geral — dose acumulada nas últimas 24h** | Simulação; contrato para taxa equivalente ambiental compatível | Série temporal em µSv/h, lacunas, fonte/instrumento/missão | `frontend/src/pages/Overview.tsx`, `frontend/src/context/AppContext.tsx`, `shared/radiation.ts` | `totalDoseMicroSv('daily')` integra apenas intervalos cobertos e mostra mSv/cobertura. **A amostra D01 não contém taxa equivalente**, portanto não preenche esse total |
| **Taxa atual / gráfico ao vivo** | Simulação compartilhada; taxa equivalente observada compatível, se importada | Taxa equivalente, horário e identificação da série | `frontend/src/components/monitoring/LiveRateChart.tsx`, `AppContext.tsx` | FastAPI fornece as amostras sintéticas, inclusive detalhe recente de 2 s; polling de 1 s. A indicação de valor atual exige amostra de até 120 s. RadLab histórico fica em gráfico separado |
| **Dashboard de radiação** | D01 para taxa absorvida histórica; série equivalente independente; N07 como referência | Taxa, tipo de dose, unidade e horário | `frontend/src/pages/Overview.tsx`, `AppContext.tsx` | Taxas atuais exigem idade inferior a 120 s; registros históricos não preenchem indicadores atuais. Na simulação, a taxa absorvida fica vazia, não é derivada da equivalente. D06 não está conectado |
| **Histórico instrumental RadLab** | D01 | DosTel1, timestamp, µGy/h ou fluxo em cm⁻² sr⁻¹ s⁻¹, módulo, coordenadas, coleta | `frontend/src/components/monitoring/ScientificHistory.tsx`; `/api/v1/measurements` | **Integrado e testado**. Gráfico separado da dose equivalente e de leituras atuais |
| **Histórico 24h / 7 dias** | Simulação compartilhada; contrato para série equivalente observada | Série homogênea, timestamp, cobertura temporal | `frontend/src/components/monitoring/DoseHistory.tsx`; `shared/radiation.ts` | Integração trapezoidal e linha quebrada nas lacunas; 310 s de intervalo máximo sintético, 60 s observado. D06 e dosimetria pessoal real não estão integrados |
| **Mapa corporal 2D / zoom de órgão** | C02, C03, N08, N09, N10 (fundamentação); futura dosimetria de órgãos | Dose ou taxa por órgão/região, modelo físico e incerteza | `frontend/src/components/visualizations/HeatmapBody.tsx`, `OrganDetails.tsx`, `shared/demoBands.ts` | **Simulação de cor somente**; **BLOQUEADO para classificação real por órgão** sem modelo validado |
| **Tripulantes — foto, saúde e exposição pessoal** | N04 para contexto; dados autorizados pessoais/dosímetro futuro | ID, missão, dosímetro vinculado, sinais fisiológicos e consentimento | `frontend/src/pages/Crew.tsx`, `shared/demo.ts`, futuro banco | Só perfis fictícios; **não buscar prontuários reais em OSDR automaticamente** |
| **Sessão EVA — cronômetro** | C03, N07 | Início, fim, pausas e estado da sessão | `frontend/src/components/monitoring/EVAClock.tsx`, `AppContext.tsx` | Cronômetro funcional sem sensor; tempo sozinho não mede radiação |
| **Sessão EVA — dose do período** | C03, N07; dosímetro pessoal futuro | Série de **dose equivalente pessoal** com timestamp e ID da EVA | `shared/radiation.ts`, `AppContext.tsx`, `EVAClock.tsx` | Estimativa sintética; dose real permanece indisponível sem vínculo de sensor |
| **Wearable — monitor de exposição / leitura pessoal** | Simulação compartilhada; evidência pessoal fictícia da pré-EVA | Taxa ambiental simulada; disponibilidade e horário da evidência pessoal separados | `wearable/src/App.tsx`, `shared/simulation.ts`, `shared/operational.ts` | A primeira tela da simulação prioriza a taxa **ambiental fictícia** e resume a leitura pessoal separadamente. Nos demais modos não há avaliação pessoal disponível. Não usa coração/estado clínico nem smartwatch pareado |
| **Wearable — atividade solar** | D02 probabilidade; D04 se for o primeiro modelo elegível na ausência de NOAA dia 1 | Um único registro de previsão: A/B/C disponíveis | `wearable/src/App.tsx`, `shared/solar.ts` | No real prioriza NOAA dia 1, senão o primeiro modelo não expirado retornado; não há seletor no relógio. Campos ausentes ficam `—`; modelos não são combinados |
| **Wearable — notificações SEP** | D03 boletins; D02/D04 previsões; cenário fictício separado | Emissão, validade, natureza e fonte do aviso | `backend/app/solar_notices.py`, `wearable/src/SolarNotice.tsx`, `wearable/src/notices.ts` | Somente Wearable. Critérios experimentais, reconhecimento local e vibração opcional; **sem central no Web** e sem diagnóstico |
| **Contextos ISS, Lua e Marte** | D01, D06, D08, D09 | Corpo celeste, local, altitude/orbita, instrumento, época e unidades | Futuras telas/módulos após definição de contratos | Pendente; não misturar locais nem instrumentos distintos |
| **Mapa de nêutrons dentro da ISS** | C01, C04; instrumentos existentes em N07 | Local físico, detector, intervalo, dose apropriada e blindagem | Futuro módulo de mapa interno | Pesquisa apenas; dados por módulo ainda não disponibilizados para o app |
| **Risco biológico de longo prazo / blindagem avançada** | N03, N05, N06, N08, N10, N11 | Modelos e validação especializados | Somente roadmap/documentação | **Fora do MVP**; não calcular % de câncer ou diagnóstico sem validação |

## Contratos atualmente existentes

| Endpoint atual | Para que serve | O que retorna hoje |
|---|---|---|
| `GET /health` | Disponibilidade básica | Estado do serviço |
| `GET /api/v1/status` | Status da API e contagem de medições | Contagem e horário de coleta local |
| `GET /api/v1/measurements` | Leituras por fonte/grandeza/intervalo | Dados observados persistidos, inclusive metadados originais |
| `GET /api/v1/solar/forecast` | Previsões por modelo não expiradas | NOAA/CCMC separados; `no_forecast` se nenhuma válida |
| `GET /api/v1/solar/forecast/history` | Arquivo de previsões | Inclui expiradas com emissão original |
| `GET /api/v1/solar/alerts` / `GET /api/v1/solar-events` | Avisos NOAA / eventos DONKI | Contexto não clínico |
| `GET /api/v1/science/ingestion-runs` | Estado das coletas | Sucessos e falhas preservados |
| `POST /api/v1/science/measurements` | Recebimento local autorizado | Inativo sem `MUSTACH_INGEST_TOKEN`; somente fontes locais |
| `GET /api/v1/crew` | Tripulação | Lista vazia |
| `GET /api/v1/wearable/status` | Estado genérico do relógio | Sem dispositivo real e sem leituras pessoais |
| `GET /api/v1/wearable/solar-notices` | Avisos SEP elegíveis | Boletins e previsões separados; limiares demonstrativos não clínicos |
| `POST /api/v1/wearable/heartbeat` / `GET /api/v1/wearable/connection` | Presença da **prévia web** | Não representam pareamento físico |
| `GET/POST /api/v1/demo/simulation` | Estado/controle da simulação compartilhada | Execução, relógio, cenários, amostras reconstruídas e previsão fictícia; controle por revisão |

**Cadência não é aquisição:** o polling lê SQLite/FastAPI; não dispara coleta externa. O detalhe sintético de dois segundos é gerado no back-end e não representa frequência de um instrumento NASA. O estado de simulação persiste, mas as curvas são reconstruídas nas consultas. Sem FastAPI não há avanço local independente.

**Acumulado e cobertura:** os totais de 24 h/7 dias e o gráfico acumulado usam os mesmos intervalos consecutivos compatíveis, recortados na janela e integrados por trapézios. A duração coberta não inclui lacunas nem extrapolação de bordas; sem intervalo válido o total é `null`/`—`. A redução visual de pontos do ECharts não entra no cálculo. O Web consulta até 500 medições pela chamada geral e seleciona uma série ambiental por fonte/instrumento/missão; não há garantia de cobertura integral no modo real. O histórico RadLab usa consulta filtrada (até 2000 pontos), preserva µGy/h/fluxo e não se transforma em acumulado pessoal.

## Registro para futuras integrações (copiar por fonte)

```text
Fonte/ID:
URL oficial e documentação do endpoint:
Responsável / licença / termos:
Tipo de dado: OBSERVED | FORECAST | EVENT | REFERENCE
Missão, nave, localização, instrumento ou modelo:
Grandeza e unidade original:
Horários: timestamp, timezone, janela de validade, frequência e latência:
Formato/API, chave, limites de uso e histórico:
Qualidade, calibração, incerteza e lacunas:
Transformações e conversões justificadas:
Contrato Radiance e arquivo de integração:
Exemplo de resposta sanitizado e teste automatizado:
Estado: pesquisa | protótipo de integração | validado | em produção
Data de revisão / responsável:
```

## Próximos passos científicos

1. Ampliar a cobertura instrumental por períodos e missões somente após verificar documentação e cadência de cada instrumento.
2. Investigar outros modelos CCMC sem fundir horizontes ou unidades; REleASE não fornece as três categorias completas.
3. Somente após obter dosimetria pessoal e método adequado avaliar estado de saúde, EVA real e exposição por órgãos.


## V2 refinada — Ocorrência individual compartilhada

`backend/app/measurements.py` define o contrato de medição reaproveitado pelo motor. A ocorrência `DEMO-EVT-001 / EVA-01`, associada a Maya Bennett, guarda evidências pessoais e ambientais sintéticas com identidade, instrumento, unidade, horário, missão/local e qualidade. `backend/app/operational.py` valida utilizabilidade e contexto; `backend/app/db.py` preserva conteúdo/revisão e reconcilia expiração.

A Visão geral apresenta resumo e painel lateral; o Wearable consulta a mesma evidência individual em uma linha separada. A primeira tela do relógio também apresenta o sinal ambiental da simulação compartilhada, explicitamente fictício e não pessoal. O banner persistente de pendência pré-EVA foi removido do Wearable. Gráficos da missão, séries de perfil e sinais vitais não alimentam essa avaliação automaticamente nem produzem decisões clínicas.

`POST /api/v1/demo/operational-event/personal-measurement` demonstra recebimento e resolução de disponibilidade na mesma ocorrência. Os exemplos ficam no snapshot operacional, nunca misturados à tabela de observações. As novas coletas oficiais também **não** alimentam automaticamente a avaliação pessoal. Detalhes e limitações estão em [CONTRATOS.md](CONTRATOS.md).
