# VitalSeal

**Offline-first astronaut health monitoring with tamper-evident medical records.**

NASA Space Apps Challenge 2026 · Universal Event · Team **Space Exploit** · Barranquilla, Colombia

> *Health decisions you can trust, 22 minutes from Earth.*

---

## Repository status

This repository is being prepared **before** the hackathon. By rule, no
challenge code is written before **14 November 2026**.

| Path | What it is | Ready? |
|---|---|---|
| `AGENTS.md` | Project source of truth (stack, scope, rules) | ✅ |
| `docs/` | Plan, research, decisions, submission checklist | ✅ |
| `deck/` | Internal team deck (Spanish, 11 slides) | ✅ |
| `src/` | The actual application | ⏳ starts 14 Nov |

If `npm install` fails at the root, that is expected: the app scaffold does not
exist yet. The only runnable package today is `deck/` (see below).

---

## The problem

Long-duration missions expose crews to space radiation, isolation and
confinement, altered gravity, and a hostile closed environment. On a Mars
transit, a message to Earth takes up to **22 minutes** one way and there is no
flight surgeon on board. The astronaut is their own first responder.

And there is a second problem most tools ignore: **the data itself can lie.**
A compromised sensor or an altered record can show "all normal" when it isn't.
Medical decisions depend on the record being intact.

## What VitalSeal does

| Pillar | What it does |
|---|---|
| **Assess** | A 5-minute daily self-check across 8 health indicators |
| **Decide** | Personal baseline + safety limits + trend rules → traffic light + concrete next action |
| **Trust** | AES-GCM local vault, SHA-256 hash chain, ECDSA-signed report, integrity panel |

### Indicators

Heart rate · Blood pressure · SpO₂ · Temperature · Sleep · Mood · Symptoms ·
Radiation dose

### Body map

A technical exoskeleton diagram with 5 clickable systems — neuro, cardiovascular,
metabolic, musculoskeletal, radiation — each showing status by **color, icon and
text**, never color alone.

### Communication-delay-aware escalation

| Location | Latency | Action |
|---|---|---|
| LEO / ISS | < 1 s | Immediate flight surgeon consult |
| Moon | ~2.5 s | Fast asynchronous consult |
| Mars | 5–22 min | Autonomous protocol + signed report for deferred review |

## Scope

This is a **48-hour hackathon prototype**, not a medical device.

- ✅ Web app, offline-first, no backend
- ✅ 8 indicators, rule engine, body map, trends, signed report, integrity panel
- ✅ NASA open data used for thresholds and demo data
- ❌ No real wearable integration
- ❌ No diagnosis, no prescription, no clinical validation

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · Recharts · Framer Motion ·
lucide-react · Zustand · Web Crypto API · Vitest

No backend. All health data stays on the device.

## Run locally

The app scaffold lands on 14 November. Until then the only runnable package is
the deck generator:

```bash
cd deck
npm install
node build-deck.js        # regenerates VitalSeal_SpaceExploit.pptx
```

Once `src/` exists:

```bash
npm install
npm run dev
```

```bash
npm run build
npm test
```

## NASA data sources

- [NASA Human Research Program — 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)
- [NASA Human Research Roadmap](https://humanresearchroadmap.nasa.gov/)
- [NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov/bio/repo/)
- [NASA Life Sciences Portal (NLSP/LSDA)](https://nlsp.nasa.gov/explore)

## AI disclosure

See [`docs/SUBMISSION.md`](docs/SUBMISSION.md).

## Disclaimer

**Research prototype. Not a medical device. Not clinically validated.** Nothing
in this project constitutes medical advice, diagnosis, or treatment.

This project is not affiliated with, endorsed by, or sponsored by NASA.

## License

MIT
