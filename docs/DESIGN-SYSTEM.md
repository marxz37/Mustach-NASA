# RADIANCE — Identidade e interface

## Direção visual

Interface azul profunda, com linhas finas, tipografia editorial e acentos em azul/ciano. O amarelo aparece na marca e em detalhes discretos, preservando a hierarquia e os estados existentes.

## Marca

- Nome público: **RADIANCE**; assinatura EN: **Context-aware radiation monitoring**. O cabeçalho traduz a assinatura em PT/ES.
- O símbolo de asas e núcleo de luz é vetorial e transparente: `shared/brand/radiance-mark.svg`. É uma interpretação simplificada da referência aprovada, adequada a tamanhos pequenos.
- Web, Wearable e favicons usam o mesmo arquivo. Não usar a prancha de apresentação como imagem do cabeçalho.
- No cabeçalho das páginas, o nome acompanha o símbolo e a imagem é decorativa para leitores de tela. Dentro do relógio, usar somente o símbolo em azul claro monocromático (`#b8deef`), com nome acessível “Radiance”. `shared/brand.ts` deriva uma imagem SVG monocromática do arquivo original, preservando os mesmos caminhos e a transparência, sem máscara CSS. A versão azul/amarela permanece nas páginas.
- Amarelo na logo, sublinhado da navegação ativa e pequenos detalhes de identidade. Não recolorir gráficos, disponibilidade de dados ou alertas para combinar com a marca.
- O símbolo não indica leitura recebida, autorização de EVA ou condição clínica.
- O repositório continua se chamando `Mustach-NASA`. Classes CSS, chaves de preferências `mustach-*`, variáveis `MUSTACH_*` e o cabeçalho `X-Mustach-Ingest-Token` são identificadores legados mantidos para compatibilidade. Não é necessário recriar bancos ou apagar preferências.
- Novas fontes sintéticas usam `RADIANCE`; fontes em evidências já persistidas conservam o nome original por rastreabilidade.

## Tokens principais

- Fundo: `#040d1b`
- Texto: `#ecf8ff`
- Texto secundário: `#8ba8bf`
- Linha divisória: `#1d3955`
- Acento da interface: `#64d9ff`
- Azul do símbolo: `#18adf4`
- Amarelo da marca: `#ffd557`
- Área anatômica sem dados: azul/cinza neutro

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
- As faixas demonstrativas não são critérios clínicos. As cores operacionais descrevem informação disponível, pendente ou a revisar.
- `API local conectada` indica apenas a disponibilidade da FastAPI, não de uma fonte NASA/NOAA.
- Dados observados, previstos e simulados devem manter rótulos e proveniência distintos.
