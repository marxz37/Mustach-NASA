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

## V0.4 — Leituras, EVA e idiomas

- **Idiomas:** inglês (padrão), português e espanhol. Selecione o idioma no cabeçalho do Web ou Wearable. Cada aplicativo guarda a preferência no próprio navegador, sem depender de cookies ou login.
- **Origem dos dados:** `No data / Sem dados` (inicial), `Real data / Dados reais` (consulta `GET /api/v1/measurements`) e `Simulation / Simulação` (gera uma série sintética **no navegador**, iniciada no momento da seleção; não inventa histórico de 24h).
- **Gráfico de taxa de dose:** amostras de **taxa de dose equivalente (µSv/h)**, com histórico móvel de até 24h. Em modo Real, atualiza a API a cada 10s, se existirem registros compatíveis. Sem fonte, permanece vazio. A apresentação ajusta a escala temporal ao trecho disponível.
- **Dose acumulada:** seletor `Daily / Diária` ou `Weekly / Semanal` na visão geral e em Tripulantes. O cálculo integra apenas leituras consecutivas compatíveis e não extrapola lacunas; dados limitados da sessão são indicados como **parciais**, e não como o total de um dia/semana.
- **EVA:** cronômetro `Iniciar`, `Pausar`, `Retomar`, `Finalizar` e `Zerar`, com preservação do estado ao alternar entre as abas do Web. A dose da sessão só pode ser estimada em **Simulação** (a partir da taxa de dose equivalente sintética). No modo Real, sem tripulante e dosímetro pessoal identificados, o cronômetro opera mas a dose aparece `—`.
- **Tripulantes:** mantém 0 registros até receber dados autorizados; possui histórico diário/semanal, gráfico individual sem série fictícia e EVA demonstrativa não vinculada a pessoa real.
- **Conexão:** os horários de última consulta à API e última medição são distintos. O Wearable envia `POST /api/v1/wearable/heartbeat` a cada 30s; `GET /api/v1/wearable/connection` permite ao Web dizer se a **prévia web** está ativa, sem alegar que um relógio físico está pareado. O registro fica somente em memória e é apagado quando o back-end reinicia.
- **Visual:** removidos o texto decorativo anterior e os percentuais por região. O mapa fica neutro quando não há dados de órgão; em Simulação, as cores continuam educativas, sem classificação clínica.
- **Telemetria orbital:** não exibimos altitude/posição no MVP porque isso exigiria vínculo temporal e espacial verificável com cada detector.

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

- Sem medições aplicáveis, o mapa corporal é neutro. Em **Simulação**, as cores são apenas ilustrativas: não existem percentuais de dose, dano ou risco no mapa.
- Um campo vazio não significa condição segura.
- Estimativas por órgão exigem dosimetria individual ou modelos físicos validados.
- Fontes científicas e condições para integração estão documentadas em `docs/FONTES-CIENTIFICAS.md`, não no site.
