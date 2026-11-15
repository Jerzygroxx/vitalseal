# AI use log

Every significant use of AI in this project. Times are Colombia time (UTC-5); entries for 15 Nov are approximate. The "Review" column records who checked the output. Human review is completed by the team before submission.

Tools: **Claude Code** (Anthropic, model Claude Sonnet 5.5), **OpenCode** with DeepSeek (`opencode/deepseek-v4.1-flash-free`), and **Fable** (Anthropic Claude Fable 5.2, used as a design assistant from Claude Code). Commit prefixes mark the author: `[cc]` Claude Code, `[oc]` OpenCode, `[fable]` design assistant.

| Date/time | Tool | Model | What was done | Review |
|---|---|---|---|---|
| 14 Nov 11:20 | Claude Code | Claude Sonnet 5.5 | Bootstrap, shared type contract and project scaffold (Vite, React 19, strict TypeScript, Tailwind v4, Vitest) | Team review pending |
| 14 Nov 11:35 | Claude Code | Claude Sonnet 5.5 | Decision engine: thresholds, personal baseline, rules, escalation by distance, synthetic data and tests | Team review pending |
| 14 Nov 12:05 | Claude Code | Claude Sonnet 5.5 | Research of the challenge rules, Zustand store, sources for the thresholds | Team review pending |
| 14 Nov 11:50 | OpenCode | DeepSeek | Daily check form, status badge, validation and tests | Claude Code (approved); team review pending |
| 14 Nov 12:30 | Claude Code | Claude Sonnet 5.5 | Draft of the submission texts (English) | Team review pending |
| 14 Nov 12:35 | Claude Code | Claude Sonnet 5.5 | Hash chain, ECDSA signing, verification, AES-GCM vault, seal code, integrity store and 26 tests including tampering | Team review pending |
| 14 Nov 13:05 | OpenCode | DeepSeek | Dashboard, body map, system cards, formatting helpers and tests | Claude Code (approved); team review pending |
| 14 Nov 13:20 | Claude Code | Claude Sonnet 5.5 | App wiring: form, dashboard, distance selector and initial sealing | Team review pending |
| 14 Nov 13:40 | OpenCode | DeepSeek | Integrity panel, Ground Control verifier, check rows, summary helpers and tests | Claude Code (approved); team review pending |
| 14 Nov 13:50 | Claude Code | Claude Sonnet 5.5 | Report parser for the verifier, Integrity and Ground Control tabs, quality gates | Team review pending |
| 14 Nov 14:25 | Claude Code (design subagent) | Fable | Full visual redesign: design tokens, procedurally generated Earth background (Canvas 2D), body map, integrity orbit, layout. Creative direction by the team; a reference image was used for style only | Claude Code (96 tests, build); team review pending |
| 14 Nov 15:50 | Claude Code and Fable | Claude Sonnet 5.5 / Fable | Experimental simplified redesign on a separate branch. Tried and **discarded** by the team; none of that code was merged | Team |
| 15 Nov 09:55 | Claude Code | Claude Sonnet 5.5 | Offline mode: service worker generated at build time, manifest, original icons, status indicator, deploy headers, real offline test with headless Edge | Team review pending |
| 15 Nov 10:19 | Claude Code | Claude Sonnet 5.5 | Reading of NASA and CSA resources; official-source evidence module and "Official sources" panel; corrected citations | Team review pending |
| 15 Nov 10:40 | OpenCode | DeepSeek | Read-only audit of the repository before publishing (no code changed) | Claude Code; team review pending |
| 15 Nov 11:00 | Claude Code | Claude Sonnet 5.5 | Production deploy, screenshots of the deployed app, demo deck (7 slides) built with Claude's slide tool, submission guide for the team | Team review pending |
| 15 Nov 11:40 | Claude Code | Claude Sonnet 5.5 | Public release branch: README, REFERENCES, this log in English, radiation levels relabeled as illustrative | Team review pending |
| 15 Nov 12:30 | Claude Code | Claude Sonnet 5.5 | Fix for the mobile navigation hidden by the host's floating badge; 30 s demo video (screen capture of the app, assembled with ffmpeg) and its narration script | Team review pending |
| 15 Nov 12:45 | Claude Code | Claude Sonnet 5.5 | Narration audio of the demo video: generic synthetic voice (Microsoft Zira, built-in Windows text-to-speech), not a human recording | Team review pending |
| 15 Nov 13:15 | Claude Code | Claude Sonnet 5.5 | Version 2: action playbooks (general first-aid-level text with official source links, no drugs or doses), event record added to the hash chain, guided flow and navigation state, with tests | Team review pending; steps not validated by a flight surgeon |
| 15 Nov 13:40 | OpenCode | DeepSeek | Action plan checklist card (T-05) and the check-in wizard, one question per screen (T-06), with tests; both reviewed by Claude Code (typecheck, tests, scope check) | Claude Code (approved); team review pending |
| 15 Nov 14:00 | Fable | Claude Fable 5.2 | Home screen redesign (T-07): guided question, three big answers, status ring | Claude Code (typecheck, tests, screenshots); team review pending |
| 15 Nov 14:50 | Claude Code | Claude Sonnet 5.5 | Fix for a blank screen when the page loads with a zero-size viewport (error boundary around the decorative backdrop); "Send to ground" export (download or copy the signed report) with tests | Team review pending |
| 15 Nov 15:30 | Fable | Claude Fable 5.2 | Integrity and Ground Control redesign (T-08): verdict first, three-step flow, file loading | Claude Code (typecheck, tests, tamper round trip in the browser); team review pending |
| 15 Nov 15:50 | Claude Code | Claude Sonnet 5.5 | Version 2 published as the live app; repository updated to match; unused dependency (recharts) removed | Team review pending |

## What AI was and was not used for

- **Used for:** code, tests, documentation, interface components, visual design, slide layout, and reading and summarizing public rules and resources.
- **Data:** demo data comes from a seeded script, not from an AI model, and is labeled synthetic in the app.
- **Images:** illustrations are drawn by code with AI assistance and credited in the app footer and the slide footers. They are not photographs.
- **Not used for:** choosing the challenge or the core concept, which the team defined before the hackathon. During planning, an AI assistant suggested some feature ideas (a distance simulator, a Ground Control verifier and a short seal code), which the team reviewed and decided to build.
- **Not used for:** clinical thresholds without a cited source, or NASA branding. No NASA logos, flags or mission identifiers are used.
