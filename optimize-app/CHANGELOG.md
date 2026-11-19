# optimize-app changelog

One line per change: date, kind of repo audited, what changed and why.

- 2026-11-18 · (design change, no audit) · Added "Project memory": each audit writes `.claude/optimize-app/PROFILE.md` (project facts, updated in place) and a dated report under `audits/`. Reason: project-specific knowledge needs a home that is not this file, and repeat audits need a before/after record without numbered copies of the skill.
- 2026-11-18 · Next.js marketing site; FastAPI + Next.js internal tool · Added the preflight step, read-only safety rules, the "existing guardrails first" rule, the Techniques section (client import tracing, gate checks, dead-code false positives, hot vs cold paths), per-app reports and the "Improve this skill" step. Reason: the first version assumed the project could be built in the audit environment, flagged decorator-registered routes and disk-loaded content as dead code, and treated one-off migrations as hot paths.
