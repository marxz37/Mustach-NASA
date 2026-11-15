# Tecnologias, arquitetura e estado de adoção — Mustach

> Revisão: **15/11/2026**. O status abaixo foi conferido **nos arquivos desta cópia do projeto** (`package.json`, `vite.config.ts`, `backend/requirements*.txt`, estrutura dos diretórios e código). **Uma tecnologia discutida na conversa não é automaticamente uma dependência instalada.**

## Visão da solução

```text
Mustach Web — frontend/ (React + TypeScript + Vite, porta 5173)
              \
               +--> FastAPI — backend/ (porta 8000) --> SQLite local (sem medições)
              /
Mustach Wearable — wearable/ (React + TypeScript + Vite, porta 5174)

shared/ --> i18n EN/PT/ES, contratos solares, cálculo temporal e dados de demonstração
```

Ambas as aplicações front-end são independentes e consomem a **mesma API**. A V0.9 compartilha uma ocorrência pré-EVA e sua avaliação determinística, calculada em `backend/app/operational.py`, separada das medições científicas. O Web exibe o fluxo e o painel lateral; o Wearable apresenta apenas um aviso passivo dentro do relógio. Cenário, revisão e consulta ficam no SQLite, com polling de três segundos. O Wearable atual é **uma prévia web**, não uma aplicação instalada em um relógio físico. As séries sintéticas são locais ao navegador, separadas das respostas observadas da API e não gravadas no SQLite.

## 1. Tecnologias encontradas no código

| Área | Tecnologia | Estado comprovado / uso | Arquivo de referência |
|---|---|---|---|
| Front-end Web | React 19 + React DOM | **Declarado e utilizado** | `frontend/package.json`, `frontend/src/App.tsx` |
| Front-end Wearable | React 19 + React DOM | **Declarado e utilizado** | `wearable/package.json`, `wearable/src/App.tsx` |
| Linguagem | TypeScript 5 | **Declarado e utilizado** nos dois front-ends | `*/tsconfig.json`, arquivos `.ts` / `.tsx` |
| Ferramenta de desenvolvimento/build | Vite 7 + `@vitejs/plugin-react` | **Declarado e configurado** em portas 5173 / 5174 | `frontend/vite.config.ts`, `wearable/vite.config.ts` |
| Estilos Web | Tailwind CSS 4 e plugin `@tailwindcss/vite` + CSS | **Declarado** no Web; customizações extensas em CSS | `frontend/package.json`, `frontend/src/index.css` |
| Componentes Web | `components.json`, componentes locais e padrões shadcn/ui | **Estrutura configurada / componentes próprios**; `shadcn/ui` não é dependência runtime única | `frontend/components.json`, `frontend/src/components/ui/` |
| Ícones | Lucide React | **Usado** em ambas as aplicações | `frontend/src/`, `wearable/src/` |
| Gráficos | Apache ECharts 6 + `echarts-for-react` | **Usado** nos gráficos do Mustach Web | `frontend/package.json`, `frontend/src/components/monitoring/` |
| Consultas e cache | TanStack Query 5 + Fetch | **Usado** nos dois front-ends | `frontend/src/context/AppContext.tsx`, `wearable/src/App.tsx`, `*/src/services/api.ts` |
| Navegação Web | React Router 7 | **Usado** na navegação superior | `frontend/src/App.tsx` |
| Estado | React Context / Hooks | **Usado** na seleção de origem, idioma, EVA, amostras | `frontend/src/context/AppContext.tsx` |
| Utilitários de UI | `clsx`, `tailwind-merge`, `class-variance-authority` | **Declarados**; verificar uso efetivo por componente | `frontend/package.json`, `frontend/src/lib/` |
| Back-end | Python 3.10+ + FastAPI (faixa `>=0.115,<1.0`) | **Esqueleto executável e contratos existentes** | `backend/requirements.txt`, `backend/app/main.py` |
| Servidor ASGI | Uvicorn com extras standard (faixa `>=0.34,<1.0`) | **Declarado** | `backend/requirements.txt`, scripts `.bat` |
| Validação | Pydantic 2 (faixa `>=2.10,<3.0`) | **Usado** nos modelos da API | `backend/app/main.py` |
| Banco local | SQLite | **Inicializado**, sem dados científicos carregados | `backend/app/db.py` |
| Testes JS | Vitest 3 | **Declarado** e possui testes unitários | `frontend/src/lib/*.test.ts`, `wearable/src/*.test.ts` |
| Testes de navegação | Playwright | **Declarado**; testes E2E presentes | `frontend/e2e/`, `wearable/e2e/` |
| Testes da API | Pytest + HTTPX | **Declarados** e testes presentes | `backend/requirements-dev.txt`, `backend/tests/` |
| Qualidade JS | ESLint 9 e plugins TypeScript/React Hooks | **Declarado e configurado** | `*/eslint.config.js` |
| Qualidade CI | GitHub Actions | **Workflow existente** | `.github/workflows/checks.yml` |
| Versionamento | Git + GitHub | **Adotado** pelo projeto; commits/push feitos pelo usuário | Repositório do projeto |
| Localização | EN (padrão), PT e ES | **Implementado** para textos de interface | `shared/i18n.ts`, `shared/demoCopy.ts` |

**Versões:** a tabela indica as **versões principais ou intervalos declarados no repositório**, não uma afirmação de que o último release do ecossistema esteja instalado. Para reproduzir a árvore exata use `npm ci` a partir dos arquivos `frontend/package-lock.json` e `wearable/package-lock.json`. Os pacotes Python são especificados em intervalos; para travar versões será necessário gerar lock/snapshot do ambiente.

## 2. Ferramentas planejadas, não implementadas

| Tecnologia/serviço | Destino | Estado |
|---|---|---|
| PostgreSQL | Persistência relacional de séries, tripulantes, fontes, eventos e sessões EVA | **Planejado; não configurado** |
| Figma | Layout, prototipagem, tokens de interface e componentes | **Referência no processo de design; não existe integração automatizada** |
| Cloudflare Pages | Hospedar front-end estático | **Planejado; sem deploy configurado** |
| Serviço Python gerenciado | Hospedar FastAPI de forma separada | **Provedor ainda a definir** |
| Docker / Compose | Padronizar ambientes e serviços | **Opcional / não configurado** |
| Sistema de autenticação/autorização | Dados pessoais de tripulantes e sensores | **Não implementado** |
| Integrações NASA RadLab/NOAA/CCMC/DONKI | Obter medidas e eventos reais | **Não implementadas**; ver [fontes](FONTES-CIENTIFICAS.md) |
| Comunicação com smartwatch físico | Sincronizar dosimetria pessoal | **Não implementada**; heartbeat atual é apenas da prévia web |
| Modelos radiobiológicos/órgãos | Cálculo físico de exposição por tecido | **Pesquisa futura**; nenhum limiar médico validado no código |

## 3. Organização de diretórios

```text
Mustach/
├── frontend/     React Web: visão geral, tripulantes, mapa, gráficos, EVA
├── wearable/     React: prévia de relógio independente, saúde/solar
├── shared/       Tipos e cálculos compartilhados, simulação e idiomas
├── backend/      FastAPI, contratos vazios e SQLite local
├── docs/         Ciência, rastreabilidade, tecnologias e design
├── .github/      CI
├── iniciar-frontend.bat
├── iniciar-wearable.bat
└── iniciar-backend.bat
```

## 4. Executar e testar

Na raiz, abra três terminais Windows e execute `iniciar-backend.bat`, `iniciar-frontend.bat` e `iniciar-wearable.bat` (cada um permanece aberto).

```powershell
# frontend/
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e

# wearable/
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e

# backend/ — com o ambiente .venv já instalado
.\.venv\Scripts\python.exe -m pytest -q
```

- Web: `http://localhost:5173`
- Wearable: `http://localhost:5174`
- FastAPI e OpenAPI: `http://localhost:8000/docs`

## 5. Decisões arquiteturais e cuidados

1. **Separar observação, previsão e simulação** por `provenance`; não usar fonte sintética como fallback silencioso do modo real.
2. **Verificar origem e unidades** em cada medição: fluxo solar não equivale a dose; dose absorvida não é automaticamente equivalente.
3. **Tratar lacunas e latência:** “API online” não significa sensor atualizado; mostrar tempo da última amostra por fonte.
4. **EVA real:** requer dosímetro associado à pessoa e sessão; um cronômetro ou dados da NOAA não resolvem.
5. **Mapa corporal real:** depende de dados e modelos de exposição por órgão validados. Os gradientes atuais são demonstrativos e usam limiares sintéticos.
6. **Segurança futura:** não expor chaves de API no front-end, usar cache/rate limits e validar entradas/redirecionamentos no servidor. Proteger dados de saúde e evitar coleta desnecessária.
7. **Banco:** definir chaves de instrumento, local, missão, pessoa/sessão, grandeza, unidade, fonte e qualidade antes de persistir dados reais; nunca gravar séries sintéticas misturadas ao banco de observações.
8. **Disponibilidade:** offline/reconexão podem ser requisitos futuros para missões; não afirmar suporte offline operacional agora.
