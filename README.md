# Mustach — NASA Space Apps Challenge 2026

Protótipo de monitoramento de radiação espacial e acompanhamento de saúde dos astronautas.

**Versão:** 0.2 — reconstrução visual baseada no desenho de interface da equipe.

## Estado atual

- Front-end React 19 + TypeScript + Vite + Tailwind CSS + ícones Lucide.
- Componentes estruturados para integração com TanStack Query e Apache ECharts.
- Back-end FastAPI + SQLite, sem medições cadastradas.
- Navegação superior com apenas **Visão geral** e **Tripulantes** (sem sidebar).
- Mapa anatômico **2D** com vistas `Corpo` e `Órgãos`, marcadores selecionáveis e painel de ampliação.
- O mapa corporal permanece **neutro enquanto não houver medições aplicáveis**. A opção `Prévia simulada` mostra apenas um gradiente ilustrativo, sem dosimetria ou classificação de risco; a futura escala operacional depende de limites cientificamente fundamentados.
- O painel `Saúde do indivíduo` usa um coração e reserva os estados normal, alerta e perigo para avaliações individuais autorizadas. Sem avaliação, permanece neutro.
- Clicar em um dos marcadores abre um painel de detalhes. As taxas, doses e avaliações continuam vazias.
- Nenhuma página de fontes científicas no website; a documentação das fontes fica exclusivamente neste repositório, em `docs/FONTES-CIENTIFICAS.md`.

## Iniciar no Windows

### Pré-requisitos

- Node.js 20.19+ ou versão 22+ compatível com Vite.
- Python 3.10+.
- Git.

Na raiz do projeto, execute os atalhos `iniciar-backend.bat` e `iniciar-frontend.bat` separadamente, ou:

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Acesse <http://localhost:5173> (front-end) e <http://localhost:8000/docs> (FastAPI).

### Validação

```powershell
cd frontend
npm run lint
npm test
npm run build
npm run test:e2e
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

O build, o lint e os testes Vitest, Pytest e Playwright foram executados neste ambiente durante a validação da interface.

## Conceitos de segurança científica

- Medições **observadas**, **previstas** e **simuladas** devem sempre ter proveniência e metadados distintos.
- O fluxo de prótons não equivale à dose absorvida pelo corpo.
- A taxa de dose absorvida em µGy/h não se converte diretamente em dose equivalente em µSv/h sem o modelo adequado.
- Um campo vazio jamais deve aparecer como estado seguro.
- A silhueta neutra não significa baixa exposição; nenhum limite clínico ou operacional é exibido sem fundamentação.
- Estimativas por órgão exigem dosimetria individual ou modelos físicos validados.

## Próximas etapas

1. Ajustar a interface com feedback visual da equipe.
2. Integrar dados de radiação NASA RadLab e clima espacial NOAA mantendo a indicação de data, origem, instrumento e unidade.
3. Definir regras de visualização fundamentadas para a futura escala do mapa de calor.
4. Implementar histórico e dose acumulada somente para séries dosimétricas compatíveis.
5. Incluir novos testes automatizados para dados reais e casos de ausência de telemetria.
