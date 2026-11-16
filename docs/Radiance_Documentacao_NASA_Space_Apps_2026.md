# Radiance

## Context-Aware Radiation Monitoring for Human Spaceflight

**NASA Space Apps Challenge 2026**  
**Selected challenge:** [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)

| Project information | Details |
| --- | --- |
| Team | Mustache |
| Team members | Tiago Santos Alcantara; Marx Bento Dumbá; Luiz Fernando Rodrigues Salomão Da Cunha |
| Local event | Itabira |
| Source code | [github.com/marxz37/Mustach-NASA](https://github.com/marxz37/Mustach-NASA) |
| Project presentation | [slides in Canvas](https://canva.link/78vnhwezu07j4b4) |

## Project summary

Radiance is a context-aware radiation monitoring prototype for human spaceflight. It brings environmental radiation measurements, space-weather forecasts, mission context and structured personal evidence into a web dashboard and a wearable-style browser interface. The system keeps observations, forecasts and simulations separate, and makes missing, stale or incompatible personal readings visible. Radiance is designed to help users understand the source and limits of available evidence without turning environmental measurements into unsupported claims about an astronaut’s individual dose, health or operational safety.

## Challenge and need

The selected NASA Space Apps challenge asks teams to create software that gathers health indicators and enables astronauts to evaluate and act on the status of their health during space missions. Long-duration missions expose crews to multiple health-related conditions, including radiation, isolation and altered gravity.

Radiation information can come from instruments and models with different quantities, units, locations, time windows and uncertainties. Without context, environmental measurements can be mistaken for personal exposure. Radiance focuses on organizing these evidence types and showing what each can—and cannot—support.

## What Radiance does

- Presents environmental observations, forecasts, alerts, events and synthetic demonstrations as distinct information types.
- Preserves source, instrument, quantity, unit, timestamp and provenance for integrated scientific data.
- Checks whether expected personal evidence is present, current, compatible and associated with the activity.
- Shows missing or stale evidence explicitly instead of substituting an environmental value.
- Displays the same assessment state in the web dashboard and wearable-style browser preview.

## Demonstration scenario

The demonstration follows a fictional crew member preparing for an extravehicular activity (EVA). The personal reading is initially missing. The user reviews the evidence context, receives a structured simulated reading and checks its source, unit, timestamp, quality and association with the activity. The wearable-style interface then displays the same shared state.

The demonstration reading and crew profile are fictional. They do not represent a physical sensor, an astronaut’s medical record or a NASA operational threshold.

## Scientific data and resources

| Source | Use in Radiance | Interpretation |
| --- | --- | --- |
| NASA OSDR RadLab / DosTel1 | Historical data from a specific ISS instrument | Absorbed-dose rate and particle flux; not personal dosimetry |
| NOAA SWPC GOES | Observed solar proton data | Integral proton flux; not personal dose |
| NOAA SWPC forecasts and alerts | Space-weather context | S1+ probabilities and relevant solar-proton notices |
| NASA CCMC SEP Scoreboard / REleASE | Solar energetic particle model forecasts | Forecast channels and units are kept separate |
| NASA DONKI SEP | Historical event context | Solar energetic particle events |

Data collection is manual and explicit; it is not represented as continuous live monitoring. Scientific observations, forecasts, notices, events and demonstration state are stored and presented separately. The Wearable shows eligible SEP notices; the Web has no notification center. The shared simulation clock is maintained by FastAPI with state persisted in SQLite, not by independent browser generators. The source catalogue, collection evidence and data traceability are documented in the project repository.

## Technical approach

| Component | Technology | Role |
| --- | --- | --- |
| Radiance Web | React, TypeScript, Vite | Dashboard, charts, simulation controls and evidence review |
| Shared API | Python, FastAPI, Pydantic | Validation, evidence rules, scientific collectors and shared application state |
| Local storage | SQLite | Persists scientific observations, forecasts, events and demonstration data separately |
| Wearable-style preview | React, TypeScript, Vite | Compact browser interface using the shared API state |
| Shared contracts | TypeScript | Common data contracts and English, Portuguese and Spanish interface text |

The wearable-style interface is a browser preview. It is not paired with physical watch hardware, Bluetooth or a dosimeter. Synthetic data is not inserted into the scientific observations store.

## Evidence handling and scientific boundaries

Radiance treats uncertainty, missing data and provenance as part of the information users need to interpret a reading. Its demonstration checks evidence presence, compatibility, freshness, quality and association with the activity. These checks describe data availability and consistency; they are not a diagnosis or a medical risk score.

- Proton flux is not converted into personal dose.
- Absorbed dose, equivalent dose and particle flux remain distinct quantities.
- Environmental measurements are not presented as an individual astronaut’s medical measurement.
- The body visualization and demonstration bands do not provide a validated real exposure classification by organ.
- Real health or mission guidance would require calibrated personal sensors, validated methods and review by qualified specialists.

## Expected value and future work

Radiance can support education, science communication and early prototyping of human-spaceflight monitoring interfaces. It helps users see which evidence is available, where it came from and where further measurement or review is needed.

Further development would require validated personal dosimetry, calibrated sensors, appropriate handling of health data, broader instrument coverage and review by radiation-health specialists. Any additional scientific integration would require its own validation.

## Originality and AI tools

The team states that the project idea is original. NASA, NOAA and CCMC data, software libraries and other third-party materials used in the project are acknowledged as resources and should be cited in the submission.

**AI tools used (team declaration):** OpenAI Codex and Claude. Codex assistance with code, tests and documentation is disclosed in the interfaces. Claude's model/version and task-level contributions are not recorded. The fictional crew portraits are disclosed as AI-generated, but their generation model is unknown; it must not be inferred from this tool list. The team reviewed the project materials and remains responsible for the submitted solution.

## Team

| Role | Name |
| --- | --- |
| Team | Mustache |
| Local event | Itabira |
| Team member | Tiago Santos Alcantara |
| Team member | Marx Bento Dumbá |
| Team member | Luiz Fernando Rodrigues Salomão Da Cunha |

## Project links and references

- [Project repository](https://github.com/marxz37/Mustach-NASA)
- [Selected challenge: Health Monitoring Software](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- [NASA Space Apps Challenge 2026](https://www.spaceappschallenge.org/2026/)
- [Participant terms and conditions](https://www.spaceappschallenge.org/legal/)

Additional technical references are available in the repository: [DADOS-NASA-UTILIZADOS.md](DADOS-NASA-UTILIZADOS.md), [FONTES-CIENTIFICAS.md](FONTES-CIENTIFICAS.md), [RASTREABILIDADE-DADOS.md](RASTREABILIDADE-DADOS.md), [CONTRATOS.md](CONTRATOS.md) and [TECNOLOGIAS.md](TECNOLOGIAS.md).

The form-ready [Submission Resources Inventory](RECURSOS-SUBMISSAO.md) separates integrated products, scientific references and development tools, with project evidence for each entry. The Figma presentation above is a team-provided link, not proof of a runtime integration; its external contents were not reviewed in the documentation audit. The official challenge page was located in the public index, but direct retrieval encountered certificate/gateway errors, so it is not certified accessible by this audit.
