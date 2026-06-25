# DevAnvil Workflow Model

**Version:** 1.1  
**Status:** Canonical operational specification (pre-implementation)  
**Revision:** Capture precedes Architect — passive Architectural Intake deprecated, not capture itself

Product philosophy: [Cognitive Interface](./devanvil-cognitive-interface.md) — Mental Model as the Bloom of architecture.

---

## Purpose

DevAnvil has strong architecture: Constitution, Ontology, Method, Protected Domains, Records, Forge, Memory.

What it lacked was **workflow** — an accurate model of how a builder actually spends a day shipping StudioOps.

This document defines:

1. **Capture** — frictionless preservation of reality (universal entry)
2. **Four execution modes** — Architect, Audit, Bug, Forge (interpretation and execution)
3. How they connect without forcing higher-order thinking at the moment of inspiration

The [Governance Pipeline](./devanvil-execution-model.md) (14 internal states) still applies **inside** Audit and Forge when protected domains are touched.

---

## Guiding Principles

### Reduce cognitive load — but not at capture time

> DevAnvil exists to reduce cognitive load between having an idea and shipping great software.

That reduction happens **after** capture — not during it.

### Ideas happen faster than architecture

```
Ideas          happen faster than → Architecture
Architecture   happens faster than → Implementation
Implementation happens faster than → Reflection
```

**Do not force higher-order thinking during capture.**

Preserve reality first. Interpret it later.

### Signal symmetry

StudioOps taught the correct pattern:

```
StudioOps:  Capture → Ground → Enrich → Bloom
DevAnvil:   Capture → Understand → Architect → Forge → Evidence → Memory
```

Capture is frictionless. Interpretation is deliberate.

---

## Canonical Workflow

```
Capture
  ↓
Understand          (optional triage: what kind of thinking is this?)
  ↓
Architect | Bug | Audit | Research    (interpretation modes)
  ↓
Initiative | Work Item | Polish Initiative
  ↓
Forge
  ↓
Evidence
  ↓
Memory
```

**Capture precedes every other workflow.**

Architect **consumes** Capture. Architect does **not** replace Capture.

---

## What Is Deprecated

| Deprecated | Replacement | Why |
|------------|-------------|-----|
| **Passive Architectural Intake** | Capture + Architect (separate) | Stored paragraph, echoed input, generic work items — neither good capture nor good architecture |
| Routing ideas directly to Architect on input | Capture first, Architect later | Forces architecture during inspiration |
| Generic "Architectural Intake" as default UX | Inbox + Capture | Conflates preservation with reasoning |

**NOT deprecated:**

- Capture itself
- `POST /api/dev-intake` (becomes Capture API)
- iOS Shortcuts / Share Sheet capture
- Fast text entry
- Storing incomplete thoughts

---

## Document Map

| Document | Answers |
|----------|---------|
| [Constitution](./devanvil-constitution.md) | Why we decide this way |
| [Ontology](./devanvil-ontology.md) | What objects exist |
| [Architectural Method](./devanvil-architectural-method.md) | How architects think |
| **Workflow Model** (this document) | Capture + daily execution modes |
| [Execution Model](./devanvil-execution-model.md) | Internal governance pipeline |
| [mcp.md](./mcp.md) | MCP tool contracts |

---

## Capture

### Purpose

**Preserve reality. Nothing more.**

> "Don't lose the thought."

Capture is **passive preservation**. It is intentionally dumb.

Architect is **active reasoning**. They must never be conflated.

### Behavior

Capture **accepts:**

- Incomplete thoughts
- Voice memos
- Screenshots
- Pasted code
- Links
- Text
- Sketches (future)

Capture **never requires:**

- Domains
- Initiatives
- Priorities
- Categories
- Implementation planning
- Work item generation
- Mode selection (Architect vs Bug vs Audit)

### State machine

```
┌──────────┐
│ Receive  │  Text, voice, link, image — any source
└────┬─────┘
     ▼
┌──────────┐
│ Store    │  Persist raw capture + metadata (source, timestamp)
└────┬─────┘
     ▼
┌──────────┐
│ Inbox    │  Visible in holding area — status: captured
└──────────┘
```

**Terminal state:** `captured` — waiting in Inbox.

**No analysis. No echo. No work items.**

### Output contract: `CaptureResult`

```typescript
type CaptureResult = {
  captureId: string;
  projectSlug: string;
  status: "captured";

  rawText: string;
  sourceType: "text" | "voice" | "link" | "note" | "manual";
  url?: string;
  metadata?: Record<string, unknown>;

  createdAt: string;

  // explicitly absent — Capture does not produce these:
  intent?: never;
  domains?: never;
  workItems?: never;
  analysis?: never;
};
```

### Implementation mapping (today)

| Spec concept | Current code | Action |
|--------------|--------------|--------|
| Capture API | `POST /api/dev-intake` | Rename conceptually; stop auto-classifying into work items on capture |
| Capture storage | `DevItem` with `status: captured` | Evolve to `Capture` entity OR `DevItem` as capture-only until promoted |
| iOS Shortcuts | `src/lib/shortcuts/workflow.ts` | Already correct — frictionless capture |
| Inbox | Queue / backlog views | Evolve into dedicated Inbox |

### MCP interactions (Capture)

| Tool | When |
|------|------|
| `devanvil.create_item` | **Capture only** — raw store, no architect analysis, no auto work-item promotion |

`create_item` must not trigger Architect analysis or Forge prompts.

---

## Inbox

The Inbox is the builder's **architectural holding area**.

Every capture lands here first. Nothing is lost.

### Inbox actions (later — during planning)

From any inbox item, the user explicitly chooses:

| Action | Destination |
|--------|-------------|
| **Architect** | Open Architect session consuming this capture |
| **Bug** | Fast bug workflow |
| **Audit** | Scope an audit from this observation |
| **Research** | Reference material — no execution |
| **Reference** | Link to existing initiative or domain |
| **Merge** | Combine with existing capture or initiative |
| **Discard** | Archive |

Capture itself performs **none** of these automatically.

---

## Understand (Triage)

Optional lightweight step between Capture and execution modes.

When the user opens the Inbox (not when capturing), DevAnvil may **suggest** — never require — a mode:

> "This looks like it might need Architect review."

> "This sounds like a known bug."

Suggestions only. User confirms.

**Understand does not replace Architect.** It routes captured reality to the right interpreter.

---

## Four Execution Modes

These are **interpretation and execution** modes. They are not the front door.

| Mode | Cognitive intent | Question answered |
|------|------------------|-------------------|
| **Architect** | Discover | What am I actually trying to build? |
| **Audit** | Evaluate | How does reality compare to architecture? |
| **Bug** | Repair | What exactly is broken? |
| **Forge** | Build | How do I implement what is already decided? |

```
Architect discovers.
Audit evaluates.
Bug repairs.
Forge builds.
```

Capture is not a fifth mode. Capture is the **universal prefix**.

---

## Mode Router

**Critical rule:** Mode router runs on **Inbox triage**, not on initial capture.

### At capture time

**Always → Capture.** No exceptions. No classification. No mode detection.

### At triage time (Inbox or explicit command)

| Trigger | Mode |
|---------|------|
| User selects "Architect" on inbox item | Architect (consumes `captureId`) |
| User selects "Bug" | Bug |
| User selects "Audit" | Audit |
| `/architect`, `/audit`, `/bug`, `/forge` | Explicit mode |
| Understand suggestion + user confirms | Suggested mode |

### Automatic routing signals (triage only — never at capture)

| Input pattern | Suggested mode |
|---------------|----------------|
| Idea, vision, new concept, strategic redesign | Architect |
| Audit, review, inventory, beta readiness | Audit |
| Known defect, flash, jitter, regression | Bug |
| Build, forge pick, approved work item | Forge |

### Legacy command migration

| Deprecated | New behavior |
|------------|--------------|
| `/architectural-intake` | `/capture` for raw store; `/architect` for analysis |
| Passive workflow on idea submit | Capture only |
| `/change-classify` | Bug or Audit (at triage) |
| `/investigate` | Bug or Audit |
| `/ship` | Forge |
| `/investment` (personal) | Capture → Architect or Investment entity |

---

## Mode 1 — Architect

### Intent

"I want to **understand** what this captured idea means."

### When to use

- After capture, during planning
- New product concepts needing interpretation
- Strategic evolution
- Domain discovery (e.g. Creative Investments)
- Initiative shaping

### When NOT to use

- At the moment of inspiration (→ Capture)
- Known bugs (→ Bug)
- Subsystem quality review (→ Audit)
- Approved work ready to code (→ Forge)

### Inputs

Architect **reads**:

- Capture record (`captureId`)
- Architectural Memory
- Protected / Architectural Domains
- Intent (when exists)
- Existing Initiatives
- Contracts, Catalogs, Records

### State machine

```
┌─────────────┐
│ Load Capture│  Raw thought — Architect interprets, never echoes
└──────┬──────┘
       ▼
┌─────────────┐
│ Analyze     │  Intent, problem, concepts, domains, memory
└──────┬──────┘
       ▼
┌─────────────┐
│ Converse    │  Clarifying questions
└──────┬──────┘
       ▼
┌─────────────┐
│ Classify    │  feature | initiative | architectural_evolution |
│ Outcome     │  capability | research
└──────┬──────┘
       ▼
┌─────────────┐
│ Propose     │  Initiative, epics, questions, non-goals
└──────┬──────┘
       ▼
Terminal: Create Initiative | Continue Architecting | Discard
```

**Forbidden:** Architect → Work Item (direct), Architect → Forge, Architect without a Capture source (except explicit scratch architecting).

### Output contract: `ArchitectResult`

```typescript
type ArchitectResult = {
  mode: "architect";
  sessionId: string;
  captureId: string; // required — Architect consumes Capture
  status: "active" | "initiative_created" | "discarded";

  intent: string;
  problemStatement: string;
  successCriteria: string[];
  nonGoals: string[];

  outcomeClassification:
    | "feature"
    | "initiative"
    | "architectural_evolution"
    | "capability"
    | "research";

  potentialConcepts: {
    name: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
  }[];

  architecturalQuestions: string[];
  affectedProductDomains: string[];
  affectedProtectedDomains: ProtectedDomainRef[];
  architecturalRisks: string[];

  suggestedInitiative: {
    title: string;
    description: string;
    strategicValue: StrategicValue;
  };
  suggestedEpics: string[];
  suggestedWorkItems: never;

  relatedMemory: MemoryHit[];
  relatedInitiatives: InitiativeRef[];
  relatedRecords: RecordRef[];

  recommendation: string;
  architectMessage: string;
};
```

### StudioOps example (Creative Investments)

**Step 1 — Capture** (while coding, zero friction):

```
"Artists need Creative Investments."
```

→ Stored in Inbox. Done. Back to code.

**Step 2 — Architect** (later, during planning):

Architect reads capture + memory + domains and produces:

- **Intent:** Help artists intentionally build creative capability over years
- **Concept:** Creative Investments (high confidence) — new object, not a feature
- **Initiative:** Creative Investments
- **Epics:** Investment Model, Capture Experience, Reflection, Momentum Integration, Memory Integration
- **Questions:** Should investments affect Momentum? Create projects?

**Not:** repeating the user's paragraph. **Not:** generic "Research:" work items.

---

## Mode 2 — Audit

### Intent

"I have an existing subsystem. How good is it?"

### Entry

- Explicit `/audit`
- Inbox item triaged to Audit
- Capture describing subsystem quality (e.g. "Audit Bloom hover states")

### Output

Polish Initiative with themed epics — not 50 individual bugs.

*(Full state machine unchanged from v1.0 — see Audit section in git history.)*

---

## Mode 3 — Bug

### Intent

"I know exactly what's wrong."

### Entry

- Explicit `/bug`
- Inbox item triaged to Bug
- Capture with clear symptom (e.g. "Bloom atoms flash on mount")

### Output

Single work item + acceptance criteria + Forge prompt. Minimal ceremony.

*(Full state machine unchanged from v1.0.)*

---

## Mode 4 — Forge

### Intent

"I know what to build."

Forge executes architecture. It never invents it.

*(Full state machine unchanged from v1.0.)*

---

## Cross-Mode Transitions

```
Capture ─────────────────────────────────────────► Inbox
                                                    │
         ┌──────────────────────────────────────────┼──────────────────────┐
         ▼                    ▼                    ▼                      ▼
    Architect               Bug                 Audit                 Research
         │                    │                    │
         ▼                    ▼                    ▼
    Initiative            Work Item         Polish Initiative
         │                    │                    │
         └────────────┬───────┴────────────────────┘
                      ▼
                   Forge ──Ship──► Evidence ──► Memory
```

| From | To | Trigger | Artifact |
|------|-----|---------|----------|
| Capture | Inbox | Automatic | `Capture` record |
| Inbox | Architect | User selects | `ArchitectSession` linked to `captureId` |
| Inbox | Bug | User selects | `BugSession` → `DevItem` |
| Inbox | Audit | User selects | `AuditSession` |
| Architect | Initiative | Create Initiative | `Initiative` (proposed) |
| Audit | Initiative | Create Polish Initiative | `Initiative` + themed epics |
| Bug | Work Item | Accept | `DevItem` (approved) |
| Work Item | Forge | Open in Forge | Forge session |
| Forge | Shipped | Gates + ship | Evidence |

**No automatic promotion from Capture to any mode.**

---

## Slash Commands

| Command | Behavior |
|---------|----------|
| `/capture` | Frictionless store → Inbox. **Default for workspace input.** |
| `/architect` | Start Architect on capture or freeform (prefer captureId) |
| `/audit` | Start audit session |
| `/bug` | Fast bug workflow |
| `/forge` | Enter forge on work item |

Aliases: `/architectural-intake` → `/capture` (store only, deprecated name)

Natural language in the **capture box** → always Capture.

Mode commands require explicit slash or Inbox triage.

---

## Data Model (Implementation Contract)

```typescript
type Capture = {
  id: string;
  projectId: string;
  rawText: string;
  sourceType: SourceType;
  status: "captured" | "archived" | "discarded";
  promotedTo?: "architect" | "bug" | "audit" | "research";
  sessionId?: string; // link to mode session when promoted
  createdAt: string;
};

type WorkflowMode = "architect" | "audit" | "bug" | "forge";

type WorkflowSession = {
  id: string;
  projectId: string;
  mode: WorkflowMode;
  captureId: string; // required for architect; recommended for all
  status: string;
  messagesJson: Message[];
  resultJson: ArchitectResult | AuditResult | BugResult | ForgeResult;
  initiativeId?: string;
  workItemId?: string;
  createdAt: string;
  updatedAt: string;
};
```

**Migration:**

- `ArchitectSession` → gains required `captureId`
- `ArchitecturalIntake` (passive) → deprecated
- `processIntake` auto-work-item creation → split: capture-only path vs promote path
- Workspace default submit → `/api/capture` not `/api/architect`

---

## Workspace UX Direction (Deferred)

### Primary surface: Capture

```
What did you notice?

[ Capture anything... ]                    ⌘↵ Capture

Inbox (12)    Architect (2 active)    Forge (1 in build)
```

Fast. Signal-like. No mode selection at capture time.

### Secondary surfaces

- **Inbox** — triage captured ideas
- **Architect** — deep analysis of selected capture
- **Audit / Bug / Forge** — explicit entry or from Inbox

**Do not** present four mode choices as the first thing users see when inspiration strikes.

Present **Capture** first. Modes are for later.

---

## Implementation Phases

### Phase 1 — Specification

- [x] Capture as universal entry (v1.1)
- [x] Architect consumes Capture
- [x] Passive intake deprecated
- [x] Four execution modes defined
- [x] Signal symmetry documented

### Phase 2 — Capture + Inbox

- [x] `Capture` entity (DevItem with `isCapture` semantics)
- [x] `POST /api/capture` — store only, no classification side effects
- [x] Inbox UI
- [x] Workspace routes to Capture, not Architect
- [x] `processIntake` decoupled from default capture path (`processCapture`)

### Phase 3 — Architect consumes Capture

- [x] `ArchitectSession.captureId` on promoted sessions
- [x] Architect opens from Inbox item
- [x] Remove direct idea → Architect routing (default submit → Capture)

### Phase 4 — Bug + Audit modes

- [x] Bug promotion from Inbox → focused work item with acceptance criteria
- [x] Audit promotion from Inbox → audit session with scope and polish themes
- [x] Research promotion for trivial reference captures
- [x] Capture provenance on promoted artifacts (`sourceCaptureId`, `captureId`)

### Phase 5 — Forge UI integration

### Phase 6 — Full StudioOps Beta validation

---

## Success Criteria

### Capture friction test

While coding StudioOps, the builder can:

1. Hit a keyboard shortcut
2. Type `"Bloom hover needs another state"`
3. Press Enter
4. Return to code in under 5 seconds

No domains. No initiatives. No mode selection.

### Architect value test

Later, opening Creative Investments capture in Architect produces:

- Clear intent (not echoed paragraph)
- "Creative Investments" as high-confidence concept
- Initiative + epics + questions
- User thinks: *"DevAnvil helped me understand what I want."*

### Full-day test

| Moment | Workflow |
|--------|----------|
| Flash of idea while coding | Capture |
| Planning session | Architect (from Inbox) |
| Bloom polish planning | Audit |
| Known hover bug | Bug (from capture or direct) |
| Implement approved work | Forge |

The builder never chooses a mode at inspiration time.

---

## Relationship to Governance Pipeline

| Stage | Governance pipeline depth |
|-------|----------------------------|
| Capture | None |
| Understand (triage) | None |
| Architect | Analysis only (states 2–4) |
| Audit | Inventory + compare (states 3–4) |
| Bug | Domain detect; gates at Forge |
| Forge | Full pipeline when protected |

---

## Authority

When this document conflicts with implementation: **this document wins** for workflow behavior.

When this document conflicts with [Ontology](./devanvil-ontology.md): **Ontology wins**.

When Ontology conflicts with [Constitution](./devanvil-constitution.md): **Constitution wins**.

---

*Workflow Model v1.1 — preserve reality first, interpret it later.*
