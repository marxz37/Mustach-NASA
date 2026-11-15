# Dados científicos efetivamente consultados — Mustach

Registro da coleta local de **15/11/2026**. Os resultados abaixo descrevem a amostra salva no SQLite desta estação; um clone novo começa com banco vazio. Serviços externos mudam com o tempo. A aplicação nunca usa esses registros como avaliação médica ou autorização EVA.

| Produto / agência | Endpoint consultado | Registros obtidos nesta coleta | Intervalo dos dados | Persistência / apresentação |
|---|---|---:|---|---|
| RadLab DosTel1 / NASA OSDR | [API RadLab com filtros](#radlab) | 11 timestamps; **22 medições** (11 taxas absorvidas, 11 fluxos; dose equivalente ausente) | 2022-04-01 23:00:00–23:12:25 UTC | `measurements`; histórico instrumental do Web |
| Fluxo integral GOES-18 / NOAA SWPC | [JSON GOES](https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json) | **210 medições**, 70 por canal ≥10, ≥50 e ≥100 MeV | 2026-11-15 17:00–22:45 UTC | `measurements`; série observada dentro do painel solar |
| Probabilidades de 3 dias / NOAA SWPC | [JSON](https://services.swpc.noaa.gov/json/solar_probabilities.json) e [previsão textual](https://services.swpc.noaa.gov/text/3-day-forecast.txt) | **3 horizontes**; 5% em cada dia nesta emissão | dias 15, 16 e 17/11/2026; emissão 15/11 12:30 UTC | `scientific_forecasts`; A do Web e Wearable |
| REleASE SOHO 30-min / NASA CCMC (modelo HESPERIA) | [redirecionamento ISWA](https://iswa.ccmc.gsfc.nasa.gov/api/redirect?dataID=1215) | **2 canais energéticos** | emissão 15/11/2026 22:04:14 UTC; janela pontual 22:27:34 UTC | `scientific_forecasts`; B/C do Web enquanto válido; arquivo após expiração |
| Avisos oficiais / NOAA SWPC | [JSON de alertas](https://services.swpc.noaa.gov/products/alerts.json) | **41 alertas/avisos** aceitos | 2026-10-17 20:14:23–2026-11-15 13:34:32 UTC | `scientific_alerts`; avisos recentes no cabeçalho |
| Catálogo SEP / NASA DONKI | [API DONKI SEP](https://api.nasa.gov/) | **14 eventos históricos** | 2024-05-09 13:59–2024-05-13 18:07 UTC | `scientific_events`; `/api/v1/solar-events`, sem inferência causal |

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

- **Agência/produto:** NOAA Space Weather Prediction Center. [GOES Proton Flux](https://www.swpc.noaa.gov/products/goes-proton-flux), [serviço JSON](https://services.swpc.noaa.gov/json/goes/primary/), [previsão oficial](https://services.swpc.noaa.gov/text/3-day-forecast.txt).
- **GOES observado:** campos `time_tag`, `satellite`, `energy`, `flux`; canais integrais ≥10/≥50/≥100 MeV separados, unidade `pfu` (prótons cm⁻² s⁻¹ sr⁻¹ acima do limiar energético). Registro original preservado. Sem conversão para dose.
- **Previsão:** os campos `10mev_protons_1_day`, `_2_day`, `_3_day` são ligados à emissão `:Issued:` da previsão textual de três dias. Nesta coleta, a previsão textual apresentou **S1 ou maior 5%** em cada um dos três dias. [NOAA define o limiar S1](https://www.swpc.noaa.gov/noaa-scales-explanation) como fluxo de prótons ≥10 MeV de pelo menos 10 pfu; isso não é probabilidade de dano pessoal. O JSON não fornece intensidade máxima nem horários de início/pico/término; esses campos ficam nulos.
- **Avisos:** `product_id`, `issue_datetime` e linha `ALERT`/`WATCH`/`WARNING` são armazenados em `scientific_alerts`. O cabeçalho apresenta apenas os recentes; outros ficam no arquivo. Avisos geomagnéticos ou de elétrons não são tratados como dose humana.
- **Implementação:** `backend/app/science.py`, `collect.py`, `db.py`; `/api/v1/measurements`, `/api/v1/solar/forecast`, `/api/v1/solar/alerts`; `SolarActivityPanel.tsx` e `NotificationCenter.tsx`.
- **Condições de uso:** serviços públicos NOAA/SWPC, com atribuição ao produto/agência; confirmar termos vigentes antes de redistribuição. Valores e disponibilidade são os da emissão, não garantia de atualidade após a coleta.

## CCMC SEP Scoreboard

- **Agência/produto:** NASA CCMC hospeda o SEP Scoreboard; o modelo mostrado é HESPERIA REleASE, não uma medição instrumental da NASA. [Scoreboard e links ISWA](https://ccmc.gsfc.nasa.gov/scoreboards/sep/), [API ISWA](https://ccmc.gsfc.nasa.gov/tools/ISWA/).
- **Endpoint consultado:** `https://iswa.ccmc.gsfc.nasa.gov/api/redirect?dataID=1215`. Ele aponta para o arquivo mais recente e **não fixa** uma amostra histórica. O arquivo exato devolvido nesta coleta foi:

```text
https://iswa.ccmc.gsfc.nasa.gov/iswa_data_tree/model/heliosphere/sep_scoreboard/RELEASE/30Min/sohoephin/2026/11/HESPERIA_REleASE_SOHO_EPHIN.2026-11-15T222734Z.2026-11-15T220414Z.json
```

- **Campos:** `model.short_name`, `issue_time`, `forecasts[].energy_channel.min/max/units`, `species`, `location`, `prediction_window.start_time/end_time`, `peak_intensity.intensity/units/time`. Canais separados; intensidade diferencial em `MeV^-1*s^-1*cm^-2*sr^-1`, local L1. Sem conversão para `pfu` e sem mistura com a previsão NOAA.
- **Fixture histórica:** [JSON original de 10/03/2026](https://iswa.ccmc.gsfc.nasa.gov/iswa_data_tree/model/heliosphere/sep_scoreboard/RELEASE/30Min/sohoephin/2026/03/HESPERIA_REleASE_SOHO_EPHIN.2026-03-10T215104Z.2026-03-10T212643Z.json), reduzida fielmente em `backend/tests/fixtures/ccmc-release-2026-03-10.json`. Seu teste confirma que **não** aparece como previsão atual em novembro.
- **Implementação:** `science.py`, `collect.py`, tabela `scientific_forecasts`, seleção por modelo em `SolarActivityPanel.tsx`; o Wearable resume um modelo sem compor outros. Modelos expirados só aparecem em `/api/v1/solar/forecast/history`.
- **Condições de uso:** verificar as [Rules of the Road do CCMC](https://ccmc.gsfc.nasa.gov/scoreboards/sep/) para validação/publicação. ISWA classifica produtos como qualidade de protótipo/pesquisa; não usar como autorização operacional.

## DONKI e pesquisa fisiológica

- **DONKI:** `GET https://api.nasa.gov/DONKI/SEP?startDate=2024-05-09&endDate=2024-05-13&api_key=DEMO_KEY` foi consultado em 15/11/2026. Campos persistidos: `sepID`, `eventTime`, `instruments`, `linkedEvents`, `submissionTime`, `versionId`, `link`. `NASA_API_KEY` pode substituir `DEMO_KEY` no ambiente, nunca no front-end. Eventos são contexto histórico, não prova de causalidade nem dose. Consulta do período corrente (10–15/11/2026) devolveu lista vazia. FLR/CME ainda não integrados.
- **OSDR fisiológico:** [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575) descreve biomarcadores séricos de quatro participantes da Inspiration4, com amostras pré/pós-voo; não é monitoramento ao vivo e não será associado aos perfis fictícios. [OSD-881](https://osdr.nasa.gov/bio/repo/data/studies/OSD-881) é estudo de ventrículo direito **em camundongos**, com radiação experimental e dieta; não deve produzir estado clínico humano. Ambos são públicos no catálogo (ver metadados e licenças CC0 indicados nas páginas), mas **nenhum dado fisiológico foi importado ao Mustach**. Sono e outros datasets demandam estudo específico antes de uso.
- **Órgãos:** [NASA-STD-3001 Vol. 1](https://www.nasa.gov/reference/nasa-std-3001v1/) discute limites por órgãos sob dosimetria/modelagem apropriada. [MOSFET/Matroshka](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp), [EVARM](https://www.asc-csa.gc.ca/eng/iss/evarm.asp) e [Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) são referências, não feeds ativos. Nenhum valor RadLab/GOES é pintado como risco real no mapa corporal.

## Reproduzir e verificar

Na pasta `backend/`, com a API local parada ou em execução (não é preciso pará-la para coletar):

```powershell
.\.venv\Scripts\python.exe -m app.collect radlab
.\.venv\Scripts\python.exe -m app.collect goes
.\.venv\Scripts\python.exe -m app.collect noaa-forecast
.\.venv\Scripts\python.exe -m app.collect ccmc
.\.venv\Scripts\python.exe -m pytest -q tests\test_science.py
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/measurements?source=NASA%20OSDR%20RadLab&quantity=absorbed_dose_rate'
```

O primeiro comando é idempotente para o mesmo intervalo; os demais consultam produtos que podem mudar, então quantidades não são garantidas. `GET /api/v1/science/ingestion-runs` mostra sucesso/erro de cada tentativa. `SENTINELA_DATABASE_PATH` permite usar um banco separado para reproduzir sem tocar o banco atual. O SQLite é a única persistência offline; a API local deve permanecer disponível. Não há agendamento automático de coleta nem verificação contínua de conectividade externa.
