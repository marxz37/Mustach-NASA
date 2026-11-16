# Radiance — Refinamento funcional da V2

> **Registro histórico da etapa V2**, preservado na auditoria documental de 15/11/2026. Resultados e limitações abaixo descrevem aquela execução; não são uma revalidação da `main` atual. Os relatórios completos não estão versionados e nenhum teste foi reexecutado nesta auditoria. O estado posterior está explicitado ao final e em [CONTRATOS.md](CONTRATOS.md).

## Correção principal

A avaliação pré-EVA agora utiliza evidências radiológicas estruturadas, com associação à tripulante fictícia Maya Bennett e à atividade EVA-01. Fonte, instrumento, valor/unidade, grandeza, horário, missão/local, proveniência e qualidade sustentam a verificação. Os antigos booleanos são apenas resumos derivados.

A função `assess_preparation` permanece única no backend. Nenhuma regra clínica, conversão de fluxo em dose, integração física, página, LLM ou voz foi acrescentada. O layout dos dois aplicativos foi preservado.

## Comportamento demonstrado

| Situação | Resultado |
| --- | --- |
| Leitura pessoal ausente | Dados incompletos; conferir leitura individual |
| Consulta registrada sem leitura | A consulta persiste; a ausência permanece |
| Leitura sintética válida recebida | A mesma ocorrência recebe o registro, resolve a disponibilidade pessoal, invalida a consulta anterior e atualiza a revisão |
| Evento remoto sinalizado | Continua exigindo revisão, inclusive com uma leitura pessoal utilizável |
| Leitura antiga | Estado desatualizado e próxima verificação de leitura recente |
| Pessoa, atividade, missão/local ou unidade incorretos | Incompatibilidade explicitada; não é informação suficiente |
| Qualidade desconhecida/a revisar | Acompanhamento de qualidade, sem concluir sobre condição clínica |
| Expiração com API aberta | Reavaliação no polling; consulta invalidada e revisão incrementada uma única vez por mudança semântica |
| API local indisponível | Avaliação indisponível ou último estado identificado; gravações bloqueadas |

No painel lateral, “Receber leitura simulada” substitui a dependência exclusiva de trocar cenários para resolver a informação individual. Trata-se explicitamente de um exemplo gerado pela API local, não de sensor conectado. Os exemplos de leitura antiga, de outro tripulante e de qualidade a revisar usam o seletor já existente.

O Wearable resume **a mesma evidência pessoal e avaliação**: estado da leitura, valor quando utilizável, horário, tripulante, revisão e próxima verificação. O sinal ambiental independente deixou de representar seu estado individual. O relógio continua passivo; detalhes e gravações ficam no computador de bordo.

## Decisões de dados e persistência

- O contrato original `Measurement` foi centralizado em `backend/app/measurements.py`, reaproveitado pela API de observações e pelas evidências demonstrativas. Campos adicionais são apenas metadados de associação/qualidade.
- A tabela científica `measurements` continua separada dos exemplos. A ocorrência existente recebe `context_json`, `assessment_signature` e `reading_received_at`, sem novo banco ou plataforma.
- `personal_reading_available` não determina o resultado; ele é calculado a partir do conteúdo da medição. O seletor booleano legado continua aceito somente como escolha de fixture estruturada.
- A idade da leitura é calculada pelo relógio UTC real da API, sem relógio ou classificador paralelo nos clientes. O limite padrão de 900 s é configurável por `MUSTACH_DEMO_MAX_READING_AGE_SECONDS`: política de engenharia, não critério médico da NASA.
- Reiniciar a API preserva dados e consultas. Não renova timestamps antigos. Na migração da versão anterior, consultas sem a nova evidência são invalidadas uma única vez, preservando o cenário.
- Nova evidência ou estado temporal incompatível invalida consultas antigas. A transação reconcilia expiração antes de conferir a revisão enviada, impedindo confirmação de contexto antigo.
- Receber uma leitura pessoal não altera o evento remoto, o ID da ocorrência ou a fonte ambiental. Em demonstrações longas, o ambiente também pode expirar; o seletor existente recria esse contexto quando necessário.

## Testes executados

| Verificação | Resultado |
| --- | --- |
| Web: typecheck, lint, `npm test`, build | Aprovados; 20 testes unitários |
| Wearable: typecheck, lint, `npm test`, build | Aprovados; 2 testes unitários |
| Backend: `pytest -q tests/test_demo_rules.py tests/test_structured_evidence.py` | 39 testes aprovados |
| Python: `compileall -q app tests` | Aprovado |
| Playwright Web | 21 cenários aprovados contra build local com API simulada |
| Playwright Wearable | 13 cenários aprovados, incluindo layout das duas telas em 320 px nos três idiomas |
| Fluxo Web → Wearable | 1 teste adicional aprovado com os dois builds e uma resposta compartilhada simulada; inclui recebimento de medição pessoal sem trocar o cenário |
| Revisão visual | Capturas Web e Wearable inspecionadas; estados de ausência/desatualização e evidências verificados |

Os testes do backend cobrem conteúdo/associação, tempo, qualidade, ausência, ambiente, evento remoto, separação de proveniência, recebimento, persistência, concorrência, expiração e contratos. As fixtures usadas pelos navegadores são exportadas dos handlers e verificadas contra o motor; não há um segundo classificador de teste.

**Limitação de execução:** a suíte HTTP completa não foi aprovada neste ambiente. A tentativa dos testes HTTP existentes parou no primeiro `TestClient`, com timeout na criação de `socketpair`/loop asyncio do Python 3.10 no Windows restrito. O novo caso HTTP do recebimento também precisa ser executado fora dessa restrição. Os 39 testes síncronos exercitam handlers/modelos/SQLite, mas não substituem validação do transporte HTTP real.

O Playwright foi executado no Chrome com HTML/CSS/JS locais fornecidos por interceptação de rotas e respostas simuladas da API, pois conexões locais estão restritas. Portanto, o comportamento e a consistência entre interfaces foram testados; a comunicação real navegador–FastAPI continua sem verificação neste ambiente. Permanece o aviso existente de tamanho do bundle ECharts; nenhum erro de build foi ocultado.

Para regenerar as fixtures no diretório `backend`, usando o ambiente já instalado:

```powershell
.\.venv\Scripts\python.exe -c "import runpy; runpy.run_path('tests/export_operational_fixtures.py',run_name='__main__')"
```

## Arquivos desta atualização

| Área | Arquivos |
| --- | --- |
| API e evidências | `backend/app/measurements.py` (novo), `operational.py`, `main.py`, `db.py` |
| Regras e contratos testados | `backend/tests/test_structured_evidence.py` (novo), `test_demo_rules.py`, `test_operational_event.py`, `conftest.py`, `export_operational_fixtures.py` (novo) |
| Contratos/traduções comuns | `shared/operational.ts`, `operationalCopy.ts`, `radiation.ts`, `i18n.ts`, `demoCopy.ts`, `shared/testing/operational-events.json` |
| Web | `frontend/src/components/monitoring/OperationalCheck.tsx`, `frontend/src/types/domain.ts`, `frontend/src/index.css`, `frontend/e2e/dashboard.spec.ts` |
| Wearable | `wearable/src/App.tsx`, `wearable/src/OperationalCheck.tsx`, `wearable/e2e/watch.spec.ts` |
| Documentação/configuração | `README.md`, `docs/CONTRATOS.md`, `docs/RASTREABILIDADE-DADOS.md`, `docs/TECNOLOGIAS.md`, `docs/AJUSTES-V2.md`, `backend/.env.example` |

## Limitações do MVP

- A avaliação operacional continua em modo demonstrativo, com uma atividade fictícia e variações pequenas. Não interpreta dados de voo nem substitui um processo de autorização.
- Qualidade `VALID` é um indicador do exemplo, não uma prova de calibração ou de correção científica do instrumento.
- Um ponto pessoal utilizável não fornece histórico completo de exposição ou conclusão sobre saúde. As séries de perfil, sinais vitais e mapa corporal são ilustrações independentes; frequência, sono e SpO₂ não entram no motor radiológico.
- Eventos remotos e previsões solares não são dose individual. Não há cálculo de risco biológico, imunidade, dano ou prognóstico.
- A lógica independe de acesso à Terra, mas requer a API local. Não há fila offline, pareamento físico, autenticação, auditoria completa ou sincronização instantânea. O intervalo normal de consulta é três segundos.
- A utilidade humano-sistema ainda é uma hipótese de protótipo; faltam teste de compreensão com usuários e validação operacional especializada.

## Estado posterior verificado na main — auditoria documental

- A simulação temporal agora vem de `backend/app/simulation.py`, com estado em SQLite e polling dos dois front-ends a cada segundo. O relógio real da avaliação pré-EVA permanece separado do relógio demonstrativo dos gráficos.
- Na simulação atual, a primeira tela do Wearable apresenta a taxa ambiental fictícia compartilhada e uma linha independente de leitura pessoal. Portanto, a descrição histórica acima não deve ser lida como se toda a tela atual apresentasse uma dose pessoal. O banner persistente `Pre-EVA review pending` foi removido; a consulta da evidência pessoal continua.
- Avisos SEP oficiais, de previsão e simulados ficam somente no Wearable; não existe central no Web. Reconhecimento e vibração opt-in são locais ao navegador, sem conexão com hardware ou push.
- A limitação de transporte relatada nesta etapa não prova uma falha atual do projeto. Houve relato posterior de validação HTTP em [TECNOLOGIAS.md](TECNOLOGIAS.md), também histórico e não reexecutado nesta auditoria. Contagens antigas de testes não são tratadas como resultados atuais.
- Os coletores manuais RadLab DosTel1, GOES, probabilidades/boletins SWPC, HESPERIA REleASE e DONKI SEP têm implementação, testes e registros de coleta descritos em [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md). Nenhum deles alimenta automaticamente a evidência pessoal pré-EVA ou o mapa real por órgão.
- PostgreSQL, publicação Cloudflare, smartwatch físico e modelos radiobiológicos permanecem não implementados. O nome público é Radiance; `Mustach-NASA` continua sendo o nome do repositório.
