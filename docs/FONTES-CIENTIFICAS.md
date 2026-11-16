# Catálogo de fontes científicas — Radiance

> Última revisão documental: **15/11/2026**. Este catálogo cobre as fontes consultadas nas pesquisas do NASA Space Apps Challenge 2026 e candidatas às próximas etapas. **Estar listado aqui não significa que a fonte já esteja conectada ao software.**
>
> **Situação atual:** o modo Simulação ainda usa dados sintéticos locais. A coleta manual da FastAPI já consulta RadLab, NOAA, CCMC REleASE e DONKI SEP; CSA e OSDR fisiológico permanecem referências de pesquisa. Os tripulantes são fictícios. Não há dosímetro, relógio físico ou monitor médico pareado.

Consulte também:

- [Rastreabilidade: fonte → campo → tela → arquivo → critérios](RASTREABILIDADE-DADOS.md)
- [Tecnologias e arquitetura](TECNOLOGIAS.md)
- [Contratos e limites científicos](CONTRATOS.md)

## Como ler as tabelas

- **Dados candidatos:** fonte que pode fornecer medições, previsão ou eventos para uma integração futura, sujeita à confirmação dos campos, qualidade, direitos de uso e cobertura temporal.
- **Referência científica:** justifica fenômenos, modelos e requisitos, mas **não é API de leituras em tempo real**.
- **Acesso restrito:** documentação pública pode existir, mas o software/modelo ou certos dados requerem autorização.
- **Integrada:** há consulta reproduzível, parser, SQLite e teste. A coleta é explícita, sem atualização automática garantida.

## 1. Dados e serviços candidatos à integração

| ID | Fonte oficial | Dados / natureza | Uso planejado no Radiance | Estado |
|---|---|---|---|---|
| **D01** | [NASA OSDR RadLab — documentação da API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) · [DosTel1](https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/dostel1) | Série histórica DosTel1/ISS; `absorbed_dose_rate` em µGy/h e `flux` em cm⁻² sr⁻¹ s⁻¹ | Histórico instrumental, sem dosimetria individual | **Integrada e testada** para DosTel1 |
| **D02** | [NOAA SWPC — GOES Proton Flux](https://www.swpc.noaa.gov/products/goes-proton-flux) · [JSON GOES](https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json) · [probabilidades](https://services.swpc.noaa.gov/json/solar_probabilities.json) | Fluxo integral observado em ≥10, ≥50, ≥100 MeV; probabilidade S1+ para três dias | Série observada e A do painel solar | **Integrada e testada** |
| **D03** | [NOAA SWPC — alertas JSON](https://services.swpc.noaa.gov/products/alerts.json) · [escala NOAA](https://www.swpc.noaa.gov/noaa-scales-explanation) | Alertas e avisos oficiais; não são alertas clínicos | Avisos internos no cabeçalho | **Integrada e testada** |
| **D04** | [NASA CCMC — SEP Scoreboard](https://ccmc.gsfc.nasa.gov/scoreboards/sep/) · [API ISWA](https://ccmc.gsfc.nasa.gov/tools/ISWA/) | REleASE: fluxo diferencial previsto, canal, local e janela; não fornece A neste produto | B/C do mesmo painel solar por modelo selecionado | **Integrada e testada** para REleASE |
| **D05** | [NASA Open APIs — DONKI](https://api.nasa.gov/) | Catálogo SEP e eventos vinculados; sem causalidade inferida | Contexto histórico via API, não dosimetria | **Integrada e testada** para SEP; FLR/CME não integrados |
| **D06** | [NASA Environmental Data Application (EDA)](https://visualization.osdr.nasa.gov/eda/) | Dados ambientais históricos de missões e condições na ISS, quando disponíveis | Estudos de exposição acumulada e comparação contextual de ambientes | Candidata; **não conectada** |
| **D07** | [NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov/) | Metadados e estudos biológicos/ambientais em missões espaciais | Fundamentação e pesquisa; não gerar diagnóstico de astronauta | Candidata para pesquisa; **não conectada** |
| **D08** | [NASA MSL/RAD — CDAWeb](https://cdaweb.gsfc.nasa.gov/cgi-bin/eval2.cgi?dataset=MSL_RAD_OBS-L2&index=sp_phys) · [registro NASA](https://data.nasa.gov/dataset/mars-science-laboratory-msl-radiation-assessment-detector-rad-level-2-observation-dosimetr-e2695) | Observações históricas de radiação associadas ao rover Curiosity em Marte | Cenário marciano de pesquisa; não corresponde a dose de pessoa dentro de habitat | Futuro; **não conectada** |
| **D09** | [NASA LRO/CRaTER — PDS](https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn:nasa:pds:lro-crater) | Observações de partículas/radiação na órbita lunar | Cenário lunar histórico; não equivale diretamente à dose em solo lunar | Futuro; **não conectada** |

**Atenção ao formato:** a integração atual cobre somente produtos e períodos explicitados em [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md); não representa aprovação para uso clínico ou operacional.

### 1.1. Ligações entre as fontes

- **D01** mede o ambiente de instrumentos específicos; não é um dosímetro pessoal genérico.
- **D02/D03** descrevem clima espacial observado e alertas da NOAA; não medem dose corporal.
- **D04** agrega **previsões** de modelos SEP, que podem ter diferentes horizontes, unidades, energia e locais de aplicação.
- **D05** informa **eventos**, não exposição humana.
- **D06–D09** podem sustentar estudos de cenários e séries **históricas**, sem afirmar monitoramento ao vivo do mesmo local.

## 2. Referências NASA — missão, risco, operação e limites

| ID | Publicação oficial | Conteúdo relevante | Aplicação conceitual |
|---|---|---|---|
| **N01** | [NASA Space Apps 2026 — Health Monitoring Software](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources) | Enunciado e recursos do desafio | Escopo e justificativa do produto |
| **N02** | [HRP — 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) · [Space Radiation Hazard](https://www.nasa.gov/hrp/hazard-space-radiation/) | Riscos ambientais e fontes de radiação como GCR e SPE | Glossário, categorias e limites interpretativos |
| **N03** | [HRP — Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) · [Space Radiation Risks](https://www.nasa.gov/hrp/radiation/space-radiation-risks/) | Riscos humanos investigados; não um cálculo individual pronto | Documentação sobre efeitos possíveis e incertezas |
| **N04** | [HRP — Ongoing Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | Estudos fisiológicos, biomarcadores, sono e pesquisas em andamento | Requisitos futuros de acompanhamento, sem diagnóstico automático |
| **N05** | [NASA Space Radiation Element — About](https://www.nasa.gov/reference/about-the-space-radiation-element/) · [Risk Approach Plans (PDF)](https://www.nasa.gov/wp-content/uploads/2026/08/hrp-rap-for-web-62026-sr.pdf) | Agenda de pesquisa e mitigação de risco | Limitações do modelo e roadmap científico |
| **N06** | [NASA Human Research Roadmap — Cancer Evidence Report 2026 (PDF)](https://humanresearchroadmap.nasa.gov/evidence/reports/HRP-ER-CANCER-SR-20260811.pdf) | Evidências e incertezas no risco de câncer por radiação espacial | Base para linguagem prudente, **não** previsão individual |
| **N07** | [NASA SRAG — Space Radiation Analysis Group](https://srag.jsc.nasa.gov/Index.cfm) · [Como a NASA protege astronautas](https://srag.jsc.nasa.gov/SpaceRadiation/How/How.cfm) | Operação de dosímetros, vigilância, EVA, análise de eventos | Inspiração para fluxos de alerta, sessão EVA e tipos de sensor |
| **N08** | [NASA-STD-3001 — Human Performance, seção 4.8](https://www.nasa.gov/reference/4-0-human-performance/) | Requisitos e grandezas radiológicas para missões e órgãos | Referência para futuras regras **após validação dos critérios** |
| **N09** | [NASA THREE — Health Risks of Extraterrestrial Environments](https://three.jsc.nasa.gov/) · [artigo sobre detectores ativos na ISS (PDF)](https://three.jsc.nasa.gov/articles/CurrentActiveDetectors.pdf) | Enciclopédia, instrumentos, conceitos físicos e radiobiológicos | Definições, unidades, documentação técnica |
| **N10** | [NASA Integrative Risks Models Toolkit](https://www.nasa.gov/hrp/radiation/integrative-risks-models-toolkit/) | Exemplos de modelos como HZETRN, ARRBOD e ferramentas para exposição/efeitos | Arquitetura futura; **acesso ao software pode ser restrito** |
| **N11** | [NASA Space Radiation Laboratory — NSRL](https://www.nasa.gov/mission/nasa-space-radiation-lab/) | Experimentos com radiação em laboratório | Pesquisa e validação científica, não telemetria de voo |
| **N12** | [NASA Space Radiation Tissue Sharing Forum](https://www.nasa.gov/hrp/radiation/space-radiation-tissue-sharing-forum/) | Amostras/estudos para pesquisadores autorizados | Pesquisa posterior, fora do MVP |
| **N13** | [NASA Space Radiation Miniseries](https://www.nasa.gov/hrp/space-radiation-miniseries/) · [Meet the SRE Team](https://www.nasa.gov/hrp/radiation/space-radiation-meet-the-team/) | Explicações e pesquisadores | Educação e indicação de linhas de pesquisa |
| **N14** | [NASA — Cancer Moonshot](https://www.nasa.gov/humans-in-space/nasa-scientists-join-white-house-cancer-initiative/) · [Collaborate with HRP](https://www.nasa.gov/hrp/collaborate-with-hrp/) | Pesquisa colaborativa e contatos institucionais | Contexto e possibilidades futuras; não fonte de dados do dashboard |

## 3. Referências CSA — dosímetros, nêutrons e EVA

| ID | Publicação oficial | Conteúdo relevante | Aplicação conceitual |
|---|---|---|---|
| **C01** | [CSA — Monitoring radiation for astronaut health (26/02/2026)](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Canadian Active Neutron Spectrometer (**CANS**), sensor autônomo de nêutrons em desenvolvimento | Roadmap para dados de nêutrons, **sem API pública confirmada** |
| **C02** | [CSA — MOSFET and Matroshka-R](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp) | Dosimetria MOSFET e investigação de exposição por regiões/tecidos | Pesquisa para zoom de órgãos e calibração apropriada |
| **C03** | [CSA — EVARM](https://www.asc-csa.gc.ca/eng/iss/evarm.asp) | Dosímetros durante caminhadas espaciais (EVA) | Referência para sessão e dose individual, não feed contínuo |
| **C04** | [CSA — Radi-N / Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) | Monitoramento de nêutrons em locais da ISS e com astronautas | Fundamentar possível mapa radiológico por módulo |
| **C05** | [CSA — Why conduct science experiments in space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) | Contexto e importância das pesquisas espaciais | Justificativa do produto e autonomia de missão |

### Evitar interpretações inválidas

1. **Dose absorvida** (`Gy`, `µGy/h`), **dose equivalente** (`Sv`, `µSv/h`) e **fluxo de prótons** (`pfu`) são grandezas diferentes. Não converter somente renomeando unidades.
2. Uma taxa de radiação ambiental não mede diretamente a **dose pessoal**, nem permite preencher órgãos com risco vermelho por si só.
3. O mapa com três cores é hoje um **efeito visual relativo dentro da simulação**, não um sistema validado de limites clínicos. Ver [contratos](CONTRATOS.md).
4. A dose acumulada exige integrar, ao longo do tempo, **taxas de dose equivalentes compatíveis**; apresentar quantidade de intervalo coberto e lacunas.
5. A classificação NOAA S1–S5 refere-se a **eventos solares próximos à Terra**, não ao estado de saúde de um astronauta.
6. O fato de um instrumento, modelo ou artigo ser público **não garante que seus dados estejam disponíveis livremente, em tempo real ou via API**.
7. Dados de saúde reais requerem autorização de acesso, minimização de informações pessoais e política de retenção.

## 4. Procedimento para aprovar uma fonte na implementação

Para cada nova integração, preencher antes a entrada respectiva em [RASTREABILIDADE-DADOS.md](RASTREABILIDADE-DADOS.md): ID da fonte; variável e unidade original; local/instrumento; cobertura histórica; latência; formato/API; autorização e cotas; direitos/licença; qualidade/incerteza; tratamento de falhas; ligação a componente; teste com amostra reproduzível; data da revisão. Somente então mudar o estado **Candidata → Integrada e testada**.

Na documentação e no software, usar terminologia consistente: `OBSERVED` (medido), `FORECAST` (previsto), `SIMULATED` (fictício). As integrações científicas atuais são explícitas, não telemetria continuamente sincronizada.
