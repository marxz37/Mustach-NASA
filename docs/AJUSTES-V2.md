# Mustach — Ajustes V2 e verificação

Referência principal: `Mustach_V2_Critica_Tecnica_Linguagem_Interpretacao.md`, revisão de 15/11/2026. As diretrizes desta implementação prevalecem onde permitem manter classificações intuitivas e centralizar a identificação da simulação.

## Confronto com a implementação

A cópia de trabalho já continha alterações locais em andamento, preservadas e completadas nesta entrega. A inspeção considerou tanto esses arquivos quanto a base Git `f5da94f`.

| Crítica | Conferência no código | Resultado |
| --- | --- | --- |
| Faixas fictícias parecem avaliação de saúde | `demonstrationBand` realmente usa cortes de demonstração | Mantido `Normal`; descrição no topo explicita as faixas fictícias. Categoria superior passa a `Elevado` e título a faixa do cenário. Sem classificação automática em dados reais |
| Gráfico sintético usa “Ao vivo” | Presente na base; correção parcial já iniciada localmente | Simulação ativa; leitura recente depende do horário. Registro antigo expõe horário desatualizado e não recebe indicador pulsante |
| API online sugere telemetria | Endpoint consulta somente a FastAPI local | API local conectada/indisponível, separada da presença da prévia e da ausência de dispositivo físico |
| Medição e sincronização confundem horários | Amostras sintéticas são geradas no navegador; presença vem de heartbeat | Última amostra simulada, consulta à API e contato da prévia com API local possuem rótulos distintos |
| Falta percurso de interpretação e registro | Ausente na base; fluxo já parcialmente criado localmente | Um cenário pré-EVA com fato, fonte, horário de referência, leitura individual ausente/disponível, próxima verificação e conferência persistida |
| Web e Wearable têm estado independente | Séries sintéticas continuam locais, como previsto | Somente ocorrência/conferência compartilham ID, revisão e SQLite via API; consultas a cada três segundos |
| Total de 24 h pode parecer dose pessoal completa | Integração original é compatível, mas título não expõe cobertura | Ambiente e horas cobertas próximos ao total; histórico pessoal/ambiental separado e janela parcial indicada |
| Gráfico acumulado pode divergir do total | Recorte anterior removia amostra que atravessa a borda; linha ligava lacunas | Recorte e integração coerentes com o total; linha interrompida onde não há intervalo válido |
| Retenção por contagem perde sete dias | Base descartava pontos antigos a cada atualização | Grade histórica preservada, detalhes recentes limitados e amostras da sessão EVA retidas |
| Termos de previsão, mapa e EVA | “Pico”, “Mapa de exposição” e “Preparado” eram ambíguos | Pico estimado, mapa corporal ilustrativo e cronômetro pronto; modelo junto à probabilidade resumida |

## V0.9 — Fluxo visual no painel de bordo

A referência visual foi aplicada preservando o design: dois cartões com contexto e fluxo de preparação, estados com ícone e rótulo, contagem de informações disponíveis e uma ação principal. O rótulo “Apto” da referência não foi reproduzido. Disponibilidade dos dados e registro de consulta possuem indicadores distintos.

1. Abrir a Visão geral do Web, em Simulação, com a API local iniciada.
2. Observar os estados automáticos de contexto, informações radiológicas e leitura individual. No cenário padrão há duas informações disponíveis, um evento para revisão e uma leitura individual ausente.
3. Abrir o roteiro da equipe. O painel lateral destaca a próxima verificação, mostra fonte, horário, limites e evidências do cenário. As três etapas também abrem diretamente seus detalhes.
4. Registrar a consulta com um único botão. Isso não preenche lacunas, encerra evento sinalizado nem inicia o cronômetro. O painel lateral fecha com Escape, botão ou clique no fundo e devolve o foco.
5. Em “Cenário demonstrativo”, escolher uma das cinco variações. Os estados e a próxima verificação vêm da FastAPI; a mudança invalida a consulta anterior.
6. No Wearable, ver somente o aviso passivo dentro do relógio, nas duas páginas. Sem formulário, checkboxes ou ação de conferência. A indicação orienta a consultar o painel de bordo.
7. Informações completas, sem evento e com consulta registrada removem o aviso automático; isso não é autorização de EVA. Falha de consulta mantém o estado anterior identificado ou informa indisponibilidade.

Regras centralizadas em `backend/app/operational.py`; persistência e polling existentes reaproveitados. `shared/operational.ts` é apenas contrato e cliente. As fixtures de teste compartilhadas são respostas serializadas da API, verificadas contra a função de avaliação para evitar um segundo classificador.

## Validação

| Verificação | Resultado |
| --- | --- |
| Web: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | Aprovados; 20 testes unitários |
| Wearable: mesmos quatro comandos | Aprovados; 2 testes unitários |
| Regras/persistência: `python -m pytest -q tests/test_demo_rules.py` | 19 testes aprovados: prioridades, estados, consulta separada dos dados, migração, persistência, concorrência e contrato das fixtures |
| Python: `python -m compileall -q app tests` | Aprovado |
| Playwright Web em Chrome | 17 cenários aprovados: fluxo automático, painel lateral, consulta sem checkboxes, foco, cenário, falhas, conflitos e regressões |
| Playwright Wearable em Chrome | 11 cenários aprovados; aviso passivo, atualização por polling e layout das duas páginas em 320 px nos três idiomas |
| Fluxo entre interfaces | 1 cenário adicional aprovado com os dois builds: mudanças no Web atualizam o aviso passivo; nenhuma gravação sai do Wearable |
| Revisão visual | Capturas desktop Web, painel lateral e Wearable inspecionadas; overflow e separação entre conteúdo/aviso testados em 320 px |
| `git diff --check` | Aprovado |

O ambiente bloqueou conexões locais (`connect EACCES 127.0.0.1`), impedindo o servidor de teste padrão do Playwright. A suíte de UI foi então executada no Chrome com os mesmos testes, fornecendo HTML/CSS/JS dos builds locais por `page.route`, além de respostas simuladas da API. Essa execução verifica o comportamento das interfaces e a propagação de uma resposta compartilhada simulada, **não a comunicação HTTP real entre navegadores e FastAPI**. Nenhuma fonte externa foi conectada para testar.

A tentativa da suíte completa `pytest -q` ficou bloqueada no primeiro `TestClient`: o loop de eventos do Python 3.10 precisa de um `socketpair` local que este ambiente não permite. A execução foi interrompida; os 13 testes HTTP de `test_api.py` e `test_operational_event.py` permanecem **sem resultado de execução neste ambiente**. Os 19 testes síncronos exercitam os handlers, os modelos e o SQLite sem esse canal. A suíte completa e a comunicação real precisam ser executadas num terminal local com conexões permitidas.

Uma expectativa antiga do teste EVA procurava exclusivamente a palavra `synthetic`, embora a interface use `simulated` após obter dose de sessão. Foi corrigida para verificar a indicação efetiva de taxa simulada e aguardar um intervalo válido antes de finalizar a sessão.

O CI também passa a verificar build, lint e testes unitários do Wearable, além do Web e do back-end. O workflow foi editado, mas não foi executado no GitHub nesta entrega. Nesta atualização, o ESLint terminou sem erros nem novos avisos; permanece apenas o aviso de tamanho do bundle ECharts no build Web.

## Arquivos da entrega

Inclui alterações locais já existentes que foram preservadas e concluídas. Não inclui builds, capturas ou o adaptador temporário de testes.

| Área | Arquivos |
| --- | --- |
| Contrato, textos e cálculo compartilhados | `shared/operational.ts`, `shared/operationalCopy.ts`, `shared/testing/operational-events.json`, `shared/i18n.ts`, `shared/radiation.ts`, `shared/demo.ts` |
| API e persistência | `backend/app/main.py`, `backend/app/db.py`, `backend/app/operational.py` |
| Web | `frontend/src/App.tsx`, `frontend/src/context/AppContext.tsx`, `frontend/src/pages/Overview.tsx`, `frontend/src/pages/Crew.tsx`, `frontend/src/index.css` |
| Componentes Web | `frontend/src/components/monitoring/OperationalCheck.tsx`, `DoseHistory.tsx`, `EVAClock.tsx`, `LiveRateChart.tsx` no mesmo diretório; `frontend/src/components/dashboard/SolarActivityPanel.tsx` |
| Wearable | `wearable/src/App.tsx`, `wearable/src/OperationalCheck.tsx`, `wearable/src/style.css` |
| Testes Web | `frontend/e2e/dashboard.spec.ts`, `frontend/playwright.config.ts`, `frontend/src/lib/demo.test.ts`, `frontend/src/lib/radiation.test.ts` |
| Testes Wearable | `wearable/e2e/watch.spec.ts`, `wearable/playwright.config.ts` |
| Testes Python | `backend/tests/conftest.py`, `backend/tests/test_demo_rules.py`, `backend/tests/test_operational_event.py` |
| Documentação e CI | `README.md`, `docs/CONTRATOS.md`, `docs/TECNOLOGIAS.md`, `docs/AJUSTES-V2.md`, `.github/workflows/checks.yml` |

## Limitações mantidas

- Sensores físicos e fontes NASA/NOAA/CCMC continuam sem integração; dados reais permanecem vazios.
- Atualização compartilhada por consulta periódica, sem push ou fila offline. Estado anterior só é marcado indisponível após a próxima consulta falhar.
- Registro guarda conferência e revisão atuais; não inclui autenticação nem auditoria completa de operadores.
- A interpretação contextual usa uma atividade fixa com cinco variações determinísticas. As séries ambientais continuam geradas no navegador; sua faixa visual não determina aptidão ou conclusão da revisão. Sem IA generativa, diagnóstico, modelo radiobiológico ou decisão de aptidão.
- Detalhes de uma sessão EVA longa permanecem em memória até zerar ou mudar a origem. A retenção normal limita detalhes aos últimos 30 minutos.
- Teste de compreensão com usuários ainda necessário; não houve validação clínica ou teste com astronautas.
- Build Web mantém o aviso de tamanho do bundle de gráficos. Divisão de pacotes fica fora do escopo desta correção.
