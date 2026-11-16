# Catálogo de fontes científicas — Radiance

> Auditoria documental: **15/11/2026**. Classificação baseada em código, contratos, testes e registros de coleta já existentes na cópia local da `main`. **Uma citação em Markdown, sozinha, não comprova integração nem importação de dados.**
>
> **Situação atual:** a FastAPI executa a simulação compartilhada, persistindo seu estado no SQLite. Coletores manuais separados consultam RadLab, NOAA, CCMC REleASE e DONKI SEP. A CSA fundamenta decisões; dados fisiológicos OSDR não foram importados. Tripulantes e sinais vitais são fictícios. Não há dosímetro, relógio físico ou monitor médico pareado.

Consulte também:

- [Rastreabilidade: fonte → campo → tela → arquivo → critérios](RASTREABILIDADE-DADOS.md)
- [Tecnologias e arquitetura](TECNOLOGIAS.md)
- [Contratos e limites científicos](CONTRATOS.md)
- [Inventário para o formulário NASA Space Apps](RECURSOS-SUBMISSAO.md)

## Como ler as tabelas

- **INTEGRATED — Scientific data actually used:** coletor, parser, contrato, testes e registros de coleta documentados. Uso limitado ao produto/instrumento explicitado, não à totalidade do portal.
- **SCIENTIFIC REFERENCE:** fundamentação efetivamente ligada às decisões documentadas; não alimenta gráficos nem fornece medições individuais.
- **FUTURE RESEARCH:** pesquisa registrada, sem dados importados ou modelo executado pelo Radiance. Não cadastrar como fonte integrada.
- **NOT USED:** sem contribuição verificável para a implementação ou fundamentação aproveitada; excluir do inventário de recursos utilizados. Um link relacionado ao tema não comprova uso.

`Development Tool` é a classificação adicional do **inventário de submissão** para ferramentas e bibliotecas; não é uma fonte científica. Acesso público a uma página não implica licença irrestrita, feed ao vivo ou disponibilidade do software descrito.

## 1. Fontes INTEGRATED

| ID | Fonte oficial | Dados / natureza | Uso verificado no Radiance | Classificação |
|---|---|---|---|---|
| **D01** | [NASA OSDR RadLab — documentação da API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) · [DosTel1](https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/dostel1) | Série histórica DosTel1/ISS; `absorbed_dose_rate` em µGy/h e `flux` em cm⁻² sr⁻¹ s⁻¹ | Histórico instrumental, sem dose equivalente na amostra nem dosimetria individual | **INTEGRATED**, subconjunto DosTel1 |
| **D02** | [NOAA SWPC — GOES Proton Flux](https://www.spaceweather.gov/products/goes-proton-flux) · [JSON GOES](https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json) · [probabilidades](https://services.swpc.noaa.gov/json/solar_probabilities.json) | Fluxo integral observado em ≥10, ≥50, ≥100 MeV; probabilidade S1+ para três horizontes diários | Série observada e A do painel solar; previsão resumida no Wearable | **INTEGRATED** |
| **D03** | [NOAA SWPC — alertas JSON](https://services.swpc.noaa.gov/products/alerts.json) · [escala NOAA](https://www.spaceweather.gov/noaa-scales-explanation) | Boletins oficiais arquivados; somente os SEP elegíveis viram notificações | **Notificações SEP exclusivamente no Wearable**, via `solar_notices.py`. Não há central/sino de notificações no Web | **INTEGRATED** |
| **D04** | [NASA CCMC — SEP Scoreboard](https://ccmc.gsfc.nasa.gov/scoreboards/sep/) · [ISWA](https://ccmc.gsfc.nasa.gov/tools/ISWA/) | HESPERIA REleASE: fluxo diferencial previsto por canal/local/janela, não probabilidade neste produto | B/C no painel Web; o Wearable pode resumir um registro REleASE se selecionado pela prioridade atual | **INTEGRATED**, REleASE SOHO de 30 min; não todos os modelos CCMC |
| **D05** | [NASA Open APIs](https://api.nasa.gov/) · [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Catálogo SEP, incluindo instrumentos/modelos indicados pelo provedor e eventos vinculados | Persistência e `/api/v1/solar-events`; não há painel DONKI dedicado nem inferência causal individual | **INTEGRATED**, somente SEP; FLR/CME não coletados |

Evidências comuns: `backend/app/science.py` (adaptadores), `collect.py` (seis coletores: D02 tem GOES e probabilidades), `db.py` (persistência), `main.py` (contratos/consultas) e `backend/tests/test_science.py`. D03 também tem `solar_notices.py` e `test_simulation_notices.py`. Períodos, horários de coleta, fixtures e limites estão em [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md). Nenhuma dessas integrações implica coleta externa automática ou validação operacional.

### 1.1. Dados investigados, não importados — FUTURE RESEARCH

| ID | Fonte oficial | Natureza | Uso apenas investigado | Classificação |
|---|---|---|---|---|
| **D06** | [NASA Environmental Data Application (EDA)](https://visualization.osdr.nasa.gov/eda/) | Dados ambientais históricos, quando disponíveis | Comparação contextual de ambientes; sem coletor EDA | **FUTURE RESEARCH** |
| **D07** | [NASA Open Science Data Repository (OSDR)](https://science.nasa.gov/biological-physical/data/) | Estudos biológicos, incluindo os datasets não importados identificados no registro de pesquisa | Nenhum dado fisiológico no software; distinguir este escopo do RadLab D01 | **FUTURE RESEARCH** |
| **D08** | [NASA MSL/RAD — CDAWeb](https://cdaweb.gsfc.nasa.gov/cgi-bin/eval2.cgi?dataset=MSL_RAD_OBS-L2&index=sp_phys) | Série histórica do rover Curiosity | Cenário marciano futuro; não dose de pessoa em habitat | **FUTURE RESEARCH** |
| **D09** | [NASA LRO/CRaTER — PDS](https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn:nasa:pds:lro-crater) | Radiação em órbita lunar | Pesquisa, não dose pessoal na superfície | **FUTURE RESEARCH** |

**Atenção ao formato:** a integração atual cobre somente produtos e períodos explicitados em [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md); não representa aprovação para uso clínico ou operacional.

### 1.2. Ligações entre as fontes

- **D01** mede o ambiente de instrumentos específicos; não é um dosímetro pessoal genérico.
- **D02/D03** descrevem clima espacial observado e alertas da NOAA; não medem dose corporal.
- **D04** agrega **previsões** de modelos SEP, que podem ter diferentes horizontes, unidades, energia e locais de aplicação.
- **D05** informa **eventos**, não exposição humana.
- **D06–D09** podem sustentar estudos de cenários e séries **históricas**, sem afirmar monitoramento ao vivo do mesmo local.

## 2. NASA — fundamentação utilizada e pesquisa futura

| ID | Publicação oficial | Conteúdo relevante | Aplicação / classificação |
|---|---|---|---|
| **N01** | [NASA Space Apps 2026 — Health Monitoring Software](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) | Enunciado do desafio | **SCIENTIFIC REFERENCE**, contexto do projeto, não dado clínico. Página identificada no índice oficial; acesso direto falhou nesta revisão |
| **N02** | [HRP — 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) · [Space Radiation Hazard](https://www.nasa.gov/hrp/hazard-space-radiation/) | Riscos ambientais e fontes de radiação como GCR e SPE | Glossário, categorias e limites interpretativos |
| **N03** | [HRP — Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) · [Space Radiation Risks](https://www.nasa.gov/hrp/radiation/space-radiation-risks/) | Riscos humanos investigados; não um cálculo individual pronto | Documentação sobre efeitos possíveis e incertezas |
| **N04** | [HRP — Ongoing Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | Estudos fisiológicos e biomarcadores | **FUTURE RESEARCH**; sem dados importados ou modelo fisiológico |
| **N05** | [NASA Space Radiation Element — About](https://www.nasa.gov/reference/about-the-space-radiation-element/) · [Risk Approach Plans (PDF)](https://www.nasa.gov/wp-content/uploads/2026/08/hrp-rap-for-web-62026-sr.pdf) | Agenda de pesquisa e mitigação | **FUTURE RESEARCH**; preservada como pesquisa histórica de roadmap, não algoritmo adotado |
| **N06** | [NASA Human Research Roadmap — Cancer Evidence Report 2026 (PDF)](https://humanresearchroadmap.nasa.gov/evidence/reports/HRP-ER-CANCER-SR-20260811.pdf) | Evidências de risco de câncer | **FUTURE RESEARCH**; nenhum modelo de câncer implementado nem resultado importado |
| **N07** | [NASA SRAG — Space Radiation Analysis Group](https://srag.jsc.nasa.gov/Index.cfm) · [Como a NASA protege astronautas](https://srag.jsc.nasa.gov/SpaceRadiation/How/How.cfm) | Operação de dosímetros, vigilância, EVA, análise de eventos | Inspiração para fluxos de alerta, sessão EVA e tipos de sensor |
| **N08** | [NASA-STD-3001 — Human Performance, seção 4.8](https://www.nasa.gov/reference/4-0-human-performance/) | Requisitos e grandezas radiológicas para missões e órgãos | Referência para futuras regras **após validação dos critérios** |
| **N09** | [NASA THREE — Health Risks of Extraterrestrial Environments](https://three.jsc.nasa.gov/) · [artigo sobre detectores ativos na ISS (PDF)](https://three.jsc.nasa.gov/articles/CurrentActiveDetectors.pdf) | Enciclopédia, instrumentos, conceitos físicos e radiobiológicos | Definições, unidades, documentação técnica |
| **N10** | [NASA Integrative Risks Models Toolkit](https://www.nasa.gov/hrp/radiation/integrative-risks-models-toolkit/) | HZETRN, ARRBOD e modelos de transporte/efeitos | **FUTURE RESEARCH**; nenhum desses modelos é executado pelo Radiance; acesso pode ser restrito |
| **N11** | [NASA Space Radiation Laboratory — NSRL](https://www.nasa.gov/mission/nasa-space-radiation-lab/) | Pesquisa experimental de laboratório | **FUTURE RESEARCH**; não foram importados resultados laboratoriais |
| **N12** | [NASA Space Radiation Tissue Sharing Forum](https://www.nasa.gov/hrp/radiation/space-radiation-tissue-sharing-forum/) | Recursos para pesquisadores | **FUTURE RESEARCH**; sem amostras ou dados obtidos pelo projeto |

N02, N03, N07, N08 e N09 são **SCIENTIFIC REFERENCE**: sustentam a distinção entre ambiente, dose pessoal, órgãos e risco em `CONTRATOS.md` e nesta documentação. Não há implementação numérica dos limites NASA-STD-3001 nem reprodução de procedimentos operacionais SRAG. O simples uso da sigla SRE não implica que toda publicação da equipe tenha sido aproveitada.

## 3. Referências CSA — dosímetros, nêutrons e EVA

| ID | Publicação oficial | Conteúdo relevante | Aplicação conceitual |
|---|---|---|---|
| **C01** | [CSA — Monitoring radiation for astronaut health (26/02/2026)](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Canadian Active Neutron Spectrometer (**CANS**) | **FUTURE RESEARCH**; sem integração ou API pública confirmada no projeto |
| **C02** | [CSA — MOSFET and Matroshka-R](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp) | Dosimetria MOSFET e investigação de exposição por regiões/tecidos | Pesquisa para zoom de órgãos e calibração apropriada |
| **C03** | [CSA — EVARM](https://www.asc-csa.gc.ca/eng/iss/evarm.asp) | Dosímetros durante caminhadas espaciais (EVA) | Referência para sessão e dose individual, não feed contínuo |
| **C04** | [CSA — Radi-N / Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) | Monitoramento de nêutrons em locais da ISS e com astronautas | Fundamentar possível mapa radiológico por módulo |

C02, C03 e C04 são **SCIENTIFIC REFERENCE**, respectivamente para diferenciar dosimetria por tecido/phantom, dose durante EVA e monitoramento espacial de nêutrons. Os estudos não fornecem dados aos gráficos; nenhuma imagem dessas páginas foi incorporada ao software por esta revisão.

### Recursos excluídos do inventário — NOT USED

N13 (minissérie/equipe SRE), N14 (Cancer Moonshot/contatos HRP) e C05 (justificativa geral de ciência em órbita) constavam do catálogo, mas não têm contribuição específica demonstrada além da própria listagem. Foram retirados das listas de recursos utilizados. Cloudflare Pages, PostgreSQL, hardware e geradores de modelos não identificados também não devem ser declarados como utilizados apenas por terem sido cogitados. Os IDs históricos não foram reutilizados. A narrativa adicionada pela equipe à `main` durante esta auditoria registra uma apresentação Figma e uso de Claude: ambos entram no inventário como ferramentas **declaradas**, não como fontes científicas ou prova de integração ao runtime.

### Evitar interpretações inválidas

1. **Dose absorvida** (`Gy`, `µGy`), **dose equivalente** (`Sv`, `µSv`), suas taxas (por exemplo `µGy/h`, `µSv/h`) e **fluxo integral de prótons** (`pfu`) são grandezas diferentes. Fluxo diferencial também inclui uma unidade de energia no denominador. Não converter somente renomeando unidades.
2. Uma taxa de radiação ambiental não mede diretamente a **dose pessoal**, nem permite preencher órgãos com risco vermelho por si só.
3. O mapa com três cores é hoje um **efeito visual relativo dentro da simulação**, não um sistema validado de limites clínicos. Ver [contratos](CONTRATOS.md).
4. O acumulado equivalente do Radiance exige integrar **taxas equivalentes compatíveis**, com cobertura e lacunas. Uma dose absorvida poderia ser integrada em sua própria grandeza, mas não deve preencher o acumulado em Sv. O RadLab consultado não fornece taxa equivalente nesta amostra.
5. A classificação NOAA S1–S5 refere-se a **eventos solares próximos à Terra**, não ao estado de saúde de um astronauta.
6. O fato de um instrumento, modelo ou artigo ser público **não garante que seus dados estejam disponíveis livremente, em tempo real ou via API**.
7. Dados de saúde reais requerem autorização de acesso, minimização de informações pessoais e política de retenção.

## 4. Procedimento para aprovar uma fonte na implementação

Para uma eventual nova integração após o congelamento, preencher [RASTREABILIDADE-DADOS.md](RASTREABILIDADE-DADOS.md): ID; variável/unidade; local/instrumento; período; latência; API/autorização/cotas; termos; qualidade/incerteza; falhas; contrato/destino; testes e coleta documentada. Somente com esse conjunto de evidências mudar **FUTURE RESEARCH → INTEGRATED**. Esta auditoria não implementa novas fontes.

Na documentação e no software, usar terminologia consistente: `OBSERVED` (medido), `FORECAST` (previsto), `SIMULATED` (fictício). As integrações científicas atuais são explícitas, não telemetria continuamente sincronizada.

## 5. Revisão dos endereços

As páginas e endpoints mantidos foram consultados nesta auditoria. As páginas institucionais SWPC redirecionam para `www.spaceweather.gov`; os links documentais foram atualizados para esse destino oficial, mantendo intactos os endpoints `services.swpc.noaa.gov` usados pelo código. O portal OSDR geral foi substituído por seu destino oficial atual. O espelho `data.nasa.gov` de MSL/RAD não pôde ser confirmado por timeout; foi removido o link redundante e mantido o endereço CDAWeb verificado. A página do desafio foi localizada no índice público oficial, mas o acesso direto retornou erro de certificado/gateway; **não é declarada validada por HTTP**, e deve ser conferida pelo responsável antes da submissão. A página CSA Radi-N2 foi confirmada pela consulta web após falha transitória na conexão direta. Nenhuma falha de conexão foi tratada como prova de remoção de uma fonte.
