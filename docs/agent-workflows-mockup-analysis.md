# Agent Workflows (Discover) — Mockup Analysis

Source: `Finance AI Assistant UI/src/app/components/KnowledgeGraphsPage.tsx`, entered from
`DiscoverPage.tsx` (Section 4 card, "Agent Workflows — Deep agent research pipelines"),
handed off to chat by `App.tsx:517`. Analysis only — no implementation proposed.

## 1. Intent

Package multi-step research that a user would otherwise have to prompt their way through
into a **named, pre-built pipeline they press Run on**. Three product bets are visible in
the mockup:

- **Discoverability.** A blank chat box hides what the assistant can do. Six named
  workflows with categories, taglines and visible step lists advertise capability without
  the user having to know the vocabulary.
- **Legibility of the agent's work.** The runner shows every step, its description, a live
  progress bar, and a per-step output sample on completion. The wait is the pitch: the user
  is meant to watch reasoning accumulate, not stare at a spinner.
- **Chat is still the destination.** The workflow ends in "Open Full Report in Chat", which
  drops a Markdown report into the chat thread. The workflow is an *entry ramp* to the
  assistant, not a separate product surface.

Note the naming drift: the file, component and route are `KnowledgeGraphs*`, everything
user-facing says "Agent Workflows". No knowledge graph is shown anywhere.

## 2. User journey

1. Discover tab → tap the **Agent Workflows** card (cyan/Brain, 4th of 6 sections).
2. **List view** — back header, a blue explainer panel ("Agentic Research Pipelines"), then
   six workflow cards in a single flat scroll.
3. Tap a card (anywhere, or the Run button — both do the same thing) → **runner overlay**
   slides over the app, full-height minus the bottom nav.
4. Runner opens **idle**: steps greyed out, a bottom CTA "Run <name>" with
   "~4 min estimated · 7 agent steps".
5. Press Run → steps execute strictly in sequence. Each: spinner + progress bar → green
   check, dimmed text turns dark, a green output-sample chip appears. Header progress bar
   and an `n/N` counter track completion.
6. All steps complete → "Workflow Complete" panel → **Open Full Report in Chat**.
7. The overlay closes, the app switches to the chat tab, and the report appears as an
   assistant message.

The six workflows: Top Down Research (Equity Research, ~4 min, 7 steps), Earnings Catalyst
Scanner (Event Driven, ~3 min, 6), Value Deep Dive (Fundamental, ~5 min, 6), Sector
Rotation Tracker (Macro Strategy, ~2.5 min, 4), Red Flag Detector (Risk Analysis, ~3.5 min,
5), Smallcap Alpha Hunt (Alpha Generation, ~4.5 min, 6).

## 3. Visible components

**Entry card (Discover)** — icon tile, title, one-line subtitle, arrow affordance, gradient
hover strip. Structurally identical to its five siblings.

**List view**
- Back header: title + "Deep agent research pipelines".
- Explainer panel — one paragraph, always present, not dismissible.
- `GraphCard` per workflow: gradient top rule; **Category** badge; **Complexity** badge
  (Basic / Advanced / Expert — only Advanced and Expert are used); name; tagline; every step
  label as a numbered pill; footer with estimated time, step count, and a Run button.

**Runner overlay** (`GraphRunnerOverlay`, fixed, `z-50`, `bottom-[4.5rem]`, `max-w-md`)
- Dark gradient header: back, category + name, **Reset** (visible only while running or
  after completion), progress bar, `completed/total`.
- `StepNode` timeline: connector rail that greens as it completes; icon → spinner → check;
  step label + zero-padded index; description; progress bar while running; green
  monospace **output sample** on completion.
- Completion panel: check badge, "All N agent steps executed successfully", primary CTA.
- Idle footer: Run CTA + time/step estimate.

**Data shape already implied.** `KnowledgeGraph { id, name, tagline, category, complexity,
estimatedTime, steps[], chatOutput }` and `WorkflowStep { id, label, description, icon,
duration, outputSample }`. That is a usable first cut at a workflow definition, with two
mock-only fields — `duration` drives the fake timer, and `chatOutput` is a hard-coded
Markdown report per workflow.

## 4. Implied interactions (asserted by the mockup, not yet real)

- Steps run **strictly sequentially**, one at a time, in a fixed order. No fan-out, no
  conditional branch, no skipped step.
- A step **always succeeds**; there is no failure, retry, partial-result or empty-result
  state anywhere in the component.
- The run is **non-interactive** once started — no pause, no cancel (back closes the overlay
  and silently abandons the run), and the user is never asked a question mid-flight.
- **Reset** wipes progress and returns to idle; nothing is preserved.
- Per-step output samples are **previews**; the full answer is a single Markdown report at
  the end.
- The chat hand-off **replaces the entire thread** (`setMessages([...])`) with one assistant
  message. The report appears with no preceding user message — nothing records *what was
  asked*.
- Workflows take **no parameters**. Red Flag Detector is a per-company forensic scan but the
  mockup runs it against "[Hypothetical mid-cap company]" because there is nowhere to name
  one.
- Progress is **time-based fiction**: hard-coded per-step durations, a bar that stalls at 94%
  until the timer fires, `Math.random()` jitter for texture.

## 5. Missing product decisions

**Input and targeting**
- Do workflows take parameters at all (ticker, sector, universe, horizon, capital)? Red Flag
  Detector and arguably Value Deep Dive are meaningless without one. If yes: where does the
  form live — before the runner, or as a first step?
- Is any of this personalised to the user's holdings, watchlist, or risk profile — all of
  which exist elsewhere in this app?

**Run semantics**
- What happens on a real failure, a timeout, or a step returning nothing? No state exists
  for it, and "all steps succeeded" is currently structural.
- Can a run be cancelled, and does back-navigating kill it or leave it running?
- Are runs **backgrounded**? Four to five minutes on mobile means backgrounding, app kill,
  and notification-on-completion are near-certain requirements — none are designed.
- Is a completed run **persisted**? Can the user revisit it, re-run it, compare two runs, or
  share/export the report? The Discover surface has no history of anything.
- Are results **cached or scheduled**? A sector rotation pipeline is market-wide and
  identical for every user; recomputing it per tap is a cost decision nobody has made.

**Cost and access**
- No pricing, credit, entitlement or rate-limit signal anywhere. "Expert / ~5 min" is the
  only cost cue and it is a *time* cue. Is a run free, metered, or plan-gated?

**Trust and provenance**
- Outputs contain hard prices, targets and a **SELL/AVOID** recommendation, with sources
  named only in prose ("FII flows", "earnings call transcripts"). No timestamps, no
  citations, no link back to the underlying tool call — even though the app has a
  `ToolCallsDisplay` component elsewhere. What is the provenance standard for a workflow
  report?
- What is the data freshness contract, and is a report still valid an hour later?
- Compliance: every mock output carries a "Not investment advice" footer, yet the surface
  delivers targets, stop-losses and position sizing. Whether this can ship as-is in India is
  a regulatory decision, not a design one.

**Chat integration**
- Replacing the whole thread is almost certainly wrong. Should the report append instead,
  open its own thread, or attach as a document?
- Can the user then **converse with the result** — "why HAL?", "redo this for midcaps"?
  Nothing in the mockup connects the report back to the agent that produced it.

**Catalogue**
- Fixed at six, defined in code. Can users create, edit, fork, favourite, or schedule a
  workflow? Are there more than six, and if so what is the browse/search/filter model — the
  list is flat and unfiltered despite every card carrying two badges that beg to be filters.
- What does **Complexity** mean to a user (cost? depth? risk? required expertise?)? It is
  presented as a property of the workflow but reads as a warning, and "Basic" is styled but
  never used.

**Naming**
- "Agent Workflows", "Knowledge Graphs", "pipelines", "agent steps" all describe the same
  thing across the code and the copy. One noun needs to win before this ships.
