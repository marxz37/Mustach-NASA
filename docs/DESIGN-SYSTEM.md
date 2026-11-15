# Mustach — Design System v0.2

## Direção visual

Interface escura e minimalista, com superfícies quase pretas, linhas finas, tipografia editorial e acentos em bronze. As referências visuais orientam a experiência de navegação e ampliação, sem reprodução literal.

## Tokens principais

- Fundo: `#0b0d10`
- Texto: `#ebe8e4`
- Texto secundário: `#aaa6a1`
- Linha divisória: `#303037`
- Acento: `#caa880`
- Área anatômica sem dados: tons de cinza

## Hierarquia

- Cabeçalho horizontal com abas `Visão geral` e `Tripulantes`; sem sidebar ou breadcrumb.
- Indicadores textuais em uma faixa superior, sem cards coloridos.
- Corpo 2D interativo como elemento central da visão geral, com alternância entre `Corpo` e `Órgãos`.
- Um único painel `Atividade solar` combina condição atual e previsão SEP; radiação e histórico ficam em painéis separados.
- Tripulantes usa ficha horizontal com avatar, dados individuais e minigráfico em estado vazio.
- Clique em um marcador abre painel lateral temporário com fundo desfocado, conexão visual ao ponto selecionado, ampliação circular do órgão e campos de exposição.
- `Saúde do indivíduo` apresenta apenas um coração e o estado individual disponível; sem avaliação, mantém ícone e texto neutros.

## Estados de dados

- `—` significa dado ausente, nunca zero ou condição segura.
- O corpo permanece neutro quando não há dosimetria regional aplicável.
- A `Prévia simulada` pode mostrar um gradiente verde/amarelo/vermelho para demonstrar o mapa de calor, sempre rotulado como visualização ilustrativa sem valores de dose.
- Nenhuma cor verde/amarela/vermelha é usada como classificação de risco antes da definição científica dos limites.
- `API LOCAL ONLINE` indica apenas a disponibilidade da FastAPI, não de uma fonte NASA/NOAA.
- Dados observados, previstos e simulados devem manter rótulos e proveniência distintos.
