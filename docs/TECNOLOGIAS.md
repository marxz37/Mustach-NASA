# Tecnologias, arquitetura e estado de adoção — Radiance

> Revisão: **15/11/2026**. O status abaixo foi conferido **nos arquivos desta cópia do projeto** (`package.json`, `vite.config.ts`, `backend/requirements*.txt`, estrutura dos diretórios e código). **Uma tecnologia discutida na conversa não é automaticamente uma dependência instalada.**

## Visão da solução

```text
Radiance Web — frontend/ (React + TypeScript + Vite, porta 5173)
              \
               +--> FastAPI — backend/ (porta 8000) --> SQLite local (observações, previsões e demo separados)
              /
Radiance Wearable — wearable/ (React + TypeScript + Vite, porta 5174)

shared/ --> i18n EN/PT/ES, contratos solares, cálculo temporal e dados de demonstração
```

Ambas as aplicações front-end são independentes e consomem a **mesma API**. `backend/app/science.py` valida respostas externas, `backend/app/collect.py` executa coleta explícita e `backend/app/db.py` armazena observações, previsões, avisos, eventos e falhas em tabelas separadas. O motor pré-EVA em `backend/app/operational.py` não usa essas séries ambientais como dose pessoal. O Wearable continua uma **prévia web**, não uma aplicação em relógio físico. Séries sintéticas ficam no navegador e não são gravadas como observações.

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
| Gráficos | Apache ECharts 6 + `echarts-for-react` | **Usado** nos gráficos do Radiance Web | `frontend/package.json`, `frontend/src/components/monitoring/` |
| Consultas e cache | TanStack Query 5 + Fetch | **Usado** nos dois front-ends | `frontend/src/context/AppContext.tsx`, `wearable/src/App.tsx`, `*/src/services/api.ts` |
| Navegação Web | React Router 7 | **Usado** na navegação superior | `frontend/src/App.tsx` |
| Estado | React Context / Hooks | **Usado** na seleção de origem, idioma, EVA, amostras | `frontend/src/context/AppContext.tsx` |
| Utilitários de UI | `clsx`, `tailwind-merge`, `class-variance-authority` | **Declarados**; verificar uso efetivo por componente | `frontend/package.json`, `frontend/src/lib/` |
| Back-end | Python 3.10+ + FastAPI (faixa `>=0.115,<1.0`) | **API local, contratos e verificação de evidências** | `backend/requirements.txt`, `backend/app/main.py` |
| Servidor ASGI | Uvicorn com extras standard (faixa `>=0.34,<1.0`) | **Declarado** | `backend/requirements.txt`, scripts `.bat` |
| Validação | Pydantic 2 (faixa `>=2.10,<3.0`) | **Usado** nos modelos da API | `backend/app/main.py` |
| Banco local | SQLite | **Persistência científica ativa**, migrações aditivas e backup/restauração | `backend/app/db.py`, `backend/app/backup.py` |
| Coletores oficiais | Python `urllib` e JSON | **RadLab, NOAA GOES/probabilidades/alertas, CCMC REleASE, DONKI SEP**; execução manual | `backend/app/science.py`, `backend/app/collect.py` |
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
| Mais instrumentos e modelos NASA/NOAA/CCMC | Ampliar cobertura de produtos científicos | **Pesquisa futura**; os subconjuntos implementados constam em [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md) |
| Comunicação com smartwatch físico | Sincronizar dosimetria pessoal | **Não implementada**; heartbeat atual é apenas da prévia web |
| Modelos radiobiológicos/órgãos | Cálculo físico de exposição por tecido | **Pesquisa futura**; nenhum limiar médico validado no código |

## 3. Organização de diretórios

```text
Radiance/
├── frontend/     React Web: visão geral, tripulantes, mapa, gráficos, EVA
├── wearable/     React: prévia de relógio independente, saúde/solar
├── shared/       Tipos e cálculos compartilhados, simulação e idiomas
├── backend/      FastAPI, coletores científicos, persistência SQLite e demo EVA
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
7. **Banco:** IDs determinísticos evitam duplicação; `measurements` guarda metadados originais e instante de coleta, enquanto previsões e demo têm tabelas próprias. O nome legado `sentinela.sqlite3` é mantido.
8. **Disponibilidade:** dados previamente coletados seguem acessíveis sem internet externa, desde que a API local funcione. Não existe sincronização automática nem cache confiável se a API local cair.

## Refinamentos das integrações

- `backend/app/simulation.py`: relógio e curvas fictícias compartilhados, com SQLite, revisão otimista e controles. Sem dependência/framework novo.
- `shared/simulation.ts`: contratos e traduções EN/PT/ES; não é um gerador de previsão independente.
- `frontend/src/components/monitoring/SimulationControls.tsx`: controles compactos na interface atual; central/sino removidos.
- `backend/app/solar_notices.py`: filtro SEP e limiares demonstrativos no servidor. `wearable/src/SolarNotice.tsx` e `notices.ts`: apresentação, reconhecimento e deduplicação local, com vibração experimental detectada e opcional.
- Migração aditiva: `scientific_alerts.original_message`, `valid_until`, `product_id`; nova tabela `simulation_state` separada de dados científicos. Backup/restauração incluem ambas e mantêm o banco legado.
- Testes: Pytest de cenário/relógio/cancelamento/unidade/persistência; Vitest de deduplicação/validade; Playwright de aviso, vibração, três idiomas/320px, modos e sincronização HTTP real opt-in. Nenhum pacote foi instalado para esses ajustes.

Validação local em 15/11/2026: **79 Pytest, 20 Vitest Web, 7 Vitest Wearable, 23 Playwright Web, 17 Playwright Wearable e 3 E2E HTTP reais** aprovados. Os três testes live são ignorados nas suítes comuns e executados separadamente com `MUSTACH_LIVE_API=1`; não dependem de interceptações para provar comunicação. Typecheck, lint e builds aprovados. Avisos não bloqueantes: depreciação Starlette/httpx e bundle Web acima de 500 kB. Comparação por hash dos 22 registros RadLab antes/depois de encerrar e reiniciar uvicorn confirmou igualdade; SQLite retornou `integrity_check=ok`. As falhas de internet foram controladas nos testes, sem desligar a rede da máquina. Vibração foi validada por chamada simulada e fallback visual, **não por hardware físico**.
