# Sentinela — Design System v0.1

## Origem

Design original inspirado na organização do desenho do Paint recebido do grupo e na estética de painéis de missão: escuro, azul profundo, linhas finas e realces ciano. Não reproduz a interface de terceiros.

## Cores

- Fundo principal: `#040b17`
- Fundo lateral: `#061629`
- Cartões: `#071526`
- Bordas: `rgba(92, 149, 189, 0.16)`
- Texto de destaque: `#e9f6ff`
- Texto secundário: `#7896ad`
- Ciano de interação: `#31d8e8`
- Verde-menta (sinalização positiva FUTURA): `#42e5b8`
- Âmbar (eventos, não automaticamente perigo): `#e4bd6c`

## Tipografia

- Interface: **DM Sans** (400, 500, 600, 700, 800)
- Identificação científica, metadados e unidades: **JetBrains Mono**

## Componentes

- Sidebar fixa com dois grupos, responsiva para telas pequenas.
- Topbar com status da API local (não indica conexão NASA).
- Cards de indicadores (nenhuma métrica preenchida sem medição).
- Modelo anatômico clicável SVG (cor de seleção, **não calor radiológico**).
- Telemetria ambiental e individual separadas.
- Card de atividade solar com estado indisponível.
- Gráfico ECharts vazio; períodos 24h/7 dias/30 dias.
- Painel corporal sem avaliar saúde até existir fonte.

## Estados

- `—` = sem dado; não significa zero.
- `API LOCAL ONLINE` = apenas FastAPI acessível.
- `API NÃO CONECTADA` = FastAPI indisponível.
- `OBSERVED`, `FORECAST`, `SIMULATED` são origens diferentes e nunca devem ser fundidas.

## Figma

O projeto inclui tokens e componentes de referência para replicação no Figma, mas **nenhum arquivo .fig foi criado** nesta etapa. A fonte de verdade atual é o projeto React.
