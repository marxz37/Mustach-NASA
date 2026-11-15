# Fontes científicas — Mustach

A documentação científica permanece no GitHub, não na interface do aplicativo.

## Fontes prioritárias para integração

| Fonte | Papel futuro | Endereço |
|---|---|---|
| NASA RadLab | Dados históricos de dosimetria e instrumentos espaciais | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ |
| NOAA SWPC / GOES | Séries de fluxo de prótons energéticos e alertas solares | https://www.swpc.noaa.gov/products/goes-proton-flux |
| NASA DONKI | Eventos SEP, erupções solares e ejeções de massa coronal | https://api.nasa.gov/ |
| NASA CCMC SEP Scoreboard | Previsões de ocorrência, intensidade e evolução temporal de eventos SEP | https://ccmc.gsfc.nasa.gov/scoreboards/sep/ |
| NASA OSDR / EDA | Dados ambientais históricos e séries de missões | https://visualization.osdr.nasa.gov/eda/ |
| MSL/RAD | Medições históricas do ambiente radiológico de Marte | https://cdaweb.gsfc.nasa.gov/cgi-bin/eval2.cgi?dataset=MSL_RAD_OBS-L2&index=sp_phys |
| LRO / CRaTER | Medições do ambiente radiológico próximo da Lua | https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn:nasa:pds:lro-crater |

## Referências de fundamentação

- NASA HRP hazards: https://www.nasa.gov/hrp/hazards/
- NASA HRP risks: https://www.nasa.gov/hrp/risks/
- NASA HRP Space Radiation Element: https://www.nasa.gov/reference/about-the-space-radiation-element/
- NASA SRAG: https://srag.jsc.nasa.gov/Index.cfm
- CSA MOSFET: https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp
- CSA EVARM: https://www.asc-csa.gc.ca/eng/iss/evarm.asp
- CSA Radi-N2: https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp
- NASA THREE: https://three.jsc.nasa.gov/

## Exigências para implementar o mapa corporal

As fontes disponíveis não representam, por padrão, doses recebidas em órgãos específicos. O mapa atual usa uma silhueta neutra por padrão e não classifica risco. A prévia colorida opcional é somente ilustrativa, sem valor de dose ou significado médico. O motor real deverá distinguir: (1) dosímetro pessoal; (2) monitor ambiental; (3) estimativa física validada; (4) simulação. Sem base apropriada, não gerar cores de risco nem diagnósticos por órgão.

Toda fonte de dados adicionada deverá registrar instrumentação, localização, unidade, intervalo temporal, atualização, qualidade e origem observada/prevista/simulada.
