# Contratos científicos — Mustach

## Estado inicial

- O MVP visual inicia com zero medições, zero tripulantes e zero eventos solares.
- Não existem fluxos ao vivo, alertas clínicos ou predições habilitadas.
- O mapa corporal 2D permanece neutro na ausência de medições; não representa estimativas de dose por órgão ou uma avaliação médica.

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
3. Quando a origem não puder fornecer uma medição, a interface exibirá ausência de dados.
4. Dose absorvida (Gy) e equivalente (Sv) não são intercambiáveis.
5. Uma integração temporal de taxa de dose só pode ocorrer com série dosimétrica homogênea e interpretação correta das lacunas.
6. Para a visualização de exposição por órgão, nenhum valor numérico ou cor de risco é exibido sem dados e limites validados.
7. Alertas de saúde NÃO são diagnósticos médicos.

## Referências

- https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- https://www.swpc.noaa.gov/products/goes-proton-flux
- https://api.nasa.gov/
- https://ccmc.gsfc.nasa.gov/scoreboards/sep/
- https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp
