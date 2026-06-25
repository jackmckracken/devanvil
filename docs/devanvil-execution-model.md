# DevAnvil Execution Model

**Version:** 1.0  
**Status:** Behavioral specification for DevAnvil — **Governance Pipeline**

> **Daily workflow** is defined in [devanvil-workflow-model.md](./devanvil-workflow-model.md):  
> **Capture** (universal entry) → **Understand** → **Architect | Audit | Bug** → **Forge** → **Evidence** → **Memory**.  
> This document defines the **internal governance pipeline** inside Audit and Forge when architectural rigor is required.

---

## Purpose

The [Constitution](./devanvil-constitution.md) defines **principles**.  
The [Ontology](./devanvil-ontology.md) defines the **conceptual model**.  
The [Architectural Method](./devanvil-architectural-method.md) defines how architects make decisions.  
The [Workflow Model](./devanvil-workflow-model.md) defines **Capture** as the universal entry and **how builders interpret and execute work** (Architect, Audit, Bug, Forge).  
The Execution Model defines **how DevAnvil enforces governance** on protected architectural change.

This document is not an implementation specification. It is the **behavioral specification** for governed execution inside DevAnvil.

The goal: every AI agent, Forge workflow, MCP tool, and future automation behaves consistently because they all execute the same architectural process when rigor is required.

The software may change. The execution model should remain recognizable across every future generation of DevAnvil.

---

## Core Principle

DevAnvil does not execute tasks.

DevAnvil executes **architectural reasoning** when building or auditing governed subsystems.

Implementation is only one stage of that reasoning.

Protected-domain work must move through the full pipeline below. Fast-path modes (Bug, simple Forge on advisory domains) may abbreviate — see [Workflow Model](./devanvil-workflow-model.md).

---

## The Canonical Governance Pipeline

Governance begins **after Capture**. A captured thought may never enter this pipeline. Once Forge or Audit touches a protected domain, the following states apply:

```
Request                    ← promoted capture or work item (not raw capture)
  ↓
Intent Resolution
  ↓
Domain Resolution
  ↓
Architectural Context
  ↓
Constitutional Evaluation
  ↓
Ontological Evaluation
  ↓
Invariant Evaluation
  ↓
Change Classification
  ↓
Planning
  ↓
Implementation
  ↓
Evidence Collection
  ↓
Memory Update
  ↓
Intent Verification
  ↓
Ship
```

**No step may be skipped for protected domains.**

---

## State 1 — Request

**Input** may originate from:

- Promoted Capture (after Architect, Bug, or Audit triage)
- Forge
- MCP
- Work item
- Regression
- Audit finding
- Runtime alert

**Not from:** raw Inbox capture — Capture does not enter the governance pipeline directly.

**Output:** Normalized architectural request — title, summary, source, project scope, linked Work Item or Capture ID if applicable.

**Behavior:** Triage classification may link to existing Work Items. Raw capture storage has already occurred upstream.

---

## State 2 — Intent Resolution

Determine: **Which Architectural Intent owns this request?**

If no Intent exists: **STOP.**

Recommend:

- existing Intent extension, or
- new Intent proposal

Never begin implementation without Intent.

**Output:** Resolved Intent (or halt with recommendation).

**Maps to:** [Method Step 1](./devanvil-architectural-method.md#step-1--understand-intent)

---

## State 3 — Domain Resolution

Locate:

- Primary Architectural Domain
- Secondary Domains
- Dependencies
- Protection level
- Ownership
- Required Records

**Output:** Domain resolution result — primary owner, intersections, governance posture.

**Maps to:** [Method Step 2](./devanvil-architectural-method.md#step-2--locate-the-domain)

---

## State 4 — Architectural Context

Automatically assemble:

- Intent
- Domain
- ADRs
- Contracts
- Catalog
- Golden Master
- Regression History
- Decision History
- Evidence (prior)
- Recent Changes
- Open Violations

The architect should never manually hunt for context. DevAnvil prepares it automatically.

**Output:** Architectural Context bundle (Intent Brief when formatted for agents).

**Maps to:** [Method Step 3](./devanvil-architectural-method.md#step-3--consult-the-record)

---

## State 5 — Constitutional Evaluation

Execute the [Constitutional Test](./devanvil-constitution.md#constitutional-test).

Questions:

1. Does this preserve intent?
2. Does this enable evolution?
3. Does this simplify architecture?
4. Does this reduce ambiguity?
5. Will future architects understand it?

**If failed:** Return for redesign. Do not proceed to Planning.

**Output:** `PASS` | `FAIL` with reasons.

**Maps to:** [Method Step 4](./devanvil-architectural-method.md#step-4--apply-the-constitution)

---

## State 6 — Ontological Evaluation

Execute the [Completeness Test](./devanvil-ontology.md#part-13--ontology-completeness-test).

Determine: Can this proposal be completely explained using the Ontology?

**If not:** Pause implementation. Recommend Ontology evolution or proposal refinement.

**Output:** `PASS` | `FAIL` with mapping gaps.

**Maps to:** [Method Step 5](./devanvil-architectural-method.md#step-5--apply-the-ontology)

---

## State 7 — Invariant Evaluation

Identify every [Ontological Invariant](./devanvil-ontology.md#part-15--ontological-invariants) touched.

Classify each:

| Status | Meaning |
|--------|---------|
| **Safe** | Invariant respected |
| **Warning** | Edge case; document acknowledgement |
| **Violation** | Must not proceed without revision |

Protected domains require explicit acknowledgement before proceeding past Warning.

**Output:** Invariant evaluation report.

**Maps to:** [Method Step 6](./devanvil-architectural-method.md#step-6--verify-invariants)

---

## State 8 — Change Classification

Determine category. Classification determines required approval level.

| Category | Approval rigor |
|----------|----------------|
| Documentation | Fast Path eligible |
| Bug Fix | Domain owner; standard gates |
| Behavior Fix | Contract review; tests required |
| Visual Adjustment | Visual contract + golden master |
| Catalog Extension | Catalog + golden master + tests |
| Contract Extension | Contract + inventory + tests |
| Runtime Extension | Full protected pipeline |
| New Domain | Intent + Domain + Records + governance |
| Intent Evolution | Intent version + ADR + downstream updates |
| Ontology Evolution | Ontology revision + acceptance |
| Constitutional Evolution | Constitution revision + alignment |

**Output:** Change type recorded on Work Item or Domain Change.

**Maps to:** [Method Step 7](./devanvil-architectural-method.md#step-7--determine-the-change-type)

---

## State 9 — Planning

**Only now** does Forge generate implementation guidance.

Planning must include:

- Affected Domains
- Affected Records
- Expected Evidence
- Regression risks
- Required gates
- Success criteria
- Implementation plan

Implementation begins only after architectural planning.

**Output:** Approved plan document. `/forge_review` verdict PASS required before State 10.

**Maps to:** `/forge_plan`, `/forge_review` in Forge workflow.

---

## State 10 — Implementation

Execute within the architectural boundaries established in States 1–9.

Agents remain inside Domain scope, Extension Points, and Intent promises.

Implementation should **never redefine architecture**.

**Output:** Code, configuration, or product change in target repo.

**Maps to:** `/forge_build`, [Method Step 8](./devanvil-architectural-method.md#step-8--produce-evidence) (partial).

---

## State 11 — Evidence Collection

Automatically collect and attach:

- Tests
- Screenshots
- Runtime proof
- Golden master diff
- Inventory snapshots
- Benchmarks
- Regression results
- Coverage
- Commits
- Branches
- Pull requests

Evidence is attached to the change — not manually referenced in prose alone.

**Output:** Evidence objects linked to Work Item.

**Maps to:** [Ontology — Evidence](./devanvil-ontology.md#part-2--evidence-replacing-build), `/forge_audit`.

---

## State 12 — Memory Update

Ask: **Did architectural knowledge change?**

If yes, update sources:

- Intent (only through Intent Evolution)
- Records
- Contracts
- Catalog
- Golden Master
- ADR
- Regression Log
- Decision History

Memory is emergent — update **sources**, not a Memory store.

**Output:** Versioned Records; Intent evolution documented if applicable.

**Maps to:** [Method Step 9](./devanvil-architectural-method.md#step-9--update-memory)

---

## State 13 — Intent Verification

The final question is never:

> "Did the code work?"

The final question is:

> **"Did implementation preserve the original Intent?"**

Not: Did tests pass?  
Not: Did code compile?

Instead: **Is the architecture still recognizable?**

**If not:** Reject the change. Return to State 10 or earlier.

**Output:** `INTENT_PRESERVED` | `INTENT_VIOLATED` with evidence.

**Maps to:** [Method Step 10](./devanvil-architectural-method.md#step-10--verify-intent-survived)

---

## State 14 — Ship

Work Item status → shipped. Build/Evidence archived. Activity logged.

Only reachable after Intent Verification passes and required gates satisfied.

**Output:** Shipped Work Item with complete execution trace.

**Maps to:** `/forge_ship`, `devanvil.update_item_status`

---

## Execution Modes

Not every request requires full rigor. Mode is selected at Request or Domain Resolution.

### Mode 1 — Fast Path

**Eligible when:**

- Documentation, minor copy, comments
- No protected domains touched
- Change classification: Documentation

**Behavior:** Abbreviated pipeline — Request → Domain Resolution (none) → Planning → Implementation → Ship. Constitutional and Ontological evaluation may be implicit pass.

---

### Mode 2 — Standard

**Eligible when:**

- Normal implementation
- Advisory or guarded domains at most
- Standard change types (Bug Fix, Behavior Fix, Catalog Extension)

**Behavior:** Full pipeline. All states execute. Some may pass automatically.

---

### Mode 3 — Protected

**Eligible when:**

- Touches protected Architectural Domains (`protection_level` ≥ protected)

**Behavior:** Full pipeline. **No skipped states.**

Requires:

- Constitution ✓
- Ontology ✓
- Method ✓
- Contracts loaded
- Catalog loaded
- Golden Master referenced
- Evidence collected
- Runtime verification

Explicit invariant acknowledgement required for Warnings.

---

### Mode 4 — Foundational

**Eligible when:**

- Changes Intent, Ontology, Constitution, or Execution Model

**Behavior:** Full pipeline plus explicit architectural review. Human acceptance required before Ship.

Change types: Intent Evolution, Ontology Evolution, Constitutional Evolution, New Domain.

---

## Execution Engine

The [Architectural Method](./devanvil-architectural-method.md) is **conceptual** — how architects think.

The Execution Model is **executable** — how DevAnvil behaves.

Every DevAnvil workflow should eventually become a state machine implementing these transitions:

| System | Role in engine |
|--------|----------------|
| **Forge** | States 9–14 (`plan` → `ship`) |
| **Protected Domains** | States 3–4, 7; Mode 3 enforcement |
| **MCP** | States 1–4, 11–14 (`detect`, `checklist`, `link_branch`) |
| **AI Planning** | States 4–9 (context + evaluation + plan) |
| **Audits** | States 11–13 |
| **Regression Analysis** | States 4, 11, 13 |
| **Future automations** | Same state machine |

---

## Observability

Every execution should produce a **trace**.

Example:

```
Intent              ✓
Domain              ✓ bloom-runtime
Records Loaded      8
Constitution        PASS
Ontology            PASS
Invariants          PASS
Change Type         Contract Extension
Mode                Protected
Planning            PASS
Implementation      ✓
Evidence            6 attached
Memory              Updated
Intent Verification PRESERVED
Ship                ✓
```

Architectural reasoning should become **observable** — not buried in chat logs or agent memory.

Traces attach to Work Items and Domain Changes. They are Evidence of the execution process itself.

---

## Method ↔ Execution Mapping

| Method Step | Execution State(s) |
|-------------|-------------------|
| — | 1 Request |
| 1 Understand Intent | 2 Intent Resolution |
| 2 Locate Domain | 3 Domain Resolution |
| 3 Consult Record | 4 Architectural Context |
| 4 Apply Constitution | 5 Constitutional Evaluation |
| 5 Apply Ontology | 6 Ontological Evaluation |
| 6 Verify Invariants | 7 Invariant Evaluation |
| 7 Change Type | 8 Change Classification |
| — | 9 Planning |
| 8 Produce Evidence | 10 Implementation, 11 Evidence Collection |
| 9 Update Memory | 12 Memory Update |
| 10 Verify Intent | 13 Intent Verification |
| — | 14 Ship |

The Method describes human-readable steps. The Execution Model describes machine-enforceable states.

---

## Long-Term Vision

Eventually DevAnvil should become an **autonomous architectural operating system**.

Engineers and AI should not remember every contract, ADR, or regression. DevAnvil should.

The platform continuously:

1. Loads architectural knowledge before work begins
2. Verifies implementation against architectural intent
3. Captures evidence automatically
4. Updates architectural memory (via source updates)
5. Preserves reasoning over time

Implementation becomes one phase in a much larger architectural execution engine.

---

## Relationship to the DevAnvil Stack

The complete stack:

```
Constitution              ← why
        ↓
Ontology                  ← what
        ↓
Architectural Method      ← how architects think
        ↓
Workflow Model            ← Capture + daily modes (Architect, Audit, Bug, Forge)
        ↓
Execution Model           ← governance pipeline (this document)
        ↓
Architectural Intent
        ↓
Architectural Domains
        ↓
Architectural Records
        ↓
Implementation
        ↓
Evidence
        ↓
Architectural Memory (emergent)
        ↓
Evolution
```

Each layer answers a different question:

| Layer | Question |
|-------|----------|
| Constitution | Why do we decide this way? |
| Ontology | What objects exist? |
| Method | How should architects proceed? |
| Workflow Model | What kind of thinking — after Capture? |
| Execution Model | How does DevAnvil enforce governance on protected work? |
| Intent → Memory | What is being preserved and proven? |

Everything below the Execution Model becomes an **execution** of those four foundational layers.

---

## Document Hierarchy

| Document | Role |
|----------|------|
| [devanvil-constitution.md](./devanvil-constitution.md) | Philosophy |
| [devanvil-ontology.md](./devanvil-ontology.md) | Structure and invariants |
| [devanvil-architectural-method.md](./devanvil-architectural-method.md) | Human decision process |
| [devanvil-workflow-model.md](./devanvil-workflow-model.md) | **Daily workflow** — Capture + modes (Architect, Audit, Bug, Forge) |
| [devanvil-execution-model.md](./devanvil-execution-model.md) | Governance pipeline (this document) |
| Domain Records (in repos) | Contracts, catalogs, golden masters |
| [mcp.md](./mcp.md) | MCP tool reference (implementation) |

---

## Stability

This document should remain **implementation-agnostic**.

Its purpose is to define **behavior**, not technology.

When implementation diverges from this model, fix implementation — unless the Execution Model itself is wrong, in which case revise this document deliberately (Mode 4: Foundational) before changing code.

---

*Execution Model v1.0 — behavioral specification for the architectural operating system.*
