# Contratos científicos — Mustach

## Estado inicial

- A **API/banco** inicia com zero medições, zero tripulantes reais e zero eventos solares integrados. **A interface inicia em Simulação por padrão**, preenchida com perfis fictícios e séries sintéticas locais ao navegador; o modo Dados reais continua vazio sem fonte externa.
- Não existem sensores de voo conectados, alertas clínicos ou predições solares reais. O gráfico acompanha leituras novas no modo simulação a cada 2 segundos.
- O mapa corporal 2D é **neutro em dados reais/sem dados**. Em Simulação, responde a faixas sintéticas de teste; não representa dose de órgão ou uma avaliação médica.

## Dados

| Origem | Tipo | Exemplo | Interpretação |
| --- | --- | --- | --- |
| RadLab | OBSERVED | µGy/h | Taxa de dose absorvida, instrumento e época específicos |
| NOAA GOES | OBSERVED | pfu | Fluxo de prótons; NÃO é dose individual |
| CCMC SEP | FORECAST | intensidade, intervalo | Previsão por modelo, localização e energia próprias |
| Simulador próprio | SIMULATED | valores sintéticos | Nunca rotular como observado |

## Regras

1. Cada medida deverá ter `measured_at`, `instrument`, `quantity`, `unit`, `source`, `provenance`, `mission`.
2. O banco não terá medições falsas pré-carregadas.
3. Quando uma origem real não fornecer medição, a interface exibirá ausência de dados, sem fallback silencioso. A **interface inicia em “Simulação”** com uma série sintética histórica gerada localmente (7 dias para demonstrar gráficos) e amostras de atualização contínua. Esse histórico fictício nunca é gravado no banco como observação.
4. Dose absorvida (Gy) e equivalente (Sv) não são intercambiáveis.
5. Uma integração temporal de taxa de dose só pode ocorrer com série dosimétrica homogênea e interpretação correta das lacunas.
6. Para a visualização **real** de exposição por órgão, nenhum valor numérico nem cor de risco é exibido sem dados e critérios validados. **Somente a simulação** usa faixas fictícias de cores, identificadas como demonstração.
7. Alertas de saúde NÃO são diagnósticos médicos.
8. A previsão SEP de `GET /api/v1/solar/forecast` contém registros separados por modelo, com provedor, fonte, emissão, janela de validade, probabilidade de ocorrência, fluxo máximo com unidade, energia e horários de início/pico/término. A resposta vazia usa `status: no_forecast` e `models: []`.
9. Não combinar modelos com horizontes, unidades ou faixas de energia diferentes. Probabilidade de evento SEP não é probabilidade de dano à saúde, e fluxo de prótons não se converte diretamente em dose individual.

## Referências

- https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- https://www.swpc.noaa.gov/products/goes-proton-flux
- https://api.nasa.gov/
- https://ccmc.gsfc.nasa.gov/scoreboards/sep/
- https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp

## Regras de monitoramento V0.4

10. O gráfico de 24h registra taxa de dose equivalente em µSv/h. A taxa de dose absorvida em µGy/h não se converte em µSv/h por simples troca de unidade.
11. Nunca integrar leituras de instrumentos/ambientes diferentes na mesma série de dose; lacunas acima do intervalo de validade configurado não são extrapoladas. Resultados parciais devem ser explicitamente identificados.
12. Uma EVA tem tempo decorrido independente da dosimetria. Sem dosímetro pessoal identificado, a dose da sessão permanece indisponível, mesmo que a NOAA publique dados em tempo real.
13. Cores no corpo simulam apenas a aparência do mapa; não há percentuais por região. Para exibir um mapa de dose por órgão serão necessários modelos validados ou medições apropriadas.
14. O heartbeat do Wearable informa somente atividade do protótipo web, não sincronização com relógio físico.
15. EN é o idioma inicial; PT e ES são seleções de interface. Valores de APIs preservam grandezas e unidades originais.

## Documentação de integração

- [Catálogo completo de fontes científicas](FONTES-CIENTIFICAS.md)
- [Rastreabilidade de campos, telas e arquivos](RASTREABILIDADE-DADOS.md)
- [Tecnologias em uso e planejadas](TECNOLOGIAS.md)

**V0.7:** o segundo indicador superior apresenta dose equivalente **acumulada em 24h (mSv)**, não a mesma taxa instantânea (µSv/h) do gráfico; exibe `—` quando não há série compatível. Isso **não equivale à dose pessoal** de um tripulante sem fonte individual associada. A janela pode ser parcial quando existem lacunas.

## V0.9 — Avaliação contextual de preparação

`GET /api/v1/demo/operational-event` retorna uma única ocorrência: `DEMO-EVT-001`, atividade `EVA-01`, fase `PREPARATION`, origem `SIMULATED`, fonte fictícia `DEMO-SOLAR-01` e referência fixa `scenario_at: 2026-11-15T12:00:00Z`. Esse horário ancora o roteiro; não é horário de coleta, emissão de previsão nem sincronização. O evento não é derivado da previsão `SYN-SEP / 01` ou de fluxo de prótons.

| Campo | Significado |
| --- | --- |
| `personal_reading_available` | Disponibilidade definida pelo roteiro, sem valor dosimétrico ou sensor associado |
| `missing_data` | Contexto de atividade, associação ambiental e/ou leitura pessoal ausentes |
| `status` | `REVIEW_PENDING` enquanto houver lacuna, evento sinalizado ou consulta não registrada; `REVIEW_RECORDED` no restante |
| `next_check` | `DEMO-RAD-01`: roteiro demonstrativo da equipe, sem protocolo NASA ou conduta médica |
| `acknowledged_at` | Horário UTC em que a API aceitou o registro da conferência |
| `revision` | Versão usada para rejeitar alterações feitas contra um estado antigo |
| `scenario_id` / `inputs` | Variação persistida do roteiro e seus dados de entrada, nunca medições |
| `scheduled_at` | Programação fixa da atividade no cenário; nulo quando falta o contexto |
| `assessment.data_state` | `INCOMPLETE`, `ATTENTION` ou `AVAILABLE`: disponibilidade/contexto, nunca aptidão |
| `assessment.review_state` | `PENDING` ou `RECORDED`: registro da consulta, separado dos dados |
| `assessment.steps` | Estados e justificativas das três etapas, calculados no servidor |
| `assessment.available_count` | Informações disponíveis, incluindo informações que exigem atenção; não verificações aprovadas |
| `assessment.next_action` | Próxima verificação contextual, determinada pela prioridade dos dados ausentes |
| `assessment.requires_attention` | Relevância do aviso passivo enviado ao Wearable |

- `POST .../scenario`: recebe `expected_revision` e `scenario_id`; muda a variação e invalida o registro anterior. O seletor booleano `personal_reading_available` da V0.8 permanece aceito para compatibilidade; não pode ser enviado junto com `scenario_id`.
- `POST .../acknowledge`: exige `expected_revision`, `context_reviewed: true` e `availability_checked: true`. Os nomes dos campos de confirmação foram preservados por compatibilidade; a interface envia-os por uma ação explícita de registrar a consulta ao roteiro, sem checkboxes. Não aprova EVA, inicia cronômetro ou preenche medições ausentes.
- Revisão antiga resulta em HTTP 409; campos incompletos resultam em HTTP 422. Uma atualização SQLite condicional impede que duas alterações aceitem a mesma revisão.
- Persistência em `demo_operational_event`, separada de `measurements`. Web e Wearable consultam o mesmo ID a cada três segundos; somente o Web expõe controles de consulta e cenário. O relógio apresenta um resumo passivo dentro da tela, sem interação para conferir a EVA.
- Falha de consulta: identificar o último estado conhecido e bloquear edição. Falha de gravação: manter feedback visível; não registrar localmente uma confirmação fictícia.
- As séries dosimétricas e o cronômetro continuam locais. A presença da prévia web não representa smartwatch pareado. Não há autorização, identidade de operador, fila offline ou trilha completa de auditoria nesta demonstração.


### Regras e variações do roteiro

A única função de avaliação é `backend/app/operational.py::assess_preparation`. Os front-ends traduzem e desenham o resultado; não recalculam estados ou prioridades.

| Variação | Dados | Próxima verificação sem consulta |
| --- | --- | --- |
| `missing_personal` | Contexto presente, evento remoto sinalizado, leitura pessoal ausente | Conferir leitura individual |
| `solar_review` | Todas as informações disponíveis; evento remoto sinalizado | Revisar evento remoto |
| `complete` | Todas as informações disponíveis; sem evento remoto sinalizado | Revisar resumo e registrar consulta |
| `missing_environment` | Falta associação das informações ambientais à EVA | Conferir contexto ambiental |
| `missing_context` | Atividade sem contexto; associação ambiental também ausente | Conferir contexto da atividade |

A associação ambiental da atividade é diferente da existência de taxas no dashboard da missão. A ausência dessa associação não apaga as séries do painel. As faixas `Normal / Atenção / Elevado` não são usadas para autorizar ou encerrar a revisão da EVA.

O registro altera apenas o estado da consulta. Se faltam dados ou há evento remoto sinalizado, a ocorrência continua relevante, inclusive após registrar. Sem lacunas nem evento e com consulta registrada, `next_action: NONE` indica ausência de nova verificação automática **neste roteiro**, nunca condição segura ou autorização.

A migração adiciona `scenario_id` à tabela existente e preserva disponibilidade, horário da consulta e revisão. Nenhuma observação radiológica é criada no processo.

## Cobertura e classificação visual

As faixas `Normal / Atenção / Elevado` permanecem disponíveis somente na simulação, conforme os cortes fictícios de `shared/demoBands.ts`. A informação de simulação fica no topo de cada aplicativo. Nos modos reais/sem dados, esses cortes não classificam medições nem preenchem o corpo com cores.

O acumulado e seu histórico integram apenas intervalos consecutivos compatíveis: até 310 s na série sintética e 60 s na série observada. Esses intervalos são regras de processamento do protótipo, **não critérios médicos ou de segurança**. A cobertura corresponde à duração integrada, recortada pela janela móvel; não extrapola as bordas nem preenche lacunas. O gráfico acumulado usa os mesmos intervalos do total e interrompe a linha nas lacunas.

O histórico sintético conserva a grade de cinco minutos de sete dias, mais detalhes recentes de dois segundos. Amostras detalhadas desde o início de uma sessão EVA são preservadas até zerar ou mudar a origem, para não recalcular para menos uma dose já acumulada.
