# References and licenses

Everything used to build VitalSeal, including open-source software, with its license.

## NASA resources

NASA published no raw dataset for this challenge. These pages from the Human Research Program (HRP) were read by the team and are linked from inside the app (see `src/domain/evidence.ts`).

| Resource | URL | Used for |
|---|---|---|
| NASA Space Apps Challenge 2026, "Create Health Monitoring Software for Astronauts on Space Missions" | https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/ | The challenge statement and its resources |
| HRP, 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ | Frames the body systems and the distance-from-Earth escalation |
| HRP, Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ | Mapping risks to body systems |
| HRP, Ongoing HRP Research in Space | https://www.nasa.gov/hrp/ongoing-hrp-research/ | Context for the design of the daily check |
| ARCHeR (Artemis Research for Crew Health & Readiness) | https://www.nasa.gov/reference/archer/ | Crew well-being, activity and sleep measures |
| Artemis II Spaceflight Standard Measures | https://www.nasa.gov/reference/artemis-ii-standard-measures/ | A fixed set of measures taken the same way over time |

HRP risk pages used per body system (all under `https://www.nasa.gov/reference/`):

| System | Pages |
|---|---|
| Cardiovascular | `risk-of-cardiovascular-adaptations/`, `risk-of-hypoxia/` |
| Neuro / behavioral | `risk-from-inadequate-sleep-and-irregular-schedules/`, `risk-of-behavioral-changes-and-psychiatric-disorders/` |
| Musculoskeletal | `risk-of-spaceflight-induced-bone-changes/`, `risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/` |
| Radiation / immune | `risk-of-radiation-induced-cancers/`, `risk-of-altered-immune-system-responses/` |
| Metabolic | `risk-of-inadequate-food-and-nutrition/` |

These pages are qualitative. The summaries in the app are written in our own words. The numeric reference ranges are general clinical references and are **not** NASA thresholds. NASA brand elements (logos, insignia, mission identifiers) are not used.

## Space agency partner resources

| Resource | URL | Used for |
|---|---|---|
| Canadian Space Agency, "Monitoring radiation for astronaut health" | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | Context for treating radiation dose as its own indicator and system |

## Open-source software

Versions are pinned in `package.json`. Licenses were read from each installed package.

| Package | Version | License | Role |
|---|---|---|---|
| react, react-dom | 19.3.1 | MIT | UI framework |
| zustand | 5.1.0 | MIT | State management |
| lucide-react | 1.73.0 | ISC | Icons |
| recharts | 3.10.1 | MIT | Listed as a dependency; not used by the current interface |
| vite | 8.3.8 | MIT | Build tool |
| @vitejs/plugin-react | 6.3.0 | MIT | React support for Vite |
| tailwindcss, @tailwindcss/vite | 4.3.5 | MIT | Styling |
| typescript | 7.0.2 | Apache-2.0 | Language and type checking |
| vitest | 5.1.0 | MIT | Unit tests |
| @types/react, @types/react-dom | 19.3.0 | MIT | Type definitions |

Browser standards used without extra libraries: the Web Crypto API (SHA-256, ECDSA P-256, AES-GCM, PBKDF2), Service Workers and the Web App Manifest.

Transitive dependencies are listed in `package-lock.json`. At the time of writing, `npm audit` reports no known vulnerabilities in production dependencies.

## Fonts, images and data

- **Fonts:** system font stacks only. No web fonts are loaded.
- **Images and icons:** original. The Earth background, the body map and the app icons are drawn by code or as SVG by the team with AI assistance (see `docs/AI_LOG.md`). No photographs, stock images or third-party artwork.
- **Data:** synthetic, produced by `src/data/synthetic.ts` from a fixed random seed. Not real astronaut data.

## Project license

MIT. See `LICENSE`.
