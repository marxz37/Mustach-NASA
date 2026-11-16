# Dados científicos efetivamente consultados — Radiance

Registro das coletas locais de **15/11/2026 (America/Sao_Paulo)**, com timestamps abaixo em **UTC**. A auditoria documental conferiu o SQLite existente por conexão somente leitura (`mode=ro&immutable=1`), sem executar coletores, importar dados ou alterar o banco. Os totais são fotografias históricas desta estação, **não contagens atuais permanentes**; um clone novo começa sem essas observações científicas. A aplicação nunca usa esses registros como avaliação médica ou autorização EVA.

Todas as fontes da tabela são **INTEGRATED — Scientific data actually used**, nos subconjuntos indicados. Isso é sustentado por coletor/parser (`science.py`, `collect.py`), contrato/API (`main.py`, `measurements.py`), persistência (`db.py`), testes (`backend/tests/test_science.py`) e registros locais de coleta. As classificações de fundamentação/pesquisa estão no [catálogo](FONTES-CIENTIFICAS.md) e o inventário para o formulário em [RECURSOS-SUBMISSAO.md](RECURSOS-SUBMISSAO.md).

## Primeira coleta bem-sucedida de cada produto

| Produto / agência | Endpoint consultado | Registros adicionados inicialmente | Período real / validade | Coleta inicial (UTC) | Destino |
|---|---|---|---|---|---|
| DosTel1 / NASA OSDR RadLab | [Consulta exata](#radlab) | 11 timestamps; **22 medições**: 11 taxas absorvidas e 11 fluxos; equivalente ausente | 2022-04-01 23:00:00–23:12:25 | 2026-11-15 22:57:38 | `measurements`; histórico instrumental Web |
| GOES-18 / NOAA SWPC | [JSON GOES](https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json) | **210 medições**, 70 por canal ≥10/≥50/≥100 MeV | Observações de 2026-11-15 17:00–22:45 | 2026-11-15 22:57:04 | `measurements`; observações no painel solar Web |
| Previsão de 3 dias / NOAA SWPC (produto, não dosímetro) | [JSON](https://services.swpc.noaa.gov/json/solar_probabilities.json) + [texto](https://services.swpc.noaa.gov/text/3-day-forecast.txt) | **3 horizontes**, 5% por dia nesta emissão | Validade nos dias 15/16/17 de novembro; emissão 2026-11-15 12:30 | 2026-11-15 22:57:05 | `scientific_forecasts`; A no Web e resumo Wearable |
| HESPERIA REleASE SOHO/EPHIN 30 min / NASA CCMC (hospedagem) | [ISWA](https://iswa.ccmc.gsfc.nasa.gov/api/redirect?dataID=1215) | **2 canais** de previsão | Emissão 2026-11-15 22:04:14; janela pontual 22:27:34 | 2026-11-15 22:57:07 | `scientific_forecasts`; arquivo Web após expirar; B/C somente se não expirado e selecionado |
| Boletins oficiais / NOAA SWPC (produto) | [JSON](https://services.swpc.noaa.gov/products/alerts.json) | **41 boletins** aceitos, não 41 notificações SEP | Emissões entre 2026-10-17 20:14:23 e 2026-11-15 13:34:32 | 2026-11-15 22:57:06 | `scientific_alerts`; apenas SEP elegíveis no Wearable |
| Catálogo SEP / NASA DONKI (instrumentos/modelos nos metadados) | [API e documentação](https://api.nasa.gov/) | **14 eventos** históricos | Eventos de 2024-05-09 13:59 a 2024-05-13 18:07 | 2026-11-15 23:05:16 | `scientific_events`; API `/api/v1/solar-events`, sem painel dedicado |

O horário de coleta vem de `collected_at`; `ingestion_runs.attempted_at` registra a tentativa logo após o resultado e `records_added` informa somente novos IDs. Houve uma tentativa RadLab com erro antes do sucesso das 22:57:38. Valores brutos, grandezas, unidades e limitações de cada produto estão abaixo. O número de registros de uma fixture de teste reduzida não equivale ao tamanho da coleta.

## RadLab

- **Instituição/produto:** NASA Open Science Data Repository, RadLab Data API. [Documentação](https://visualization.osdr.nasa.gov/radlab/gui/data-api/), [DosTel1 na base de conhecimento](https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/dostel1).
- **Escolha do instrumento:** `DosTel1` na ISS, módulo Columbus. A API documenta filtro por `instrument_id`, timestamps, grandezas e metadados. O intervalo histórico pequeno é reproduzível e evita consultas excessivas. Outros instrumentos não são assumidos equivalentes.
- **Consulta exata:**

```text
https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=DosTel1&timestamp%3E=2022-04-01T23%3A00%3A00&timestamp%3C2022-04-01T23%3A20%3A00&absorbed_dose_rate&dose_equivalent_rate&flux&instrument_family&spacecraft&module&latitude&longitude&altitude&b&l&format=json
```

- **Campos originais:** `timestamp`, `instrument_id`, `absorbed_dose_rate`, `dose_equivalent_rate`, `flux`, `instrument_family`, `spacecraft`, `module`, `latitude`, `longitude`, `altitude`, `b`, `l`. Cada linha original permanece em `measurements.details_json`; `source_url` e `collected_at` ficam em colunas próprias.
- **Unidades:** µGy/h para taxa de dose absorvida, cm⁻² sr⁻¹ s⁻¹ para fluxo. `dose_equivalent_rate` veio nulo nesta amostra e **não** foi criado valor µSv/h. Coordenadas, altitude, B e L são contexto físico; não são dose pessoal.
- **Transformações:** timestamps sem offset da API são interpretados como UTC e normalizados para ISO 8601 com `+00:00`; valor e unidade não são convertidos. A correspondência foi verificada consultando `timestamp=1648854000` (Unix 2022-04-01 23:00:00 UTC), que devolve a mesma linha `2022-04-01T23:00:00` de DosTel1. ID determinístico por fonte/instrumento/horário/grandeza evita duplicação. Não se interpola uma lacuna.
- **Implementação/teste:** `backend/app/science.py`, `backend/app/collect.py`, `backend/app/db.py`, `backend/tests/test_science.py`; `frontend/src/components/monitoring/ScientificHistory.tsx`. Fixture oficial reduzida: `backend/tests/fixtures/radlab-dostel1-2022-04-01.json`.
- **Limitação:** uma taxa ambiental histórica não informa dose individual, órgão, risco ou telemetria atual. A série de fluxo não é integrada como dose. Consultar os termos e citação da NASA antes de republicar o dataset; este protótipo não declara licença própria sobre dados da NASA.

## NOAA GOES e previsão

- **Agência/produto:** NOAA Space Weather Prediction Center. [GOES Proton Flux](https://www.spaceweather.gov/products/goes-proton-flux), [serviço JSON](https://services.swpc.noaa.gov/json/goes/primary/), [previsão oficial](https://services.swpc.noaa.gov/text/3-day-forecast.txt). O coletor usa a identificação `satellite` recebida; GOES-18 descreve esta amostra, não um satélite primário fixo para sempre.
- **GOES observado:** campos `time_tag`, `satellite`, `energy`, `flux`; canais integrais ≥10/≥50/≥100 MeV separados, unidade `pfu` (prótons cm⁻² s⁻¹ sr⁻¹ acima do limiar energético). Registro original preservado. Sem conversão para dose.
- **Previsão:** `10mev_protons_1_day`, `_2_day`, `_3_day` são probabilidades em **%**, ligadas à emissão `:Issued:` do texto de três dias. O parser exige concordância da data dos dois produtos; isso não prova equivalência de revisões intradiárias diferentes. Nesta coleta, o texto apresentou **S1 ou maior 5%** por dia. [O limiar S1](https://www.spaceweather.gov/noaa-scales-explanation) é fluxo ≥10 MeV de pelo menos 10 pfu, não probabilidade de dano pessoal. O JSON não fornece intensidade máxima nem início/pico/término: ficam nulos.
- **Avisos:** produto textual, **sem unidade de dose**. `product_id`, `issue_datetime`, mensagem original, linha `ALERT`/`WATCH`/`WARNING` (incluindo continuação/cancelamento) e `Valid To` reconhecido pelo parser são armazenados em `scientific_alerts`. O parser atual não extrai todas as variantes textuais de validade (por exemplo `Now Valid Until`); na ausência do campo aplica-se a janela local de uma hora. Apenas os elegíveis pelo filtro SEP aparecem no **Wearable**; não existe central/sino no Web. Avisos geomagnéticos ou de elétrons não são dose humana.
- **Implementação:** `backend/app/science.py`, `collect.py`, `db.py`, `solar_notices.py`; `/api/v1/measurements`, `/api/v1/solar/forecast`, `/api/v1/solar/alerts`, `/api/v1/wearable/solar-notices`; `SolarActivityPanel.tsx` e `wearable/src/SolarNotice.tsx`.
- **Condições de uso:** serviços públicos NOAA/SWPC, com atribuição ao produto/agência; confirmar termos vigentes antes de redistribuição. Valores e disponibilidade são os da emissão, não garantia de atualidade após a coleta.

## CCMC SEP Scoreboard

- **Agência/produto:** NASA CCMC hospeda o SEP Scoreboard; o modelo mostrado é HESPERIA REleASE, não uma medição instrumental da NASA. [Scoreboard e links ISWA](https://ccmc.gsfc.nasa.gov/scoreboards/sep/), [API ISWA](https://ccmc.gsfc.nasa.gov/tools/ISWA/).
- **Endpoint consultado:** `https://iswa.ccmc.gsfc.nasa.gov/api/redirect?dataID=1215`. Ele aponta para o arquivo mais recente e **não fixa** uma amostra histórica. O arquivo exato devolvido nesta coleta foi:

```text
https://iswa.ccmc.gsfc.nasa.gov/iswa_data_tree/model/heliosphere/sep_scoreboard/RELEASE/30Min/sohoephin/2026/11/HESPERIA_REleASE_SOHO_EPHIN.2026-11-15T222734Z.2026-11-15T220414Z.json
```

- **Campos:** `model.short_name`, `issue_time`, `forecasts[].energy_channel.min/max/units`, `species`, `location`, `prediction_window.start_time/end_time`, `peak_intensity.intensity/units/time`. Canais separados; intensidade diferencial em `MeV^-1*s^-1*cm^-2*sr^-1`, local L1. Sem conversão para `pfu` e sem mistura com a previsão NOAA.
- **Fixture histórica:** [JSON original de 10/03/2026](https://iswa.ccmc.gsfc.nasa.gov/iswa_data_tree/model/heliosphere/sep_scoreboard/RELEASE/30Min/sohoephin/2026/03/HESPERIA_REleASE_SOHO_EPHIN.2026-03-10T215104Z.2026-03-10T212643Z.json), reduzida fielmente em `backend/tests/fixtures/ccmc-release-2026-03-10.json`. Seu teste confirma que **não** aparece como previsão atual em novembro.
- **Implementação:** `science.py`, `collect.py`, tabela `scientific_forecasts`, seleção por registro/modelo em `SolarActivityPanel.tsx`; o Wearable prioriza NOAA dia 1, senão resume o primeiro modelo não expirado disponível, sem compor campos. Expirados não aparecem na previsão corrente; permanecem acessíveis em `/api/v1/solar/forecast/history`. Nesta coleta, a previsão REleASE já estava expirada ao ser recebida: **foi utilizada como registro histórico, não como previsão vigente**.
- **Condições de uso:** verificar as [Rules of the Road do CCMC](https://ccmc.gsfc.nasa.gov/scoreboards/sep/) para validação/publicação. ISWA classifica produtos como qualidade de protótipo/pesquisa; não usar como autorização operacional.

## DONKI e pesquisa fisiológica

- **DONKI — INTEGRATED:** `GET https://api.nasa.gov/DONKI/SEP?startDate=2024-05-09&endDate=2024-05-13&api_key=DEMO_KEY` foi consultado em 15/11/2026, às 23:05:16 UTC. [Documentação e atribuição CCMC](https://ccmc.gsfc.nasa.gov/tools/DONKI/). Não há grandeza de dose/unidade dosimétrica: são eventos com horários, instrumentos/modelos associados e relações. Campos persistidos: `sepID`, `eventTime`, `instruments`, `linkedEvents`, `submissionTime`, `versionId`, `link`, mapeados para ID/horário/metadados. `NASA_API_KEY` pode substituir `DEMO_KEY` no ambiente, nunca no front-end. Esses registros não são medições pessoais nem prova de causalidade. O relato inicial de consulta 10–15/11/2026 sem eventos é histórico; lista vazia não certifica ausência de SEP em outros períodos. FLR/CME não são coletados, embora seus IDs possam constar de `linkedEvents`. Manter atribuição ao catálogo, contribuidores e regras de publicação CCMC.
- **OSDR fisiológico — FUTURE RESEARCH:** [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575) e [OSD-881](https://osdr.nasa.gov/bio/repo/data/studies/OSD-881) são entradas de pesquisa histórica do projeto, **não dados utilizados**. Não existe coletor, importação ou associação desses datasets aos perfis fictícios. Não extrapolar estudos de animais para estado clínico humano. Conteúdo, consentimento e licença de cada arquivo precisam ser conferidos antes de qualquer uso futuro; não se declara uma licença CC0 universal para datasets não importados.
- **Órgãos — SCIENTIFIC REFERENCE:** [NASA-STD-3001 Vol. 1](https://www.nasa.gov/reference/nasa-std-3001v1/), [MOSFET/Matroshka](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp), [EVARM](https://www.asc-csa.gc.ca/eng/iss/evarm.asp) e [Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) fundamentam a separação entre medição ambiental, pessoal e dosimetria específica. Não são feeds ativos nem limites numéricos implementados. Nenhum valor RadLab/GOES é pintado como risco real no mapa corporal.

## Reproduzir e verificar

Na pasta `backend/`, com a API local parada ou em execução (não é preciso pará-la para coletar):

```powershell
.\.venv\Scripts\python.exe -m app.collect radlab
.\.venv\Scripts\python.exe -m app.collect goes
.\.venv\Scripts\python.exe -m app.collect noaa-forecast
.\.venv\Scripts\python.exe -m app.collect noaa-alerts
.\.venv\Scripts\python.exe -m app.collect ccmc
.\.venv\Scripts\python.exe -m app.collect donki --start 2024-05-09 --end 2024-05-13
.\.venv\Scripts\python.exe -m pytest -q tests\test_science.py
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/measurements?source=NASA%20OSDR%20RadLab&quantity=absorbed_dose_rate'
```

O primeiro comando é idempotente para o mesmo intervalo; os demais consultam produtos que podem mudar, então quantidades não são garantidas. `GET /api/v1/science/ingestion-runs` mostra sucesso/erro de cada tentativa. `SENTINELA_DATABASE_PATH` permite usar um banco separado para reproduzir sem tocar o banco atual. O SQLite é a única persistência offline; a API local deve permanecer disponível. Não há agendamento automático de coleta nem verificação contínua de conectividade externa.

## Revalidação dos refinamentos — 15/11/2026 (horário local)

Esta seção preserva o relato histórico das execuções anteriores. A auditoria documental **não reexecutou** esses comandos/testes; confirmou as quantidades e horários persistidos por leitura do banco.

`python -m app.collect all` e nova consulta DONKI de 09–13/05/2024 responderam sem erro. RadLab, NOAA de três dias, CCMC e DONKI repetidos não duplicaram registros. O total persistido GOES chegou a **246 pontos (82 por canal)** de 15/11 17:00 a 23:45 UTC, por acumulação de consultas de janela móvel; não é o tamanho garantido de uma única resposta de seis horas. Permanecem 22 medições RadLab (11 timestamps), 3 horizontes NOAA, 2 canais CCMC, 41 boletins NOAA e 14 eventos históricos DONKI. O período corrente DONKI segue sem novos SEP nesta consulta.

As previsões CCMC pontuais já expiraram e ficam no arquivo, não na previsão vigente. Campos A/B/C ausentes continuam nulos. Fluxo GOES e REleASE não alimentam dose individual, dose absorvida nem cores reais por órgão. As verificações incluem unidade, canal, emissão futura, expiração, cancelamento de boletim, duplicação, contexto de identidade, reinício e integridade SQLite. Nenhuma nova API científica foi adicionada.

Detalhe rastreável de `ingestion_runs`: GOES adicionou **33** registros em 15/11/2026 23:52:25 UTC e **3** em 23:53:43 UTC, além dos 210 iniciais. A última medição salva é 23:45 UTC; **246 = 210 + 33 + 3**, e não o tamanho fixo da API. RadLab, probabilidades, CCMC, boletins e DONKI mantêm os totais da tabela inicial nesta fotografia. Há novas tentativas sem inserções às 00:05 UTC de **16/11/2026** (ainda 15/11 no horário local) para alertas/CCMC/DONKI; `records_added: 0` não significa ausência de registros existentes nem renovação da emissão científica.

### Política experimental dos avisos SEP (não clínica)

- Base científica: [boletins SWPC](https://www.spaceweather.gov/products/alerts-watches-and-warnings) e [escalas NOAA](https://www.spaceweather.gov/noaa-scales-explanation). G1–G5 são geomagnéticas; S1–S5 são tempestades de radiação solar. Não são intercambiáveis nem classificações de saúde.
- `OFFICIAL`: só boletins NOAA cuja **linha principal** menciona prótons/SEP/tempestade de radiação solar. `ALERT` é evento reportado; `WATCH`/`WARNING` são aviso/previsão, nunca perigo pessoal confirmado. Texto original é mantido em inglês para não mudar seu significado; rótulos, ações e resumo são EN/PT/ES.
- `Valid To` limita a validade quando existe. Sem prazo explícito, usa-se janela local conservadora de **1 hora da emissão**, sem alegar duração do evento. Nenhum boletim com mais de 24h é notificado. Produtos substituídos, cancelados, encerrados, futuros ou expirados são excluídos; continuam no arquivo.
- `FORECAST`: corte **demonstrativo de atenção**, nunca crítico: NOAA com probabilidade >=50%, emissão <=24h e horizonte ainda válido. O aviso mostra um horizonte elegível, sem média/máximo agregado entre os três dias. Uma emissão tem ID estável, evitando três vibrações.
- CCMC REleASE: corte demonstrativo >=0,1 em `MeV^-1*s^-1*cm^-2*sr^-1`, somente canais 15,8–39,8 ou 28,2–50,1 MeV, emissão <=24h e validade não expirada. Cada modelo/canal fica separado. Esse corte demonstra a interface: **não** é S1 nem critério operacional validado e nunca é convertido para pfu. Outros modelos/unidades não geram avisos por suposição.
- Elegibilidade é calculada no back-end. Avisos não usam RadLab nem leituras ambientais/pessoais para determinar saúde. Não há push. Reconhecimento e tentativas hápticas ficam neste navegador; apagar seu armazenamento remove o histórico. Vibração começa desativada, depende do suporte e políticas do navegador e pode ser recusada mesmo com a função presente.

### Roteiro fictício compartilhado

`backend/app/simulation.py` é a autoridade; `shared/simulation.ts` contém contrato, transporte e traduções. `simulation_state` guarda execução, revisão, relógio, velocidade e transições manuais. Taxa equivalente e fluxo solar são **grandezas sintéticas independentes**, não conversão uma da outra. Não se infere taxa absorvida da taxa equivalente.

| Cenário | Taxa equivalente fictícia (µSv/h) | Probabilidade fictícia | Fluxo máximo fictício (pfu) | Aviso |
|---|---|---|---|---|
| Normal | 0,35 + onda de ±0,025 | 18% | 2,4 | Nenhum SEP |
| Previsto | 0,52 + onda de ±0,025 | 65% | 12 | Previsão SIMULADA |
| Em andamento | 1,6 + onda entre 0 e 0,3 | 100% | 35 | Evento SIMULADO |
| Recuperação | 0,35 + 1,2 × exp(-segundos/600) | 15% | 4 | Nenhum novo SEP |

Os cortes de `shared/demoBands.ts` continuam fictícios. As transições são manuais; tempo e curvas evoluem dentro de cada cenário. Pausa congela o relógio; 10×/60× aceleram tempo e integração EVA. Reiniciar gera novo ID e limpa a sessão EVA do Web, sem apagar histórico científico. Evidências pré-EVA e métricas clínicas fictícias não mudam automaticamente.

Os front-ends consultam o estado a cada segundo; pode haver diferença de até um ciclo de polling. Sem FastAPI, a simulação não avança nos navegadores e os controles ficam indisponíveis. Utilitários antigos de `shared/demo.ts` continuam para fixtures e transformação de perfis fictícios, mas não geram a previsão das telas em produção.
