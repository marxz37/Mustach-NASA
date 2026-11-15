# Mustach — NASA Space Apps Challenge 2026

Protótipo de monitoramento da radiação espacial e de apresentação de dados individuais. Não é dispositivo médico.

## Aplicações

| Aplicação | Pasta | Desenvolvimento |
| --- | --- | --- |
| Mustach Web | `frontend/` | <http://localhost:5173> |
| Mustach Wearable | `wearable/` | <http://localhost:5174> |
| API compartilhada | `backend/` | <http://localhost:8000/docs> |

O Wearable é uma aplicação React + TypeScript + Vite independente que simula a tela do relógio no navegador. Não há conexão com smartwatch, Bluetooth ou sensores físicos. Os dois front-ends usam a mesma FastAPI; `shared/solar.ts` concentra o contrato e a formatação da previsão exibida nos dois aplicativos. `shared/i18n.ts` contém os textos EN/PT/ES, e `shared/radiation.ts` contém cálculos de integração temporal de taxas compatíveis.

O Mustach Web conserva as abas superiores **Visão geral** e **Tripulantes**, sem sidebar. O mapa corporal 2D **não apresenta porcentagens**; o modal de órgãos, o painel de radiação, o histórico de dose e a interface dos tripulantes continuam no Web. A aba antiga `Relógio` foi removida.

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

## V0.5 — Refinamento visual com dados demonstrativos

- **Idiomas:** inglês (padrão), português e espanhol. Selecione o idioma no cabeçalho do Web ou Wearable. Cada aplicativo guarda a preferência no próprio navegador, sem depender de cookies ou login.
- **Origem dos dados:** o Web inicia em `Simulation / Simulação` para permitir uma demonstração visual completa. `Real data / Dados reais` continua consultando somente a API existente; `No data / Sem dados` mostra a ausência real de dados. Nunca ocorre fallback automático de dados reais para dados sintéticos.
- **Tripulantes fictícios:** quatro perfis ilustrativos com retratos criados para esta demonstração (Maya Bennett, Alex Kim, Elena Reyes e Amir Haddad). A seleção troca a série sintética pessoal, o resumo do perfil e os indicadores exibidos; esses perfis não representam astronautas reais.
- **Séries radiológicas:** o simulador local gera uma **janela sintética de 7 dias com amostras de cinco em cinco minutos** e acrescenta uma amostra sintética a cada 2 segundos. Isso existe exclusivamente para validar o layout e o gráfico, não é telemetria histórica da NASA. Mudanças de origem reinicializam a sessão e evitam misturar dados.
- **Histórico:** `Last 24 hours / Últimas 24 horas` e `Last 7 days / Últimos 7 dias` indicam janelas móveis. Em modo real, apenas medições compatíveis podem ser acumuladas; lacunas permanecem visíveis sem extrapolação. Em simulação, a série sintética cobre o período demonstrativo.
- **Saúde:** removida a duplicação do status no dashboard; o painel inferior mostra indicadores ilustrativos do tripulante selecionado (frequência cardíaca, SpO₂, sono e atividade). Nenhum desses números é uma avaliação médica, nem informa segurança radiológica.
- **EVA:** mantém cronômetro independente, controles de pausa e reset e cálculo sintético de dose da sessão quando possível. Adicionamos um registro de EVA anterior **100% fictício** apenas para preencher a experiência de demonstração.
- **Atividade solar:** no modo simulação, A/B/C são preenchidos com **um único cenário solar fictício** local, com sinalização explícita `SYNTHETIC FIXTURE`. Nenhum prognóstico da NOAA, CCMC ou NASA foi inventado como dado real.
- **Mustach Wearable:** continua aplicativo separado na porta 5174; tem modo demonstrativo e seletor independente dos mesmos quatro perfis fictícios, retrato e as duas telas de Saúde / Atividade Solar. Ainda não existe conexão com smartwatch físico, nem sincronização de um perfil real entre aplicativos.
- **Conexão:** os horários de última consulta à API e última medição são distintos. O Wearable continua enviando batimentos de presença da **prévia web** para a API, e isso não representa um relógio físico pareado.
- **Três idiomas:** inglês (padrão), português e espanhol, inclusive os textos novos dos estados demonstrativos. Cada aplicativo guarda sua preferência no próprio navegador.
- **Mapa de calor:** continua 2D e sem porcentagens. Em modo demonstração, as cores e o modal de órgãos são **apenas ilustrações anatômicas**, não uma estimativa de dose em cada órgão.
- **Telemetria orbital:** não exibida no MVP porque exige vincular localização e momento de medição ao instrumento que gerou o registro.

Os retratos em `frontend/public/crew/` e `wearable/public/crew/` foram gerados artificialmente para perfis fictícios. O módulo `shared/demo.ts` concentra os dados e as séries para o **modo demonstrativo da interface**, e `shared/demoCopy.ts` concentra as respectivas legendas EN/PT/ES. Os componentes não gravam dados simulados no SQLite e não modificam as rotas FastAPI.

A antiga prévia HTML estática foi retirada porque não reproduz as atualizações. Execute os aplicativos pelo Vite nas portas indicadas acima.

## Atividade solar

O Web usa um único painel com **A — Ocorrência**, **B — Intensidade** e **C — Evolução temporal**. A segunda tela do Wearable, acessada por swipe horizontal, teclado ou botões, exibe uma versão compacta das mesmas categorias.

`GET /api/v1/solar/forecast` devolve uma coleção de previsões **separadas por modelo**, preservando provedor, origem, emissão, horizonte, unidades e valores de cada modelo. A estrutura está preparada para futuras integrações com NASA SEP Scoreboard / CCMC, NOAA SWPC e NASA DONKI; nenhuma dessas fontes está conectada nesta versão. A resposta atual é `{"status":"no_forecast","models":[]}`.

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

Execute `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e `npm run test:e2e` em `frontend/` e `wearable/`. No back-end, execute `pytest -q`. O código V0.5 passou na checagem estática de TypeScript e ESLint dos dois front-ends e nos 9 testes existentes da API, mas os testes do Vite/Vitest e a compilação final não puderam ser executados no ambiente Linux de elaboração por falta do binário nativo Rollup; confirme-os no Windows antes de integrar à `main`.
