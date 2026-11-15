# Rastreabilidade de dados, fontes e funcionalidades — Mustach

**Objetivo:** registrar *onde* cada fonte científica entra no Mustach, *quais dados* são necessários, *qual arquivo/componente* deve consumir a informação e *o que ainda falta implementar*. Atualizar esta tabela ao conectar cada API.

- [Catálogo e links oficiais das fontes](FONTES-CIENTIFICAS.md)
- [Contratos e limites científicos](CONTRATOS.md)
- [Tecnologias e estrutura do código](TECNOLOGIAS.md)

## Legenda de implantação

- **Interface pronta:** existe tela/contrato, mas sem integração externa.
- **Integrada e testada:** fonte oficial consultada, amostra validada e armazenada localmente. Não implica sincronização contínua.
- **Simulação funcional:** valores gerados localmente em `shared/demo.ts` e/ou `shared/demoBands.ts`; não são medidos por sensores.
- **Pendente:** ainda depende de implementação, autorização ou método científico.
- **Bloqueada:** não deve ser liberada sem dosimetria ou validação apropriada.

## Matriz: recurso → fonte → aplicação

| Recurso da interface | Fontes associadas (IDs do catálogo) | Grandezas/campos esperados | Onde encaixar no código | Situação atual / condição de aceite |
|---|---|---|---|---|
| **Visão geral — Atividade solar, A ocorrência** | D02 previsão SWPC | Probabilidade S1+ %, dia de validade, horário de emissão | `SolarActivityPanel.tsx`; `shared/solar.ts`; `/api/v1/solar/forecast` | **Integrada e testada**. Não confundir probabilidade SEP com dano humano |
| **Atividade solar, B intensidade** | D04 REleASE; D02 GOES em seção observada distinta | Fluxo diferencial previsto por canal (REleASE); fluxo integral observado em pfu (GOES) | `SolarActivityPanel.tsx`; `backend/app/science.py` | **Integrada e testada**; nenhuma conversão entre grandezas |
| **Atividade solar, C evolução** | D04 REleASE; D05 DONKI para contexto independente | Pico e janela quando fornecidos; início/término ausentes permanecem vazios | `SolarActivityPanel.tsx`; `wearable/src/App.tsx` | **Parcial:** REleASE informa pico e janela instantânea; não há início/término previstos |
| **Visão geral — dose acumulada nas últimas 24h** | D01, **somente** com série compatível de taxa de dose equivalente | Série temporal em µSv/h (ou unidade conversível do mesmo tipo), lacunas, fonte/instrumento | `frontend/src/pages/Overview.tsx`, `frontend/src/context/AppContext.tsx`, `shared/radiation.ts` | **V0.7 usa `totalDoseMicroSv('daily')` já existente**; no real sem série válida exibe `—`. Mostrar janela móvel e cobertura parcial |
| **Taxa atual / gráfico ao vivo** | D01 (histórico, se existir série acessível), futuramente sensor local apropriado | Taxa de dose, data, instrumento, frequência/latência | `frontend/src/components/monitoring/LiveRateChart.tsx`, `AppContext.tsx` | Simulação adiciona amostras a cada 2 s. Dados históricos RadLab **não são automaticamente tempo real** |
| **Dashboard de radiação** | D01; D06; N07 para arquitetura operacional | Taxa, tipo de dose, unidade, localização e horário | `frontend/src/pages/Overview.tsx` | Interface; distinguir taxa absorvida µGy/h de equivalente µSv/h |
| **Histórico instrumental RadLab** | D01 | DosTel1, timestamp, µGy/h ou fluxo em cm⁻² sr⁻¹ s⁻¹, módulo, coordenadas, coleta | `frontend/src/components/monitoring/ScientificHistory.tsx`; `/api/v1/measurements` | **Integrado e testado**. Gráfico separado da dose equivalente e de leituras atuais |
| **Histórico 24h / 7 dias** | D01, D06; dosimetria pessoal futura | Série homogênea por instrumento, timestamp, qualidade, cobertura | `frontend/src/components/monitoring/DoseHistory.tsx`; `shared/radiation.ts` | Simulação de 7 dias; integrar por períodos cobertos e marcar lacunas |
| **Mapa corporal 2D / zoom de órgão** | C02, C03, N08, N09, N10 (fundamentação); futura dosimetria de órgãos | Dose ou taxa por órgão/região, modelo físico e incerteza | `frontend/src/components/visualizations/HeatmapBody.tsx`, `OrganDetails.tsx`, `shared/demoBands.ts` | **Simulação de cor somente**; **BLOQUEADO para classificação real por órgão** sem modelo validado |
| **Tripulantes — foto, saúde e exposição pessoal** | N04 para contexto; dados autorizados pessoais/dosímetro futuro | ID, missão, dosímetro vinculado, sinais fisiológicos e consentimento | `frontend/src/pages/Crew.tsx`, `shared/demo.ts`, futuro banco | Só perfis fictícios; **não buscar prontuários reais em OSDR automaticamente** |
| **Sessão EVA — cronômetro** | C03, N07 | Início, fim, pausas e estado da sessão | `frontend/src/components/monitoring/EVAClock.tsx`, `AppContext.tsx` | Cronômetro funcional sem sensor; tempo sozinho não mede radiação |
| **Sessão EVA — dose do período** | C03, N07; dosímetro pessoal futuro | Série de **dose equivalente pessoal** com timestamp e ID da EVA | `shared/radiation.ts`, `AppContext.tsx`, `EVAClock.tsx` | Estimativa sintética; dose real permanece indisponível sem vínculo de sensor |
| **Wearable — coração/estado de radiação** | Futuro dispositivo pessoal; N07 e C02 como referência | Dose pessoal, taxa e relógio da última leitura; status por critério validado | `wearable/src/App.tsx`, `wearable/src/services/api.ts` | Prévia web fictícia; **não existe smartwatch pareado** |
| **Wearable — atividade solar** | D02 probabilidade; D04 intensidade se fonte escolhida | Modelo SEP, horizonte e valores disponíveis | `wearable/src/App.tsx`, `shared/solar.ts` | **Integrado** no modo real; não combina modelos nem converte fluxo em dose |
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
| `POST /api/v1/wearable/heartbeat` / `GET /api/v1/wearable/connection` | Presença da **prévia web** | Não representam pareamento físico |

**Cuidado:** o gráfico que se atualiza a cada 2 segundos contém dados **gerados no navegador**; uma API externa não deve receber automaticamente esse intervalo como se fosse frequência do instrumento da NASA.

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
Contrato Mustach e arquivo de integração:
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

A Visão geral apresenta resumo e painel lateral; o Wearable consome a mesma evidência individual. O antigo sinal ambiental independente do relógio deixou de representar a avaliação individual. Gráficos da missão, séries de perfil e sinais vitais permanecem ilustrativos e não alimentam decisões clínicas nem esta avaliação automaticamente.

`POST /api/v1/demo/operational-event/personal-measurement` demonstra recebimento e resolução de disponibilidade na mesma ocorrência. Os exemplos ficam no snapshot operacional, nunca misturados à tabela de observações. As novas coletas oficiais também **não** alimentam automaticamente a avaliação pessoal. Detalhes e limitações estão em [CONTRATOS.md](CONTRATOS.md).
