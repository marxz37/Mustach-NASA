# Contratos científicos — Radiance

## Estado inicial

- Um banco novo inicia com zero medições, sem tripulantes reais. **A interface inicia em Simulação por padrão**, com perfis fictícios; Dados reais exibe somente registros coletados na FastAPI.
- Não existem sensores de voo conectados nem alertas clínicos. Previsões reais NOAA/CCMC podem ser carregadas por coleta explícita, mas não estimam dano individual. O gráfico demonstrativo acompanha amostras sintéticas a cada 2 segundos.
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
2. A tabela `measurements` não recebe exemplos falsos apresentados como observação. A ocorrência demonstrativa persiste evidências explicitamente `SIMULATED` em seu próprio registro.
3. Quando uma origem real não fornecer medição, a interface exibirá ausência de dados, sem fallback silencioso. A **interface inicia em “Simulação”** com uma série sintética histórica gerada localmente (7 dias para demonstrar gráficos) e amostras de atualização contínua. Esse histórico fictício nunca é gravado no banco como observação.
4. Dose absorvida (Gy) e equivalente (Sv) não são intercambiáveis.
5. Uma integração temporal de taxa de dose só pode ocorrer com série dosimétrica homogênea e interpretação correta das lacunas.
6. Para a visualização **real** de exposição por órgão, nenhum valor numérico nem cor de risco é exibido sem dados e critérios validados. **Somente a simulação** usa faixas fictícias de cores, identificadas como demonstração.
7. Alertas de saúde NÃO são diagnósticos médicos.
8. A previsão SEP de `GET /api/v1/solar/forecast` contém registros separados por modelo, com provedor, fonte, emissão, janela de validade, probabilidade de ocorrência, fluxo máximo com unidade, energia e horários de início/pico/término. A resposta vazia usa `status: no_forecast` e `models: []`.
9. Não combinar modelos com horizontes, unidades ou faixas de energia diferentes. Probabilidade de evento SEP não é probabilidade de dano à saúde, e fluxo de prótons não se converte diretamente em dose individual.
9a. O JSON REleASE contém fluxo **diferencial** em `MeV^-1*s^-1*cm^-2*sr^-1`; não o converter em `pfu`. NOAA GOES contém fluxo **integral** em `pfu` por limiar energético. NOAA S1+ é um evento ≥10 MeV/≥10 pfu, não um diagnóstico.
9b. RadLab DosTel1 histórico contém dose absorvida em µGy/h e fluxo em cm⁻² sr⁻¹ s⁻¹. `dose_equivalent_rate` nulo permanece nulo; não se cria dose equivalente nem acumulada a partir desses valores. Timestamps RadLab sem offset são interpretados como UTC e o original fica em `details`.
9c. A API mostra previsões vigentes em `/solar/forecast` e as expiradas somente em `/solar/forecast/history`. Falhas de coleta não apagam registros. A indicação de fonte reflete a última tentativa, não conectividade externa contínua.

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

## V2 refinada — Avaliação baseada em evidência estruturada

A única avaliação operacional é `backend/app/operational.py::assess_preparation`. `shared/operational.ts` contém contrato e cliente, sem motor paralelo. A ocorrência permanece `DEMO-EVT-001 / EVA-01` e o roteiro `DEMO-RAD-01` é uma demonstração da equipe, não um protocolo NASA.

### Medição e contexto

`backend/app/measurements.py::Measurement` reutiliza o contrato original da API: ID, fonte, instrumento, proveniência, horário, grandeza, valor, unidade, missão e região opcional. Foram acrescentados `scope` (pessoal/ambiental), `astronaut_id`, `activity_id`, `location` e `quality`. Valor deve ser finito e não negativo; horário precisa de fuso. Isso é validação de conteúdo, não um limite de exposição.

Uma evidência pessoal utilizável neste roteiro deve:

1. Existir e ter fonte/instrumento/identificador definidos pelo contrato.
2. Pertencer à pessoa, atividade, missão, local e escopo esperados.
3. Ser `SIMULATED`, pois esta avaliação pertence ao roteiro demonstrativo. A API de observações mantém seu contrato e os exemplos nunca são usados como fallback do modo real.
4. Conter `dose_equivalent_rate` em µSv/h (incluindo grafias Unicode compatíveis) ou mSv/h. Não é feita conversão de Gy nem de fluxo de prótons para Sv. O valor e a unidade originais permanecem visíveis.
5. Não estar no futuro nem exceder a janela configurada, em relação ao relógio UTC da API.
6. Ter indicador de qualidade `VALID` no exemplo. `UNKNOWN` e `REVIEW_REQUIRED` exigem conferência; não representam calibração científica comprovada.

O contexto ambiental passa pelas mesmas verificações, com escopo ambiental e sem exigir um astronauta para o instrumento ambiental. O evento remoto tem ID, fonte, proveniência, associação à atividade e emissão próprios; não fornece dose pessoal e não é derivado da previsão independente `SYN-SEP / 01` dos gráficos.

### Três dimensões distintas

| Dimensão | Campos | Significado |
| --- | --- | --- |
| Dados | `assessment.data_state`, `personal_check`, `environment_check` | Disponibilidade e compatibilidade dos registros. `USABLE` não significa seguro |
| Contexto radiológico | `assessment.radiological_state` | Leitura individual disponível/não utilizável ou evento remoto a revisar; sem diagnóstico, probabilidade de dano ou limiar médico |
| Revisão | `assessment.review_state`, `acknowledged_at` | Consulta pendente/registrada; não altera medições nem autoriza EVA |

`personal_check` e `environment_check` expõem estado (`USABLE`, `MISSING`, `STALE`, `INCOMPATIBLE`, `REVIEW_REQUIRED`), ID considerado, motivos, idade e janela aplicável. `assessment.steps` resume contexto, ambiente/evento e leitura pessoal; `available_count` conta apenas informações utilizáveis, nunca etapas aprovadas. `personal_reading_available` e `inputs` são resumos derivados, mantidos por compatibilidade.

`evidence` devolve os registros usados; `evaluated_at` informa a hora da avaliação. `scenario_at` ancora a criação do roteiro; `scheduled_at` é a programação fictícia (duas horas após essa criação), não o horário da medição. `reading_received_at` é a aceitação do novo dado pela API, diferente de `measured_at` e de `acknowledged_at`.

### Regra temporal de engenharia

O padrão é 900 s, configurável por `MUSTACH_DEMO_MAX_READING_AGE_SECONDS` no ambiente do processo. Não é requisito médico validado da NASA. Exemplo no PowerShell, antes de iniciar a API:

```powershell
$env:MUSTACH_DEMO_MAX_READING_AGE_SECONDS = "900"
```

A API reavalia em cada consulta. O intervalo normal de polling é três segundos; não há atualização instantânea. As leituras guardam seus horários após reiniciar a API. A idade aumenta com o relógio real: a reinicialização não fabrica atualidade.

### Operações compartilhadas

| Endpoint sob `/api/v1/demo/operational-event` | Entrada | Efeito |
| --- | --- | --- |
| `GET` | — | Evidência e avaliação da mesma ocorrência |
| `POST /scenario` | `expected_revision` e `scenario_id` | Recria o contexto demonstrativo e invalida a consulta. O seletor booleano legado continua aceito exclusivamente como escolha de fixture estruturada |
| `POST /personal-measurement` | `expected_revision`, `measurement` opcional | Persiste e reavalia uma nova medição. Sem payload de medição, gera explicitamente um exemplo pessoal associado ao contexto existente. Não muda cenário, evento remoto nem ID da ocorrência |
| `POST /acknowledge` | `expected_revision`, `context_reviewed: true`, `availability_checked: true` | Registra consulta ao roteiro; campos antigos mantidos para compatibilidade, enviados por uma única ação explícita |

O endpoint de demonstração rejeita payloads `OBSERVED`/`FORECAST` (422). Pode receber um registro sintético cujo conteúdo não serve à EVA, para explicar associação/unidade/qualidade incorretas. Não gerar leitura automaticamente quando falta a atividade. Não registrar ciência nem receber dados contra revisão antiga (409).

No cenário padrão A falta a leitura pessoal. Registrar a consulta mantém a ausência. A ação de receber medição válida leva ao cenário funcional B sem trocar a fixture selecionada: a disponibilidade é resolvida, a consulta anterior é invalidada, e eventual evento remoto C continua exigindo revisão. Os exemplos D de idade, pessoa incorreta ou qualidade não são suficientes para a verificação.

As variantes existentes foram estendidas para `stale_personal`, `wrong_personal` e `quality_review`. Nenhuma configuração adiciona medição observada real ou estado `SAFE`, `HEALTHY` ou `CLEARED`.

### Persistência e falhas

SQLite permanece com a tabela de observações intacta. O registro operacional recebe três campos aditivos: `context_json` (evidências), `assessment_signature` (estado semântico) e `reading_received_at`. Não se cria outra plataforma de dados. Atualizações usam transação e comparação de revisão.

Na migração da versão anterior, a fixture é convertida em contexto estruturado. Uma consulta antiga é invalidada uma única vez porque não cobria a evidência agora avaliada; o cenário é preservado. A partir daí, reiniciar a API preserva consulta e evidências, salvo se uma regra temporal ou um dado relevante mudar.

Uma transição por expiração limpa a consulta e incrementa a revisão uma única vez. Segundos de idade sem mudança de significado não geram revisões novas. A verificação de revisão também reconcilia expiração antes de gravar, rejeitando consulta sobre estado antigo.

Web e Wearable leem o mesmo resultado. O relógio é passivo: estado da leitura, revisão, horário e próxima verificação, sem classificação local de pendência. Só o Web apresenta fonte/evidências e gravações. O modo real continua sem avaliação demonstrativa automática.

Indisponibilidade da avaliação na API local não significa problema de comunicação com a Terra. Ausência de medição não significa falha da prévia web do relógio. O heartbeat comprova somente contato da prévia com a API, nunca sensor ou pareamento físico. Falha de consulta identifica o último resultado conhecido e bloqueia gravação; não existe fila offline.

## Cobertura e classificação visual

As faixas `Normal / Atenção / Elevado` permanecem disponíveis somente na simulação, conforme os cortes fictícios de `shared/demoBands.ts`. A informação de simulação fica no topo de cada aplicativo. Nos modos reais/sem dados, esses cortes não classificam medições nem preenchem o corpo com cores.

O acumulado e seu histórico integram apenas intervalos consecutivos compatíveis: até 310 s na série sintética e 60 s na série observada. Esses intervalos são regras de processamento do protótipo, **não critérios médicos ou de segurança**. A cobertura corresponde à duração integrada, recortada pela janela móvel; não extrapola as bordas nem preenche lacunas. O gráfico acumulado usa os mesmos intervalos do total e interrompe a linha nas lacunas.

O histórico sintético é reconstruído pela FastAPI: sete dias em grade de cinco minutos, dia em execução a cada 30 segundos e últimos 10 minutos a cada dois segundos, com pontos nas transições. A sessão EVA usa o relógio demonstrativo e intervalos compatíveis até 310 s; a janela máxima disponível é sete dias. Reiniciar o roteiro ou trocar origem limpa a sessão, sem reaproveitar um acumulado de outra execução. Nenhuma taxa absorvida é derivada da equivalente.

## Refinamentos: simulação e avisos SEP

`GET/POST /api/v1/demo/simulation` compartilha estado persistido em `simulation_state`. POST exige `expected_revision`; conflito retorna 409. Os quatro cenários e velocidades 1×/10×/60× são demonstrativos. Não escrevem em `measurements`, previsões científicas nem evidências pré-EVA. Se a API falhar, não existe gerador de fallback no navegador.

`GET /api/v1/wearable/solar-notices` seleciona boletins oficiais NOAA e previsões elegíveis por regras **não clínicas**, documentadas em [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md). Apenas Wearable mostra esses avisos; não há central no Web. A classificação distingue aviso oficial, previsão e simulação. Reconhecimento e tentativas de vibração ficam no navegador, sem fila de push ou pareamento físico. Vibração é opt-in, experimental e nunca substitui o sinal visual.

O banner `Pre-EVA review pending` foi removido do Wearable: a pendência do roteiro persistido não comprova uma sessão de preparação ativa no relógio. O Web mantém a revisão e o motor operacional inalterados; a linha de evidência pessoal do relógio continua consultando a API, sem convertê-la em aviso solar. O relógio reserva notificações aos SEP elegíveis. Em Simulação, Previsto/Em andamento notificam somente com emissão/validade coerentes com o relógio demonstrativo; Normal/Recuperação não geram aviso SEP.

A ingestão real exige token e rejeita contexto incompatível de um ID existente, inclusive pessoa/atividade/qualidade. Valores ambientais não substituem leituras pessoais e não classificam órgãos reais.
