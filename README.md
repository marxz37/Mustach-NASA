# Mustach — NASA Space Apps Challenge 2026

Protótipo de monitoramento da radiação espacial e de apresentação de dados individuais. Não é dispositivo médico.

## Aplicações

| Aplicação | Pasta | Desenvolvimento |
| --- | --- | --- |
| Mustach Web | `frontend/` | <http://localhost:5173> |
| Mustach Wearable | `wearable/` | <http://localhost:5174> |
| API compartilhada | `backend/` | <http://localhost:8000/docs> |

O Wearable é uma aplicação React + TypeScript + Vite independente que simula a tela do relógio no navegador. Não há conexão com smartwatch, Bluetooth ou sensores físicos. Os dois front-ends usam a mesma FastAPI; `shared/solar.ts` concentra o contrato e a formatação da previsão exibida nos dois aplicativos.

O Mustach Web conserva as abas superiores **Visão geral** e **Tripulantes**, sem sidebar. O mapa corporal 2D, os percentuais explicitamente ilustrativos, o modal de órgãos, o painel de radiação, o histórico de dose e a interface dos tripulantes continuam no Web. A aba antiga `Relógio` foi removida.

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

- Sem medições aplicáveis, o mapa corporal é neutro; a prévia colorida e os percentuais são apenas demonstrativos, não representam dose ou risco.
- Um campo vazio não significa condição segura.
- Estimativas por órgão exigem dosimetria individual ou modelos físicos validados.
- Fontes científicas e condições para integração estão documentadas em `docs/FONTES-CIENTIFICAS.md`, não no site.
