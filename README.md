# SENTINELA / Mission Operations

**Protótipo visual V0.1 — NASA Space Apps Challenge 2026**

Interface original criada a partir do esboço do Paint. Esta é uma implementação **sem telemetria**: todos os indicadores mostram `—` e os gráficos estão vazios. O modelo anatômico é apenas um seletor visual de regiões do corpo — as cores **não são um mapa de radiação**.

## Stack

- Front-end: React 19, TypeScript, Vite, Tailwind CSS 4, componentes locais no padrão shadcn/ui, Lucide React, Apache ECharts, TanStack Query, React Router.
- Back-end: Python 3.10+, FastAPI, Pydantic, SQLite (vazio).
- Testes: Vitest e Pytest; Playwright previsto para automação de navegador.
- Banco de dados futuro: PostgreSQL para hospedagem/múltiplos usuários.

## Executar no Windows (VS Code)

**Atalho mais fácil:** abra `iniciar-backend.bat` e `iniciar-frontend.bat` em duas janelas. Na primeira inicialização, ambos instalam as respectivas dependências (internet necessária). Abra então `http://localhost:5173`.

**Prévia sem instalação:** abra `PRÉVIA-SEM-INSTALAR.html` com duplo clique. Essa prévia é autocontida e permite selecionar regiões do corpo e alternar períodos, mas o menu completo e a API estão implementados no projeto React.

Para iniciar manualmente, veja os comandos a seguir.


### Terminal 1 — API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --port 8000
```

Se PowerShell bloquear a ativação do ambiente virtual, use o comando direto:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Front-end

```powershell
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. API interativa: **http://localhost:8000/docs**.

Para somente ver a interface, o front-end também pode funcionar sem o back-end — o indicador no cabeçalho aparecerá como `API NÃO CONECTADA`.

**Observação:** instale Node.js 22.12+ (ou 20.19+) e Python 3.10+ antes dos comandos. As dependências precisam ser instaladas pela primeira vez com acesso à internet.

## Testar

```powershell
cd frontend
npm run build
npm test
```

```powershell
cd backend
python -m pytest
```

## Páginas já disponíveis

- `/`: visão geral, indicadores sem dados, modelo anatômico interativo, cards de radiação e solar, histórico vazio e status não avaliado.
- `/tripulantes`: tela de tripulação vazia.
- `/radiacao`: telemetria vazia e espaço para o RadLab.
- `/clima-espacial`: espaço para NOAA + NASA SEP Scoreboard.
- `/historico`: espaço para dose acumulada e gráficos.
- `/simulador`: tela sem cenários criados.
- `/fontes`: catálogo das fontes científicas planejadas.
- `/documentacao`: princípios e limites científicos.

## Estrutura

```
frontend/src/components/   # componentes de UI, dashboard e visualizações
frontend/src/pages/        # telas navegáveis
frontend/src/services/     # cliente da API local
frontend/src/types/        # contratos de medição
frontend/src/lib/          # funções utilitárias e cálculos
backend/app/main.py        # rotas FastAPI
backend/app/db.py          # SQLite e estrutura futura de medição
backend/tests/             # testes de API
docs/CONTRATOS.md           # convenções de dados e cautelas científicas
```

## Integrações planejadas (AINDA NÃO IMPLEMENTADAS)

1. NASA RadLab (histórico observado)
2. NOAA GOES / SWPC (fluxo de prótons)
3. NASA DONKI (eventos solares)
4. CCMC SEP Scoreboard (previsões)
5. Dosimetria individual apenas com dados autorizados ou simulações explicitamente marcadas.

## Implantação futura

O front-end é estático e pode ser publicado em Cloudflare Pages. O FastAPI precisa de hospedagem Python separada e configuração da variável `VITE_API_BASE_URL` em produção. Ao adotar PostgreSQL, substituir o adaptador SQLite e introduzir migrações.

Não utilizar este protótipo como sistema operacional ou médico de segurança de astronautas.

### Testes end-to-end (Playwright)

```powershell
cd frontend
npx playwright install chromium
npx playwright test
```

