# The DevAnvil Architectural Method

**Version:** 1.0  
**Status:** Canonical process for architectural decisions

---

## Purpose

The [Constitution](./devanvil-constitution.md) defines **principles**.  
The [Ontology](./devanvil-ontology.md) defines **structure**.  
**Contracts** define **behavior** — runtime contracts, visual contracts, and shared API schemas that Records reference.  
The Architectural Method defines **how architectural decisions are made**.

Whenever a significant feature, subsystem, runtime, or redesign is proposed, this method should be followed before implementation.

This sequence should remain stable across products, programming languages, AI models, and future generations of the platform.

---

## When to Apply This Method

Use the full method when work:

- Touches a governed Architectural Domain
- Introduces or modifies a subsystem
- Changes contracts, catalogs, or golden masters
- Proposes a new root concept or Ontology amendment
- Risks violating architectural intent (high Gravity)

For minor work outside governed domains — small bug fixes, copy changes, isolated chores — Steps 1–3 may be abbreviated, but Steps 8–10 still apply before ship.

---

## Step 1 — Understand Intent

Identify the **Architectural Intent** that owns this work.

If no Intent exists: **Stop. Do not begin implementation.**

Determine whether:

- an existing Intent should be extended, or
- a new Intent should be created

Never build without Intent.

**Outputs:** Named Intent, confirmed purpose, core promises and non-goals reviewed.

---

## Step 2 — Locate the Domain

Determine which **Architectural Domain** owns the change.

If multiple Domains are affected:

- Identify the **primary owner**
- Document secondary intersections

The owning Domain is responsible for preserving Intent.

**Outputs:** Primary Domain identified; `detect_protected_domains` or equivalent run for task text and paths.

---

## Step 3 — Consult the Record

Read the relevant **Architectural Records** before writing code.

Including:

- ADRs
- Contracts
- Catalogs
- Golden Masters
- Inventories
- Regression History
- Prior Decisions

Implementation begins with understanding.

**Outputs:** Records loaded; gaps in knowledge noted.

---

## Step 4 — Apply the Constitution

Run the [Constitutional Test](./devanvil-constitution.md#constitutional-test).

Ask:

1. Does this preserve intent?
2. Does this enable healthy evolution?
3. Does it simplify the Ontology?
4. Does it reduce architectural ambiguity?
5. Will another architect understand this years from now?

If any answer is **no**: revise the proposal.

**Outputs:** Constitutional Test passed or proposal revised.

---

## Step 5 — Apply the Ontology

Run the [Completeness Test](./devanvil-ontology.md#part-13--ontology-completeness-test).

> Can this proposal be completely explained using the Ontology?

If not, either:

- **refine the feature**, or
- **improve the Ontology**

Never force implementation around conceptual gaps.

**Outputs:** Feature mapped to root objects, kinds, metrics, or behaviors.

---

## Step 6 — Verify Invariants

Evaluate every [Ontological Invariant](./devanvil-ontology.md#part-15--ontological-invariants).

- Identify every invariant touched
- Explicitly document why none are violated

If any invariant is violated: stop and revise (Ontology, proposal, or both).

**Outputs:** Invariant checklist completed.

---

## Step 7 — Determine the Change Type

Classify the proposal. Each category implies a different rigor and approval path.

| Change Type | Typical scope | Approval rigor |
|-------------|---------------|----------------|
| **Bug Fix** | Restore behavior within existing Intent | Domain owner; gates as defined |
| **Contract Extension** | Extend behavior within existing promises | Contract update + tests + inventory |
| **Catalog Extension** | Add enumerated surface (e.g. atom species) | Catalog update + golden master + tests |
| **New Domain** | New subsystem with new Intent | Intent draft → Domain → Records → governance |
| **Intent Evolution** | Conscious change to purpose or promises | Intent version + ADR + downstream Record updates |
| **Constitutional Change** | Philosophy or invariant shift | Constitution revision → Ontology alignment |

When in doubt, classify upward (more rigor, not less).

**Outputs:** Change type recorded on Work Item or Domain Change.

---

## Step 8 — Produce Evidence

Implementation is not complete until **Evidence** exists.

Evidence includes:

- Tests
- Inventories
- Screenshots
- Runtime proofs
- Golden master diffs
- Benchmarks
- Demonstrations
- Branches, commits, pull requests

Claims without evidence are incomplete.

**Outputs:** Evidence objects linked to Work Item; gate checklist satisfied.

---

## Step 9 — Update Memory

After implementation, ask:

> Did architectural knowledge change?

If yes, update:

- Records
- Contracts
- Catalogs
- ADRs
- Golden Masters
- Intent (only through conscious Intent Evolution)

Memory is emergent — it updates when **sources** update, not by maintaining a separate Memory store.

**Outputs:** Records versioned; Intent evolution documented if applicable.

---

## Step 10 — Verify Intent Survived

The final question is never:

> "Did the code work?"

The final question is:

> **"Did the architectural intent survive?"**

If yes: ship.

If not: continue iterating.

**Outputs:** Verification recorded; Work Item shipped or returned to Step 8.

---

## Guiding Principle

**Implementation is the final step. Understanding is the first.**

Every architectural decision should move through:

```
Intent
  ↓
Domain
  ↓
Knowledge (Records)
  ↓
Principles (Constitution)
  ↓
Structure (Ontology)
  ↓
Implementation
  ↓
Evidence
  ↓
Memory (sources updated)
  ↓
Verification
```

This sequence is the Architectural Method of DevAnvil.

---

## Method Summary

| Step | Name | Stop condition |
|------|------|----------------|
| 1 | Understand Intent | No Intent → do not implement |
| 2 | Locate the Domain | Primary owner identified |
| 3 | Consult the Record | Records read |
| 4 | Apply the Constitution | Constitutional Test pass |
| 5 | Apply the Ontology | Completeness Test pass |
| 6 | Verify Invariants | No violations |
| 7 | Determine Change Type | Classification recorded |
| 8 | Produce Evidence | Evidence linked |
| 9 | Update Memory | Sources updated if knowledge changed |
| 10 | Verify Intent Survived | Intent honored → ship |

---

## Document Hierarchy

```
Constitution          ← principles (why we decide)
        ↓
Ontology              ← structure (what exists)
        ↓
Architectural Method  ← process (how we decide)
        ↓
Execution Model       ← behavior (how DevAnvil executes)
        ↓
Contracts             ← behavior (what must hold, in repos)
        ↓
Implementation        ← code, schema, API, UI, MCP
```

| Document | Role |
|----------|------|
| [devanvil-constitution.md](./devanvil-constitution.md) | Philosophy |
| [devanvil-ontology.md](./devanvil-ontology.md) | Structure and invariants |
| [devanvil-architectural-method.md](./devanvil-architectural-method.md) | Decision process (this document) |
| [devanvil-execution-model.md](./devanvil-execution-model.md) | Machine behavioral specification |
| Domain Records (in repos) | Contracts, catalogs, golden masters |
| [mcp.md](./mcp.md) | MCP tool reference |

---

## Forge Alignment

The StudioOps Forge workflow maps to this method:

| Forge phase | Method steps |
|-------------|--------------|
| `/forge_pick` | Portfolio + Work Item (pre-method) |
| `/forge_plan` | Steps 1–7 |
| `/forge_review` | Steps 4–6 |
| `/forge_build` | Step 8 (implementation) |
| `/forge_audit` | Steps 8–9 |
| `/forge_ship` | Steps 9–10 |

Intent Brief — when implemented — is the formatted output of Method Steps 1–3 / Execution State 4 (Architectural Context).

For the full machine state machine, see [Execution Model](./devanvil-execution-model.md#the-canonical-execution-pipeline).

---

*This Method is intentionally stable. It should change less frequently than the Ontology and far less frequently than implementation.*
