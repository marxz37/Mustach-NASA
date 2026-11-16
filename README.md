# Radiance — NASA Space Apps Challenge 2026

Protótipo de acompanhamento de informações de exposição radiológica individual e ambiental, relacionadas à preparação de uma atividade. Não é dispositivo médico nem mecanismo de autorização de EVA.

**Identidade RADIANCE:** Web e Wearable compartilham a logo vetorial de asas em azul/amarelo, também usada no favicon. A assinatura é *Context-aware radiation monitoring*, com tradução no cabeçalho PT/ES. O nome público foi atualizado; o repositório `Mustach-NASA` e os identificadores de configuração/preferências existentes continuam compatíveis. [Marca e regras visuais](docs/DESIGN-SYSTEM.md).

## Transparência sobre uso de IA

- **OpenAI Codex:** apoio à implementação e revisão de código dos front-ends e back-end, testes automatizados e documentação. Os rodapés do Web e Wearable identificam esse apoio em EN/PT/ES.
- **Imagens:** os retratos dos perfis fictícios foram gerados artificialmente, conforme já registrado neste README. Cada retrato exibido recebe a marca “Imagem gerada por IA · perfil fictício”. O gerador específico não está registrado no projeto; não se atribui uma ferramenta/modelo sem confirmação.
- **Dados científicos:** as observações NASA/NOAA e previsões de modelos conservam fontes e proveniência próprias; não são apresentadas como dados produzidos por IA. A simulação continua identificada como fictícia.
- Os avisos de IA são textuais, sem logotipos, bandeiras ou identificadores de missões da NASA. A identidade Radiance permanece preservada. Essas indicações não substituem o preenchimento das ferramentas efetivamente utilizadas no formulário do desafio.

## Documentação do projeto

Toda a pesquisa científica, rastreabilidade e stack ficam no GitHub, **não em páginas do aplicativo**:

| Documento | Conteúdo |
|---|---|
| [Fontes científicas](docs/FONTES-CIENTIFICAS.md) | Catálogo com links NASA, NOAA, CCMC, CSA, datasets e referências de pesquisa; indica fontes candidatas e restritas |
| [Rastreabilidade dos dados](docs/RASTREABILIDADE-DADOS.md) | Liga fonte → grandeza/unidade → tela → componente/endpoint → condição para integrar |
| [Tecnologias e arquitetura](docs/TECNOLOGIAS.md) | Stack **em uso** vs **planejada**, arquivos e comandos de teste |
| [Contratos e limites científicos](docs/CONTRATOS.md) | Observação, previsão, simulação, dose acumulada, EVA e limitações |
| [Design system](docs/DESIGN-SYSTEM.md) | Regras visuais e tokens da interface |
| [Dados científicos efetivamente utilizados](docs/DADOS-NASA-UTILIZADOS.md) | Endpoints consultados, amostras, unidades, comandos reproduzíveis e limitações |

**V0.7 — ajuste de interface:** a segunda métrica do topo da Visão geral agora é **dose equivalente acumulada nas últimas 24 horas (mSv)**, calculada somente sobre intervalos de medição disponíveis; o gráfico abaixo continua mostrando a **taxa instantânea (µSv/h)**. Isso elimina a repetição do indicador `Current dose rate` sem acrescentar API ou mudar o banco. Mais detalhes em [rastreabilidade](docs/RASTREABILIDADE-DADOS.md).

**Situação real das integrações:** a coleta explícita da FastAPI consulta RadLab, NOAA GOES/SWPC, CCMC REleASE e DONKI SEP e guarda dados no SQLite. Dados demonstrativos continuam separados. Sem coleta prévia, o banco começa vazio. A NASA/NOAA não fornece dose pessoal aos perfis fictícios; o mapa real permanece neutro. Veja [a evidência reproduzível](docs/DADOS-NASA-UTILIZADOS.md).

## V2 refinada — Evidências de exposição individual

- A verificação da Visão geral acompanha `DEMO-EVT-001 / EVA-01`, associada à tripulante fictícia Maya Bennett. O painel lateral mostra as medições efetivamente consideradas, seus vínculos, fonte, instrumento, valor/unidade, horário e qualidade.
- A FastAPI distingue leitura utilizável, ausente, desatualizada, incompatível e com qualidade a revisar. Os booleanos de disponibilidade da resposta são derivados dessas verificações; não determinam a avaliação.
- “Receber leitura simulada”, no painel lateral, entrega uma medição estruturada à **mesma ocorrência**. A disponibilidade individual pode ser resolvida sem trocar o cenário; eventos remotos continuam sinalizados. Não representa integração com sensor.
- O registro de consulta persiste e não resolve lacunas. Nova evidência, mudança de cenário ou expiração relevante invalidam a consulta anterior e atualizam a revisão. Gravações contra uma revisão antiga são rejeitadas.
- O Wearable apresenta estado da leitura pessoal, horário da medição, revisão e próxima verificação da mesma resposta da API. Não calcula uma classificação operacional local nem substitui leitura ausente por uma taxa ambiental sintética. Continua passivo, sem formulários.
- As faixas `Normal / Atenção / Elevado` no computador descrevem somente o sinal ambiental demonstrativo. Informações ambientais, leitura pessoal e evento remoto são dimensões diferentes; nenhum desses rótulos declara saúde, segurança clínica ou aptidão.
- O seletor existente acrescenta exemplos de leitura antiga, de outro tripulante e com qualidade a revisar. São variações do mesmo roteiro, sem páginas ou módulos de simulação novos.
- A janela de atualização padrão é **900 segundos**, configurável por `MUSTACH_DEMO_MAX_READING_AGE_SECONDS` no ambiente da API. É uma regra de engenharia demonstrativa, não limite médico da NASA. A avaliação usa o relógio UTC da API e o horário persistido da medição; reiniciar o serviço não renova artificialmente a leitura.
- As séries dos gráficos e os sinais vitais dos perfis continuam sintéticos e independentes. Frequência, SpO₂ e sono não influenciam a verificação radiológica. Um único ponto pessoal não é apresentado como histórico ou dose acumulada.

O motor EVA continua funcionando na API local sem chamadas externas. Com internet externa indisponível, o histórico já coletado continua consultável na FastAPI; isso **não é suporte offline quando a API local está indisponível**. Hardware continua sem integração.

[Contratos](docs/CONTRATOS.md) · [Decisões, testes executados e limitações](docs/AJUSTES-V2.md).

## Aplicações

| Aplicação | Pasta | Desenvolvimento |
| --- | --- | --- |
| Radiance Web | `frontend/` | <http://localhost:5173> |
| Radiance Wearable | `wearable/` | <http://localhost:5174> |
| API compartilhada | `backend/` | <http://localhost:8000/docs> |

O Wearable é uma aplicação React + TypeScript + Vite independente que simula a tela do relógio no navegador. Não há conexão com smartwatch, Bluetooth ou sensores físicos. Os dois front-ends usam a mesma FastAPI; `shared/solar.ts` concentra o contrato e a formatação da previsão exibida nos dois aplicativos. `shared/i18n.ts` contém os textos EN/PT/ES, e `shared/radiation.ts` contém cálculos de integração temporal de taxas compatíveis.

O Radiance Web conserva as abas superiores **Visão geral** e **Tripulantes**, sem sidebar. O mapa corporal 2D **não apresenta porcentagens**; o modal de órgãos, o painel de radiação, o histórico de dose e a interface dos tripulantes continuam no Web. A aba antiga `Relógio` foi removida.

## Iniciar no Windows

Pré-requisitos: Node.js compatível com Vite, Python 3.10+ e Git. Na raiz do repositório, execute cada arquivo em seu próprio terminal:

```text
iniciar-backend.bat
iniciar-frontend.bat
iniciar-wearable.bat
```

Ou inicie manualmente:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Em um segundo terminal:

```powershell
cd frontend
npm install
npm run dev
```

Em um terceiro terminal:

```powershell
cd wearable
npm install
npm run dev
```

As portas 5173 e 5174 encaminham `/api` para a FastAPI local na porta 8000. Em outro ambiente, defina `VITE_API_BASE_URL` para a URL da API; ela deve autorizar a origem de cada aplicativo.

### Coletar dados oficiais, consultar offline e fazer backup

O Web não tem sino/central de notificações. Avisos SEP ficam exclusivamente no Wearable, separados da informação pré-EVA. Os quatro cenários compartilham o estado da FastAPI, sem gerador independente no relógio. Fontes e critérios demonstrativos estão em [Dados NASA utilizados](docs/DADOS-NASA-UTILIZADOS.md).

A coleta não ocorre automaticamente ao iniciar a API. Na pasta `backend/`, com o ambiente virtual ativo:

```powershell
.\.venv\Scripts\python.exe -m app.collect radlab
.\.venv\Scripts\python.exe -m app.collect goes
.\.venv\Scripts\python.exe -m app.collect noaa-forecast
.\.venv\Scripts\python.exe -m app.collect noaa-alerts
.\.venv\Scripts\python.exe -m app.collect ccmc
.\.venv\Scripts\python.exe -m app.collect donki --start 2024-05-09 --end 2024-05-13
.\.venv\Scripts\python.exe -m app.backup backup ..\work\mustach-backup.sqlite3
```

`app.collect all` tenta todas as fontes de modo independente; falhas são registradas em `ingestion_runs`. Para o DONKI, configure `NASA_API_KEY` no ambiente se a chave pública `DEMO_KEY` atingir sua cota. Nunca grave a chave no Git. Para restauração, **pare a API**, execute `python -m app.backup restore <arquivo> --force`; uma cópia `.pre-restore` é criada antes da substituição. O nome legado `sentinela.sqlite3` e `SENTINELA_DATABASE_PATH` continuam aceitos. Para importações locais, `POST /api/v1/science/measurements` exige `MUSTACH_INGEST_TOKEN` no servidor e cabeçalho `X-Radiance-Ingest-Token`; sem token configurado, a escrita fica desativada.

### Como testar os refinamentos

**Ajustes visuais dos gráficos e relógio:** a taxa simulada abre nos últimos 15 minutos, dentro do histórico de 24h. Scroll/pinça aproxima e arraste navega; a barra inferior também ajusta a janela. `Live view / Vista ao vivo` retoma o acompanhamento. O histórico acumulado tem o mesmo zoom. O zoom manual não é desfeito pelo polling. A grade simulada é ancorada à execução; o ECharts usa amostragem visual LTTB, sem reduzir os dados usados para calcular dose.

A legenda colorida de faixas do acumulado foi removida. O histórico mantém valores, unidade, cobertura e zoom, sem classificação baixa/intermediária/elevada. A identificação geral de Simulação continua visível.

No Wearable em Simulação, a primeira tela mostra taxa **ambiental fictícia**, cenário, velocidade, revisão e horário com segundos do estado compartilhado. A evidência pessoal pré-EVA continua em uma linha secundária separada: sua ausência não congela a simulação nem é preenchida pela taxa ambiental. A revisão pré-EVA e suas ações ficam no Web; o banner permanente de revisão foi retirado do relógio porque o roteiro persistido não representa uma sessão EVA ativa no Wearable. O resumo solar e os avisos SEP permanecem. `frontend/e2e/chart-live.spec.ts` verifica 1×/10×/60× com as duas aplicações e API reais.

1. **Offline externo:** colete as fontes, mantenha FastAPI e front-ends ligados, desconecte apenas a internet externa e selecione Dados reais. No histórico instrumental consulte 01/04/2022 23:00–23:20 UTC. Recarregar continua consultando SQLite, sem renovar datas antigas. Previsões expiradas ficam no arquivo. Uma tentativa de coleta externa falha e é registrada em `/api/v1/science/ingestion-runs`, sem apagar dados. Testes automatizados bloqueiam a chamada externa de modo controlado, sem desligar a rede da máquina.
2. **API local desligada:** pare somente FastAPI. As telas devem indicar falha de comunicação; a simulação não continua gerando dados e gravações pré-EVA ficam indisponíveis. Isso difere de ficar sem internet externa.
3. **Quatro cenários:** abra Web (5173) e Wearable (5174) em Simulação. No controle do Web, escolha Normal, Previsto, Em andamento e Recuperação. Inicie/retome, use 10×/60×, pause e reinicie. Compare cenário, relógio e A/B/C; observe gráficos, acumulado e mapa fictício. EVA ativa acompanha tempo demonstrativo; reiniciar cenário ou trocar origem limpa sua sessão. O seletor pré-EVA continua independente.
4. **Avisos/háptica:** ative Vibração experimental no Wearable **antes** de selecionar Previsto/Em andamento no Web. Um aviso SIMULADO traz origem e horário; polling não repete vibração. Reconhecer/silenciar persiste nesse navegador. Em Dados reais só aparecem avisos elegíveis; não é garantido haver algum agora. Sem suporte/permissão, o aviso visual continua. Não há pareamento físico.
   Em Normal e Recuperação não há aviso SEP simulado. Previsões simuladas expiradas, sem validade ou com emissão futura também não notificam; a validação usa o relógio demonstrativo compartilhado. Em Dados reais, permanecem os filtros do back-end (NOAA >=50% e critérios documentados por canal CCMC), sem confundir previsão com perigo confirmado nem usar taxa ambiental como dose pessoal.
5. **Sincronização real:** testes comuns usam fixtures HTTP isoladas; `MUSTACH_LIVE_API=1` habilita testes contra FastAPI real. Para `frontend/e2e/simulation-live.spec.ts`, mantenha também Wearable em 5174. O teste altera apenas o roteiro demonstrativo.

## V0.5 — Refinamento visual com dados demonstrativos

- **Idiomas:** inglês (padrão), português e espanhol. Selecione o idioma no cabeçalho do Web ou Wearable. Cada aplicativo guarda a preferência no próprio navegador, sem depender de cookies ou login.
- **Origem dos dados:** o Web inicia em `Simulation / Simulação` para permitir uma demonstração visual completa. `Real data / Dados reais` continua consultando somente a API existente; `No data / Sem dados` mostra a ausência real de dados. Nunca ocorre fallback automático de dados reais para dados sintéticos.
- **Tripulantes fictícios:** quatro perfis ilustrativos com retratos criados para esta demonstração (Maya Bennett, Alex Kim, Elena Reyes e Amir Haddad). A seleção troca a série sintética pessoal, o resumo do perfil e os indicadores exibidos; esses perfis não representam astronautas reais.
- **Séries radiológicas:** a FastAPI mantém relógio e roteiro em `simulation_state`, separados das tabelas científicas. A janela fictícia de 7 dias tem base de cinco minutos, detalhe de 30 segundos no dia em execução e 2 segundos nos últimos 10 minutos. Web/Wearable não mantêm geradores independentes. Mudanças de origem reinicializam a sessão EVA, sem misturar dados.
- **Histórico:** `Last 24 hours / Últimas 24 horas` e `Last 7 days / Últimos 7 dias` indicam janelas móveis. Em modo real, apenas medições compatíveis podem ser acumuladas; lacunas permanecem visíveis sem extrapolação. Em simulação, a série sintética cobre o período demonstrativo.
- **Saúde (histórico V0.5):** havia um painel de indicadores ilustrativos no dashboard, mas **na versão atual os dados específicos dos tripulantes ficam exclusivamente na aba Tripulantes**. Não são avaliação médica nem indicador validado de segurança radiológica.
- **EVA:** mantém cronômetro independente, controles de pausa e reset e cálculo sintético de dose da sessão quando possível. Adicionamos um registro de EVA anterior **100% fictício** apenas para preencher a experiência de demonstração.
- **Atividade solar:** em Simulação A/B/C vêm do cenário fictício compartilhado da FastAPI, identificado como `SYNTHETIC FIXTURE`. Nenhum prognóstico da NOAA, CCMC ou NASA foi inventado como dado real.
- **Radiance Wearable (histórico V0.5):** a primeira versão da prévia mostrava perfis fictícios. Na V0.6, o relógio passou a mostrar uma faixa sintética ambiental. Na V2 refinada, a primeira tela acompanha a leitura pessoal associada à atividade e a avaliação compartilhada; a segunda resume o clima solar. Não existe conexão com smartwatch físico.
- **Conexão:** os horários de última consulta à API e última medição são distintos. O Wearable continua enviando batimentos de presença da **prévia web** para a API, e isso não representa um relógio físico pareado.
- **Três idiomas:** inglês (padrão), português e espanhol, inclusive os textos novos dos estados demonstrativos. Cada aplicativo guarda sua preferência no próprio navegador.
- **Mapa de calor:** continua 2D e sem porcentagens. Na V0.6, o gradiente passou a reagir às taxas sintéticas em **faixas fictícias**; isso não é uma estimativa de dose em órgãos nem um limiar de saúde.
- **Telemetria orbital:** não exibida no MVP porque exige vincular localização e momento de medição ao instrumento que gerou o registro.

Os retratos em `frontend/public/crew/` e `wearable/public/crew/` foram gerados artificialmente para perfis fictícios. O módulo `shared/demo.ts` concentra os dados e as séries para o **modo demonstrativo da interface**, e `shared/demoCopy.ts` concentra as respectivas legendas EN/PT/ES. As séries sintéticas dos gráficos não são gravadas no SQLite. A ocorrência persiste suas evidências demonstrativas estruturadas em campo separado; a tabela de medições observadas não recebe esses exemplos.

A antiga prévia HTML estática foi retirada porque não reproduz as atualizações. Execute os aplicativos pelo Vite nas portas indicadas acima.

## Atividade solar

O Web usa um único painel com **A — Ocorrência**, **B — Intensidade** e **C — Evolução temporal**. A segunda tela do Wearable, acessada por swipe horizontal, teclado ou botões, exibe uma versão compacta das mesmas categorias.

`GET /api/v1/solar/forecast` devolve somente previsões ainda válidas, **separadas por modelo, dia e canal energético**. A NOAA fornece probabilidade S1+ para três dias; REleASE fornece fluxo diferencial por canal, sem probabilidade. Campos ausentes permanecem vazios. Previsões expiradas continuam em `/api/v1/solar/forecast/history`, sem serem apresentadas como atuais. O DONKI fornece contexto de eventos históricos em `/api/v1/solar-events`, não dose. O Wearable usa a mesma API e mantém a navegação por swipe/botões.

Os dados observados, as previsões e as simulações devem permanecer distintos. Probabilidade de evento de partículas solares não é probabilidade de dano à saúde; fluxo de prótons não é dose individual. Modelos com horizontes ou unidades incompatíveis não devem ser combinados.

## Testes

```powershell
cd frontend
npm run typecheck
npm run build
npm run lint
npm test
npm run test:e2e
```

```powershell
cd wearable
npm run typecheck
npm run build
npm run lint
npm test
npm run test:e2e
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

## Limites científicos do protótipo

- Fora do modo de simulação, sem medições aplicáveis, o mapa corporal é neutro. Em **Simulação**, as cores são apenas ilustrativas: não existem percentuais de dose, dano ou risco no mapa.
- Um campo vazio não significa condição segura.
- Estimativas por órgão exigem dosimetria individual ou modelos físicos validados.
- Fontes científicas e condições para integração estão documentadas em `docs/FONTES-CIENTIFICAS.md`, não no site.

## Verificação no Windows antes do commit

Execute `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e `npm run test:e2e` em `frontend/` e `wearable/`. No back-end, execute `pytest -q`. Para os testes E2E adicionais que **não interceptam a API**, inicie FastAPI, colete as fontes e defina `MUSTACH_LIVE_API=1` antes de `npm run test:e2e`; a CI sem serviços externos os ignora. Nesta fase, a API real foi consultada via os proxies 5173/5174 e os dois E2E HTTP reais passaram; os testes existentes de EVA continuam. [AJUSTES-V2.md](docs/AJUSTES-V2.md) descreve a validação histórica da fase anterior.


## V0.6 — Refinamento de interface (sem novas integrações)

- A prioridade da visão geral é **atividade solar**, **taxa de dose equivalente atual** e **faixa demonstrativa de exposição**. Histórico, mapa corporal e EVA permanecem abaixo.
- A série de demonstração é atualizada no navegador a cada **2 segundos**. O gráfico mostra o horário da amostra mais recente; nenhum sensor real foi conectado nesta etapa.
- O mapa de calor 2D acompanha as variações **exclusivamente da simulação**. Em `shared/demoBands.ts`, os índices sintéticos usam faixas (`< 0,45`, `< 0,58`, `>= 0,58`) e fatores fictícios por região. Esses limites NÃO são limites de dose, riscos clínicos, condições seguras ou dose recebida por órgãos.
- Ao selecionar **Dados reais** ou **Sem dados**, as regiões corporais ficam neutras enquanto não existir dosimetria específica e critérios radiológicos validados. Nunca inferir uma dose de órgão a partir de taxa ambiental do RadLab ou fluxo NOAA.
- Na V0.6, o Wearable mostrava coração e faixa ambiental sintética. A V2 refinada substitui esse resumo por estado da leitura pessoal e revisão da mesma ocorrência do painel de bordo. A segunda tela mantém a previsão solar independente; ambas podem exibir a próxima verificação compartilhada. Não há dispositivo físico pareado.
- A seleção global de origem continua identificando os valores fictícios, sem repetir diversos avisos em cada painel. Documentar explicitamente o caráter não clínico da classificação de demonstração.
- Naquela etapa ainda estavam previstos: critérios radiológicos científicos por grandeza/unidade, calibração dos sensores, dados pessoais autorizados, tratamento de amostras defasadas, proveniência e integração de APIs/banco de dados. A fase atual integra apenas os subconjuntos externos descritos acima; os demais itens seguem pendentes.
