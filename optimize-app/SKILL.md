---
name: optimize-app
description: Audit and optimize a web app or service codebase (Next.js/React, Node, Python, or whatever the repo uses): performance and Core Web Vitals, bundle size, dependencies, dead and duplicate code, architecture, technical SEO, accessibility, security, tests and CI. Use whenever the user asks to optimize, speed up, clean up, slim down, reduce bundle size or tech debt, refactor for maintainability, or run a code or site health audit, even if they name only one of these.
---

# Optimize App

Find the changes that measurably improve a codebase and the product it ships, prove them with numbers, and make them without breaking behavior. Two things are being optimized: what users experience (speed, accessibility, discoverability, reliability) and what engineers maintain (size, clarity, dependencies, tests, delivery).

## Principles

These exist because "optimize everything" produces large diffs with no proven benefit.

1. **Measure before and after.** Every finding cites evidence (a file and line, or command output) and every fix is re-measured. If something could not be measured, say so instead of estimating.
2. **Preserve behavior.** Tests, typecheck and build pass before a change and after it. If the code being changed has no tests, say so and add a minimal one first or flag the risk.
3. **Audit first, change second.** The audit is read-only. Edit code only when the user asked for fixes or approved the plan.
4. **Smallest change that moves a metric.** Less code is an outcome of removing what is unused or duplicated, never a target. Do not trade readability, types or tests for a lower line count.
5. **Detect the stack, never assume it.** Read it from the repo and apply only the checks that fit.
6. **Build on what the project already has.** A mature repo already has budgets, gates and written decisions. Find them first, verify them, and report only what they miss. A short findings list is a valid result; padding it with generic advice is not.
7. **When goals conflict, use this order:** correctness and security, then user-facing performance and accessibility, then maintainability, then code size.

## Read-only safety during the audit

- Do not install, build or run anything that writes into the user's project folder unless they agreed. Builds, incremental type checks and test runners leave artifacts and caches behind. To run the project's own scripts anyway, export the committed tree to a temporary folder outside the repo (`git archive HEAD | tar -x -C <dir>`), install there and run everything there. Generated, git-ignored inputs are missing from that copy, so note which checks need them.
- Git: read only. Record the branch, commit and any uncommitted changes, and leave them alone. Use `GIT_OPTIONAL_LOCKS=0` for status and log so no lock files are left behind.
- Secrets: never print the contents of `.env` files, keys or tokens. Check only that they are ignored by git and which variable names exist (from the example file).
- Keep throwaway analysis scripts outside the repo.

## Workflow

### 1. Set scope

- **Full audit**: all areas, report only.
- **Focused**: one or two areas ("reduce the bundle", "find dead code").
- **Fix**: implement approved findings.

"Optimize this" with no detail means a full audit plus a proposed plan. If the repo holds several apps (for example `backend/` and `frontend/`), or the user gave several repos, audit each as its own unit with its own baseline and findings.

### 2. Detect stack, conventions and existing guardrails

Read, as present: package manifests and lockfiles, framework config, `tsconfig.json`, `pyproject.toml` / `requirements*.txt`, Dockerfiles, CI workflows, `README`, `CONTRIBUTING`, `AGENTS.md` / `CLAUDE.md`, and the `docs/` folder. Note the rendering model (static, server-rendered, client-only), the data layer, and hosting.

Then list what the project already enforces: bundle or performance budgets, lint and type gates, accessibility tests, dependency update bots, security headers, documented trade-offs. Decisions the team wrote down and accepted ("in-memory rate limit is enough for now") are context, not findings, unless the evidence shows the assumption no longer holds.

Record installed major versions. Framework defaults change between majors, so check the installed version's own documentation (often shipped inside the package) before recommending version-specific features.

### 3. Preflight: what can actually run here?

Check before promising a baseline, because sandboxes often cannot run the project:

- Is there network access for package installs?
- Were dependencies installed on a different operating system? Native binaries (compilers, bundlers, image libraries, test runners) are platform-specific, so a `node_modules` or virtualenv created on Windows will not run on Linux.
- Does the runtime version here satisfy the project's requirement?

Then take the highest rung available for each metric and label which one was used:

1. Run the project's own scripts (build, typecheck, lint, tests, budget checks).
2. Run the pure-script parts that still work: analysis scripts written in plain JavaScript or Python, or an alternate pure-JS or pure-Python build of a tool already in the dependency tree.
3. Reuse existing build output, after checking its age against the latest commit. Stale output can describe pages and code that no longer exist; say how old it is.
4. Static analysis with small throwaway scripts (see "Techniques").
5. Not measured. List it with what would be needed.

Never leave the user thinking something ran when it did not.

### 4. Capture a baseline

Collect the numbers in "Measurement" for the areas in scope. A failing build, typecheck or test suite is finding number one. Before reporting a failing test, run it again alone with one worker: a test that passes alone and fails only beside others is timing-sensitive, a smaller and different finding than broken behavior.

### 5. Audit the areas in scope

Use the checklists in "Areas" as prompts for where to look. Report only what is present in this repo.

### 6. Prioritize

Rate each finding on impact (which metric moves, roughly how much), effort (S: under an hour, M: under a day, L: more) and regression risk.

- **P0**: security holes, broken builds, data loss, failing Core Web Vitals on key pages.
- **P1**: high impact, low or medium effort.
- **P2**: worthwhile, larger effort or lower impact.
- **P3**: nice to have. One line each.

### 7. Report

Use "Report format". Deliver in the conversation unless the user asks for a file.

### 8. Implement (fix mode)

Follow the project's own contribution process: issue, branch naming, commit format, required local checks. One finding per change, so each can be reviewed and reverted alone. After each change run the project's checks, then re-measure the metric the finding targeted. If it did not move, revert and say so. Finish with a before/after table.

### 9. Guard against regression

For each metric that improved, propose the lightest check that keeps it there, extending gates the project already has before adding new ones.

### 10. Improve this skill

Do this after the report, when the user asks for it or has set it as their standing practice. The point is that each audit makes the next one better, without the skill drifting into notes about one project.

Review the run and ask:

- Which instruction here was wrong or misleading for this repo?
- Which step cost time and produced nothing?
- What did you have to work out that the skill should have told you?
- Which false positive did you nearly report, or did report and retract?
- Which finding came from a method the skill does not describe?

Then:

1. Keep only lessons that would hold in a different repo with a different stack. Facts about this project (paths, product names, its conventions) belong in the project's own `CLAUDE.md` or `AGENTS.md`, never here.
2. Propose at most five edits. Prefer correcting or replacing an existing line over appending a new one, and delete anything the run showed to be useless. Keep this file under 500 lines; if a section grows, move it to a reference file beside this one and link to it.
3. Show the changes as a diff and wait for approval. Apply them only when the user agrees, unless they said in advance to apply without asking.
4. After applying, add one line to `CHANGELOG.md` beside this file: date, kind of repo audited (for example "Next.js marketing site"), what changed and why.

If this file is not editable in the current environment, list the proposed edits at the end of the report instead.

## Project memory

This skill is the procedure and stays generic. What it learns about one project lives in that project, in `.claude/optimize-app/`:

```
.claude/optimize-app/
├── PROFILE.md            # current facts about this project, updated in place
└── audits/
    ├── 2026-11-18.md     # one full report per audit, never edited afterwards
    └── 2026-12-02.md
```

The profile saves rediscovery and stops the same false positives and accepted trade-offs being reported again. The dated reports give a before/after record.

Do not write a project copy of this skill, and do not create numbered versions of the profile (`PROFILE-v2`, `skill1`). A second skill with the same name is either shadowed or competes to be triggered, a copy stops receiving improvements made to this file, and old versions get read as if they were current. History belongs in `audits/` and in git.

### PROFILE.md

Write it from what this audit verified, not from this skill's text. Nothing in it should be true of projects in general. Keep it under about 150 lines and update it in place each audit: correct what changed, delete what no longer applies.

```
# Optimization profile: <project>
Last audit: <date> · commit <sha> · report: audits/<date>.md

## Stack
Versions, rendering model, data layer, hosting. One line each.

## Commands
The exact commands for build, typecheck, lint, tests and budget checks, and where
they were verified to run (OS, runtime version). Note any that could not run and why.

## Guardrails in place
Budgets, gates and tests the project enforces, with file paths.

## Accepted trade-offs
Decisions the team made on purpose, each with where it is documented.
Do not report these again unless the evidence changed.

## Known false positives
Things that look unused, slow or unsafe here but are not, with the reason.

## Where to look first
Project-specific checks that paid off, and the modules where problems cluster.

## Baseline history
| Date | Commit | <the metrics tracked for this project> |

## Findings
| ID | First seen | Finding | Status |
Status is open, fixed in <commit>, or declined with the reason.
```

In a repo with several apps, keep one profile with a section per app, or one `PROFILE-<app>.md` each if it outgrows the limit.

### Using the profile on later audits

- Treat it as a cache, not as truth. Confirm that versions, commands and guardrails still match the repo, and re-verify any fact a finding depends on.
- Keep finding IDs stable. An ID is never reused, and a finding that is still present keeps its ID and first-seen date.
- Open each report with what changed since the last audit: findings fixed, still open and new, and metric movement against the baseline history.
- Skip what the profile marks as accepted or as a false positive, unless something about it changed.

### Rules for these files

- No secrets, tokens or personal data.
- Check whether `.claude/` is ignored by git and tell the user. Ignored means the files stay on this machine; not ignored means they show up as untracked. Do not commit them unasked. If the team should share them, suggest moving the folder under `docs/`.
- If the folder cannot be written in this environment, deliver the profile and the report in the conversation and say where to save them.

## Techniques

These found the highest-value issues in practice and work without installing anything.

**Trace what client code pulls in.** For each module marked as client-side, walk its import closure. A shared module becomes browser code the moment a client component imports it. Look for validation libraries, content or data registries, large JSON, and server utilities arriving this way. Typical case: a client component renders a shared image or content component, which imports a registry that validates itself with a schema library at load, so the library and the whole registry ship to every visitor. The fix is usually to resolve the data on the server and pass plain props.

**Attribute bundle weight.** From build output, list the scripts each page's HTML references, gzip each, and identify what is inside by searching for distinctive strings. Exclude scripts modern browsers never download (`nomodule` polyfills).

**Weigh the HTML document too.** Gzip each built page, split the markup from the framework's inline data payload, then strip suspected repeats (long inline styles, generated SVG, data URIs) and gzip again to see what each costs. Inline data in a shared layout is paid on every page, is never cached, and is often sent twice: once as markup and once in the payload.

**Audit the gates themselves.** A budget script that counts the wrong files, a threshold with no headroom or far too much, a check that passes when its target is missing: verify that existing guardrails measure what they claim.

**Import graph for dead code.** Build a file-level graph from entry points and list files nothing reaches. Then discard false positives before reporting:

- Files a framework finds by convention: routes, layouts, middleware, config files.
- Handlers registered by decorators (web routes, CLI commands, fixtures, signal handlers).
- Content read from disk at runtime (Markdown, MDX, JSON, templates).
- Dynamic imports built from strings, dependency injection, reflection, public package exports.
- Code referenced only by scripts or CI.

Report "used only by tests" as its own category: that is either a deliberately exported test seam or dead code whose test should go with it. Ask rather than assume.

**Hot path or cold path.** A database call inside a loop, a long function or a slow query matters in proportion to how often it runs. Find the callers first. A one-off migration that updates rows one at a time is a P3; the same pattern in a request handler is a P1.

**Cross-check before reporting.** Search the whole repo (source, scripts, docs, CI) for each name you are about to call unused, and re-read each cited line, including lines cited by a reviewer you delegated to. Where build output exists, confirm claims about rendered pages (metadata tags, headings, links) in the built HTML, not from source alone. Before filing issues, search the tracker for an existing one, and if the repository is public, keep the steps to abuse a weakness out of the issue text.

## Areas

### A. Frontend runtime performance

- Core Web Vitals on the main templates (home, a content page, the heaviest interactive page).
- JavaScript sent to the browser: client components that could render on the server, client boundaries placed high in the tree, providers in the root layout that load a library on every page, heavy libraries (3D, animation, charts, editors, maps) loaded eagerly. Check whether a library with a reduced-bundle mode is using it.
- Largest Contentful Paint element: present in the HTML, sized, prioritized, modern format.
- Layout shift: images, embeds and fonts without reserved space.
- Fonts: self-hosted or framework-optimized, subsetted, few weights.
- Third-party scripts: each justified, loaded late, or removed.
- Interaction cost: long tasks, expensive re-renders, unvirtualized long lists, fetch waterfalls. Check whether the React Compiler is enabled before suggesting manual memoization.
- Canvas and WebGL: resources disposed on unmount, loop paused off screen, lower quality on weak devices.
- Caching: static where possible, correct cache headers.

### B. Backend performance (Node and Python)

- Database: N+1 queries, missing indexes for filters and sorts, unanchored or case-insensitive pattern searches that scan the collection or table, count queries repeated on every page request, unbounded result sets, no connection pooling.
- Blocking work on the request path: synchronous file, network or crypto calls in Node; blocking libraries called directly inside async Python handlers.
- Sequential awaits that could run concurrently; per-row writes that could be batched.
- Missing caching, pagination, timeouts or retries; oversized payloads; serverless cold-start weight.

### C. Dependencies and bundle

- Unused dependencies; build-only packages listed as runtime dependencies.
- A whole library imported for one small use.
- Duplicate versions; two libraries doing one job.
- Heavy packages replaceable by a platform API.
- Server-only code reaching client bundles; barrel files that defeat tree shaking.
- Known vulnerabilities; unmaintained packages; unpinned versions.

### D. Dead and duplicated code

- Unused files, exports, components, hooks, routes, flags, env vars, CSS.
- Features that were replaced but whose old implementation, docs and comments remain.
- Copy-pasted logic: validation, data fetching, formatting, metadata builders.
- Wrappers with a single caller that add nothing.

Consolidate duplication only when the copies change for the same reason. Three real copies is a reasonable threshold. Shared helpers left inside a dead feature's folder should move before the folder is deleted.

### E. Architecture and maintainability

- Separation of UI, domain logic and data access; server and client modules not mixed.
- Circular dependencies; modules everything imports; functions and files too long or too branchy to review. Report the worst few with line counts, not every one.
- Configuration and environment access centralized and validated at startup.
- Type safety: `any`, suppressed errors, non-strict settings; missing type checks on core Python modules.
- Several patterns for the same job.

Recommend new layers only where a concrete, current problem justifies them.

### F. Technical SEO and machine readability

Only what is verifiable in code and rendered output:

- Unique title and description per page, canonical URLs, correct status codes, no accidental `noindex`.
- Primary content and links in server-rendered HTML; links are real anchors.
- Sitemap and robots file accurate; crawlers not blocked by hosting rules.
- Structured data valid and matching visible content.
- Social preview metadata; `hreflang` if multilingual; alt text; heading order.

Search engines' AI features draw on the same foundations: indexable pages, crawlable structure, useful original content. No special AI-only file or markup is required, so treat `llms.txt` and similar as optional.

Content strategy, keyword research, link building, brand authority and AI-visibility tracking are not code optimization. Note them as out of scope and hand off to a dedicated SEO skill if one is available.

### G. Accessibility and UX robustness

Target WCAG 2.2 AA. Automated checks catch only part of it, so also review: keyboard reachability and visible focus, focus management in dialogs and menus, form labels and errors, contrast, touch target size, reduced-motion support, alt text, landmarks and headings, narrow widths and 200% zoom.

### H. Security and reliability

- Secrets in the repo, in image layers through build arguments, in URLs and query strings, or exposed to the browser through public env prefixes. A token compiled into client code protects nothing once the UI is reachable.
- Authentication and authorization on every server entry point, not only in the UI.
- Input validated at the boundary with a schema; output encoded; no unsanitized HTML injection.
- Security headers and a content security policy; CSRF protection where cookies authenticate; rate limiting on public forms; signed tokens that expire and cannot be replayed.
- Requests to user-supplied URLs restricted.
- Error boundaries and fallbacks; logs without personal data.

If the product's data collection or outreach may conflict with a platform's terms or with privacy or anti-spam law, flag it once as a risk for the owner to review. State the specific rule and where the code touches it. Do not give legal conclusions.

### I. Tests, CI and delivery

- Critical journeys covered end to end; shared logic unit-tested; flaky or skipped tests.
- CI: caching, parallel independent jobs, no duplicate builds, runtime versions pinned and matching production.
- Preview deployments, environment validation, rollback path, production monitoring.

### Optional: growth instrumentation

Only when asked: key events fire once, forms ask for no more than needed, consent gates analytics.

## Measurement

| What | Preferred | Fallback when tools cannot run | Target |
| --- | --- | --- | --- |
| Core Web Vitals | Field data (Search Console, real-user monitoring) | Lighthouse or the project's own throttled test on a production build, labeled lab data | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile |
| Client JavaScript per page | The project's budget script or the framework's analyzer | Gzip the scripts referenced by built HTML | Budget from baseline; flag heaviest pages |
| Unused code and deps | `knip`; Python: `vulture`, `ruff --select F401,F841`, `deptry` | Import-graph script plus repo-wide search | Zero confirmed unused |
| Duplication | `jscpd` | Targeted search for repeated logic | Fix top clusters |
| Circular deps | `madge --circular` | Import-graph script | Zero |
| Types | The project's typecheck script | An alternate build of the compiler already installed | Zero errors; few suppressions |
| Complexity | Linter complexity rule; `ruff --select C901`, `radon` | Syntax-tree script counting lines and branches per function | Flag outliers only |
| Vulnerabilities | `npm audit --omit=dev`, `pip-audit` | Not measurable offline; say so | No high or critical in production deps |
| Accessibility | The project's axe tests, or `@axe-core/cli` | Manual code review, labeled as such | Zero serious violations |
| Tests and CI | Per-step durations of a recent green run from the CI provider, ranked by share of the run | Read the workflow files | Report baseline; flag a step over 10% that guards something most changes do not touch |
| Source size | Lines of production source, excluding tests, generated files and build output | Same | Report only |

Lab scores are for debugging; field data decides whether users have a good experience. Interaction responsiveness barely shows in lab runs.

## Report format

One report per app or repo:

```
# Optimization audit: <project>
Branch <name> · commit <sha> · <date> · uncommitted changes: <none | n files> · Scope: <full | areas>

## Summary
Three to five sentences: overall state, the biggest wins available, anything urgent.

## Stack
Framework and versions, rendering model, data layer, hosting.

## Already in place
Gates, budgets and practices the project has. Keep to one short list.

## Baseline
| Metric | Value | How measured (run / existing artifact, age / static) |

## Findings
| ID | Area | Finding | Evidence | Impact | Effort | Risk | Priority |

## Plan
Ordered: quick wins first, then larger items, each with the metric it should move.

## Not verified
What could not be run or measured, why, and what access would allow it.

## Guardrails
Checks to add or fix so the gains hold.
```

After fixes, add a before/after table with the same metrics and a list of anything reverted.

### What a good finding looks like

Good: "`components/home/ProcessStepper.tsx` is a client component that renders `ui/Photo.tsx`, which imports `content/photos.ts`. That module parses the photo registry with a schema library at load, so the library (31.9 KB gzipped) and the full registry ship on the home page. Resolve the photo on the server and pass plain props. Expected: about 11% less initial JavaScript on that page. Verify with the bundle budget script. Effort S, risk low."

Good: "The bundle budget script counts the `nomodule` polyfill (38.7 KB gzipped) that modern browsers never download, so every page is reported about 39 KB heavier than it is and the 340 KB budget is looser than intended. Skip `nomodule` scripts, then lower the budget to match."

Weak: "Consider optimizing images and reducing bundle size." No file, no number, no fix, no way to verify.

Keep the findings table to about fifteen rows at most. Summarize the long tail in a sentence.

## Common mistakes

- Reporting a baseline that was never run, or trusting stale build output.
- Deleting code a static check calls unused when a framework convention, decorator or dynamic import reaches it.
- Treating a documented, accepted trade-off as a new finding.
- Flagging a database call in a loop without checking how often the loop runs.
- Wrapping everything in memoization without a profile showing a problem.
- Merging similar-looking code into one abstraction with flags.
- Chasing a lab score while field data is fine, or the reverse.
- Recommending a rewrite or a new tool when an existing one can be strengthened.
- Reporting generic best practices the repo already follows.
- Using invented abbreviations. Name things in plain words.
