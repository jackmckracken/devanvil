# DevAnvil Ontology

**Status:** Canonical conceptual model (pre-implementation)  
**Version:** 2.1  
**Purpose:** Permanent philosophical and conceptual foundation for DevAnvil 3.0 and all Hewn products that build on it.

This document defines what DevAnvil *is* — not how it is implemented. The [Constitution](./devanvil-constitution.md) is the highest architectural authority. This Ontology defines structure beneath it. No schema, API, UI, MCP tool, or code change should proceed until the Constitution and Ontology are accepted, a feature proposal passes the Completeness Test (Part 13), and the proposal does not violate any Ontological Invariant (Part 15).

---

## Canonical Stack

DevAnvil is organized around **intent first**, not projects first.

```
Architectural Intent          ← why (permanent)
        ↓
Architectural Domain          ← what subsystem (expression)
        ↓
Initiative                    ← strategic bet
        ↓
Work Item                     ← unit of change
        ↓
Evidence                      ← proof of what was done
        ↓
Verification                  ← did intent survive? (behavior)
```

**Project** exists as an organizational container. It scopes intake, MCP routing, and portfolio views. It does not create architecture. Intent creates architecture.

---

## Part 1 — Two Orderings Compared

Two ontological orderings were evaluated. Only one is canonical.

### Model A — Project-First (traditional)

```
Project → Initiative → Work Item → Build
                ↕ (optional)
        Architectural Domain → Intent → Records
```

**Conceptual advantages**
- Familiar to every engineering organization
- Maps cleanly to Jira/Linear mental models
- Intake naturally routes through project slug
- Portfolio and roadmap views have an obvious home

**Disadvantages**
- Architecture appears bolted onto project management
- Domains feel optional — exactly the failure mode Bloom Runtime exposed
- Intent is easy to defer until "later"
- AI agents optimize for task completion, not purpose preservation
- Cross-project domains (shared contracts, platform runtime) become awkward

**Long-term scalability**
- Works for small teams with one product
- Breaks when architecture outlives projects, repos, or implementations
- Encourages re-discovering "why" on every new initiative

**Implications**
- **DevAnvil:** Becomes a task manager with governance features
- **LevrOps:** Architecture competes with founder workflow for primacy
- **StudioOps:** Bloom Runtime regressions repeat — structure protected, purpose lost

---

### Model B — Intent-First (canonical)

```
Architectural Intent → Domain → Records
        ↕ (intersects)
Initiative → Work Item → Evidence → Verification
        ↕ (scoped by)
      Project (container)
```

**Conceptual advantages**
- Reflects what StudioOps actually taught: purpose precedes implementation
- Forge naturally loads Intent before Work Item
- Domains are expressions of Intent, not optional metadata
- Cross-project architecture (Bloom, Auth, Contracts) is first-class
- AI agents receive "why" before "what to build"
- Separates organizational scope (Project) from architectural truth (Intent)

**Disadvantages**
- Less familiar than project-first PM tools
- Requires discipline: Intent must exist before heavy Forge work on a domain
- Empty Intent on early domains is a risk (mitigated by draft lifecycle)
- Portfolio views need explicit bridging from Intent layer to Work layer

**Long-term scalability**
- Intent outlives implementations, repos, and teams
- New products inherit domains without re-architecting DevAnvil
- Physical, creative, and research domains fit without new roots
- Hewn can operate many products under one architectural memory model

**Implications**
- **DevAnvil:** Becomes an Architectural Operating System — memory, not task tracking
- **LevrOps:** Founder OS retains projects for ventures; DevAnvil module leads with Intent for platform architecture
- **StudioOps:** Bloom Runtime Intent is loaded before every Forge task; regressions become intent violations, not just test failures

---

### Recommendation

**Model B — Intent-First — is canonical.**

Project remains in the system as an **organizational container**, not a foundational concept. It scopes work items, initiatives, and optionally domains. It does not sit above Intent in the conceptual hierarchy.

When in doubt, ask: *"Does this belong to why the system exists, or where we organize work?"*  
Why → Intent layer. Where → Project container.

---

## Part 2 — Evidence (Replacing Build)

### The problem with "Build"

The v1.0 ontology used **Build** as a root object linking a work item to a repo branch and plan path. This was accurate for early Forge but too narrow.

Implementation produces many forms of proof:

| Form | Current "Build" captures? |
|------|---------------------------|
| Git branch | ✓ |
| Plan document | ✓ (path reference) |
| Contract impact report | ✓ (path reference) |
| Commits | ✗ |
| Pull requests | ✗ |
| Playwright runs | ✗ |
| Screenshots | ✗ |
| Golden master diffs | ✗ |
| Runtime inventory snapshots | ✗ |
| Benchmark results | ✗ |
| Recordings | ✗ |
| Architecture diagrams | ✗ |
| Deployment artifacts | ✗ |

A branch is not the only trace of work. Verification requires evidence.

### Recommendation: Evidence replaces Build

**Evidence** is the canonical root object. **Build** is deprecated as an ontological concept and becomes one **kind** of Evidence.

### Evidence vs Architectural Record

These must not be conflated:

| | Architectural Record | Evidence |
|--|---------------------|----------|
| **Nature** | Prescriptive — what *should* be | Empirical — what *was* done or observed |
| **Stability** | Evolves deliberately; versioned | Point-in-time capture |
| **Example** | Bloom Runtime Contract v1.4 | Playwright run on 2026-06-25 proving no flash |
| **Attached to** | Domain | Work Item (primarily) |
| **Role in Verification** | Defines criteria | Proves criteria met (or not) |

A golden master **Record** is the canonical reference. A golden master **snapshot** (Evidence kind) is a captured output compared against it during verification.

### Evidence kinds

| Kind | Description |
|------|-------------|
| `branch` | Git branch implementing work |
| `commit` | Specific commit SHA |
| `pull_request` | PR reference |
| `plan` | Forge or feature plan document |
| `audit_report` | Contract impact or architecture audit |
| `screenshot` | Visual capture |
| `playwright_run` | E2E test run result |
| `inventory_snapshot` | Point-in-time runtime inventory |
| `golden_master_snapshot` | Captured output vs golden master |
| `benchmark_result` | Performance measurement |
| `recording` | Video or session recording |
| `diagram` | Architecture diagram produced during work |
| `deployment` | Deployment artifact or release reference |

Evidence is stored as metadata and references (paths, URLs, SHAs) — same principle as Records. Authoritative content lives in repos, CI systems, and artifact stores.

### Why not keep Build?

Build implies a single implementation attempt in a repo. Evidence is the correct abstraction because:

1. Verification requires multiple evidence types, not just a branch
2. Non-software domains (design, music, hardware) produce non-git evidence
3. Forge audit step naturally produces Evidence, not "a Build"
4. One work item may accumulate many Evidence objects over its lifecycle

The current `DevBuild` table maps to Evidence with kind `branch` plus optional linked `plan` and `audit_report` evidence.

---

## Part 3 — Architectural Memory (Emergent)

### Decision (unchanged)

**Architectural Memory is NOT a database table.**

It is an emergent query — the aggregate answer to *"What does this organization know about why and how this subsystem exists?"*

### Composition

```
Architectural Memory = Intent
                     + Records
                     + History
                     + Evidence
```

| Component | What it contributes |
|-----------|---------------------|
| **Intent** | Purpose, promises, non-goals, tradeoffs |
| **Records** | Contracts, catalogs, golden masters, ADRs |
| **History** | Domain changes, violations, audits, activity |
| **Evidence** | Proof of what happened during verification cycles |

### Why this is superior to a Memory table

**1. Memory without duplication**  
A Memory table would copy or summarize content that already lives in Intent, Records, and History. That copy would drift. Emergent memory is always current because it is computed from sources of truth.

**2. Memory is a lens, not a blob**  
Different queries need different memory:
- Forge needs Intent + Records + recent violations
- Audit needs Records + Evidence + gate history
- Portfolio needs Initiative context + domain gravity

One table cannot serve all lenses. A query can.

**3. Memory scales with richness, not row count**  
Intent Density measures memory depth without storing "density" as state. More Records, richer Intent evolution, more Evidence → denser memory → higher Gravity → Forge slows down. The system self-regulates.

**4. Memory survives rewrites**  
When Bloom Runtime was reimplemented, code changed but Memory persisted — because Intent and Records were preserved, and Evidence proved whether the rewrite honored them.

### Examples

**Bloom Runtime regression (R-009)**  
Memory query returns: Intent ("one renderer"), Record (visual contract), History (R-004, R-007, R-008, R-009 in regression log), Evidence (Playwright run showing flash on mount). The agent sees not just a failing test but a *pattern of intent violations*.

**New engineer onboarding**  
Memory query for `bloom-runtime` domain returns Intent brief, core Records, last three Audits, open Violations. No separate "onboarding doc" to maintain.

**Post-ship review**  
"Did architectural intent change?" compares Intent (unchanged) against Evidence (new inventory snapshot, golden master diff) and History (domain change record). Memory is the diff, not a checkbox.

---

## Part 4 — Capability (Future Evaluation)

### The question

Should DevAnvil introduce **Capability** as a root object?

Examples proposed:

| Product | Capabilities |
|---------|-------------|
| StudioOps | Signal, Workbench, Practice Coach, Runway |
| LevrOps | CRM, Editorial, Launch, Finance |
| DevAnvil | Forge, Governance, Domains, MCP, Architectural Brief |

### Analysis

**Is Capability fundamentally different from Domain?**

| | Capability | Domain |
|--|-----------|--------|
| **Perspective** | User-facing product value | Architectural boundary |
| **Question answered** | "What can the user do?" | "What subsystem exists and why?" |
| **Scope** | Often spans multiple domains | Bounded subsystem with Intent |
| **Example** | Practice Coach | Coaching engine domain + session domain + UI domain |

Practice Coach is a Capability. It may touch three Architectural Domains. Signal is a Capability that depends on Bloom Runtime Domain.

**Is Capability the same as Initiative?**

No. Initiative is a *time-bound strategic bet* ("ship Practice Coach MVP"). Capability is a *persistent product surface* ("Practice Coach exists").

**Is Capability the same as Project?**

No. Project is organizational ("StudioOps"). Capability is functional ("Workbench").

### Recommendation: Not a root object — future derived concept

Capability should **not** enter the ontology as a root object at this time.

| Verdict | Rationale |
|---------|-----------|
| **Not a root** | Capability is a **product taxonomy** — a derived grouping over Domains and Records |
| **Derived** | `Capability → spans → Domains` (many-to-many, computed or lightly stored as metadata) |
| **Future work** | When DevAnvil needs product navigation ("show me everything for Workbench"), introduce Capability as a **view or tag layer**, not a foundational object |
| **Forge / Governance / MCP** | These are **behaviors and interfaces**, not Capabilities in the product sense |

**Trigger for revisiting:** If three conditions all become true:
1. Multiple products need shared capability navigation independent of project
2. Capabilities consistently span domains in ways Domains cannot express
3. Capability lifecycle (launch, sunset) needs tracking independent of Initiatives

Until then, Capability remains documented here as **evaluated and deferred**.

---

## Part 5 — The Record Model

### Decision (unchanged, rationale expanded)

Contract, Catalog, Golden Master, ADR, Regression Log, Decision Record, Inventory, Test Suite, and Visual Contract are all **kinds of Architectural Record** — not root objects.

### Why one Record object with kinds

**1. Ontology explosion prevention**  
If each kind were a root object, DevAnvil would need:
- Separate tables, APIs, MCP tools, and UI for each
- Cross-kind queries ("all knowledge for Bloom Runtime") become joins across unrelated roots
- Every new documentation pattern (spec, runbook, playbook) demands a new root

One Record with kinds adds a row and a kind enum — not a schema migration.

**2. Shared lifecycle**  
All Records: created → versioned → superseded. ADRs and catalogs version differently in content but identically in lifecycle. One model captures this.

**3. Shared relationship to Domain**  
Every piece of architectural knowledge belongs to a Domain. Records don't exist independently of the subsystem they describe. A root per kind would duplicate the `belongs_to Domain` relationship seven times.

**4. Intent Density computes uniformly**  
Density is a weighted count over Record kinds. One query surface. If kinds were roots, density would require a federated computation across unrelated objects.

**5. DevAnvil stores references, not content**  
Every kind is a pointer (path, URL, version) to authoritative content in a repo. The storage pattern is identical regardless of kind.

### Record kind catalog

| Kind | Role | Prescriptive question answered |
|------|------|-------------------------------|
| `adr` | Architecture Decision Record | "What did we decide and when?" |
| `runtime_contract` | Behavioral/structural rules | "How must this behave?" |
| `visual_contract` | Rendering and visual stability | "How must this look?" |
| `catalog` | Enumerated extension surface | "What can be added?" |
| `golden_master` | Canonical reference output | "What does correct look like?" |
| `runtime_inventory` | Machine-readable component list | "What exists right now?" |
| `test_suite` | Automated verification reference | "How do we prove it?" |
| `regression_log` | Failure and recovery history | "What broke before?" |
| `decision_record` | Domain-scoped decision | "Why was this constraint accepted?" |

### Aliases for non-software domains

| Software kind | General alias |
|---------------|---------------|
| `runtime_contract` | `behavior_contract` |
| `runtime_inventory` | `component_inventory` |
| `visual_contract` | `appearance_contract` |

Aliases are display/locale concerns. The kind enum does not multiply.

### What Records are NOT

- **Not Evidence** — Records say what should be; Evidence proves what was
- **Not Intake Attachments** — Those attach to Work Items, not Domains
- **Not code** — Code lives in repos; Records point to it

---

## Part 6 — Minimal Ontology

### Six foundational roots + one container

| # | Object | Layer | Foundational? |
|---|--------|-------|---------------|
| 1 | **Architectural Intent** | Architecture | Yes |
| 2 | **Architectural Domain** | Architecture | Yes |
| 3 | **Architectural Record** | Architecture | Yes |
| 4 | **Initiative** | Work | Yes |
| 5 | **Work Item** | Work | Yes |
| 6 | **Evidence** | Work / Verification | Yes |
| — | **Project** | Organization | Container only |

Policy (change gates, extension points, protection level) attaches to Domain.  
History (changes, violations, audits, activity) attaches to Domain or Work Item.  
Verification is behavior that consumes Evidence against Records and Intent.

### Why these six cannot be derived

| Object | Why it must exist independently |
|--------|--------------------------------|
| **Intent** | Purpose survives all implementations; cannot be inferred from code or tasks |
| **Domain** | Scope, detection, and governance cannot be inferred from Intent alone |
| **Record** | Knowledge artifacts have independent versioning and paths |
| **Initiative** | Strategic priority is not derivable from individual work items |
| **Work Item** | Atomic capture of change intent; source of all execution |
| **Evidence** | Proof of work is not derivable from the work item description |

### Concept inventory (abbreviated)

See v1.0 Part 1 for full inventory. Key updates in v2.0:

| Concept | Classification |
|---------|---------------|
| Build | **Deprecated** → Evidence kind `branch` |
| Evidence | **Root Object** |
| Project | **Organizational container** (not foundational) |
| Capability | **Deferred** (future derived concept) |
| Protected Domain | **Derived** → Domain with active governance |
| Gravity, Readiness, Risk, Intent Density | **Metrics** (computed) |
| Governance, Memory, Forge, Verification | **Behavior / Emergent** |
| Sprint, Roadmap | **Deprecated** |

---

## Part 7 — Root Object Definitions

### Architectural Intent

**Purpose:** Permanent explanation of **why** a subsystem exists.

**Responsibilities:** Purpose, mission, core promises, non-goals, tradeoffs, constraints, philosophy, evolution history, success criteria.

**Relationships:**
- `expressed_by` ← Architectural Domain (1:1)
- `documented_by` → Records (optional)
- `informs` → Intent Density, Gravity, Intent Brief (computed)
- `preserved_by` → Architectural Memory (emergent)

**Lifecycle:** draft → active → evolved (versioned; never deleted)

**Examples:** Bloom Runtime — "Single canonical creative rendering engine. Artists discover relationships without visual instability."

---

### Architectural Domain

**Purpose:** Bounded expression of Intent — detectable scope with governance and knowledge.

**Responsibilities:** Detection signals, governance policy, record scoping, verification snapshots.

**Relationships:**
- `expresses` → Intent
- `scoped_to` → Project (optional)
- `contains` → Records, Change Gates, Extension Points
- `governed_by` → History (changes, violations, audits)
- `intersected_by` → Work Items and Initiatives (at Forge time)

**Lifecycle:** active → archived

**Examples:** Bloom Runtime, Auth, Billing, LevrOps Contracts Pipeline

---

### Architectural Record

**Purpose:** Typed, versioned reference to architectural knowledge.

**Relationships:** `belongs_to` → Domain; `references` → external path; `superseded_by` → newer Record.

**Lifecycle:** created → updated → superseded

See Part 5 for kind catalog.

---

### Initiative

**Purpose:** Time-bound strategic bet grouping work toward an outcome.

**Relationships:**
- `scoped_to` → Project
- `contains` → Work Items (many-to-many)
- `may_align_with` → Domains (when work touches governed subsystems)

**Lifecycle:** proposed → active → next → paused → completed → archived

**Examples:** "Bloom Runtime Stability", "Practice Coach MVP"

---

### Work Item

**Purpose:** Atomic unit of captured change — feature, bug, regression, decision, question, chore, opportunity.

**Relationships:**
- `scoped_to` → Project
- `member_of` → Initiatives
- `produces` → Evidence
- `may_trigger` → Domain Change
- `matched_to` → other Work Items

**Lifecycle:** captured → triaged → approved → in_build → shipped | duplicate | rejected | archived

---

### Evidence

**Purpose:** Empirical proof produced during implementation and verification.

**Responsibilities:** Reference branches, commits, PRs, test runs, snapshots, reports, and other artifacts that prove what was done.

**Relationships:**
- `produced_by` → Work Item
- `verifies_against` → Records and Intent (at Verification time)
- `contributes_to` → Architectural Memory (emergent)

**Lifecycle:** captured → referenced → archived (immutable once captured)

**Examples:** Branch `forge/dev-abc123-add-hover-panel`, Playwright run artifact, golden master diff snapshot

---

### Project (organizational container)

**Purpose:** Scope work and optionally domains within an organizational boundary.

**Not foundational.** Projects organize. Intent architecturally defines.

**Relationships:** `scopes` → Initiatives, Work Items, Domains (optional)

**Lifecycle:** active → archived

**Examples:** StudioOps, LevrOps, Heirloom, Hewn Ventures

---

## Part 8 — Derived Concepts

These MUST NOT become database tables.

### Metrics

| Metric | Derivation |
|--------|------------|
| **Intent Density** | Weighted completeness of Intent fields + Record kinds + History depth |
| **Gravity** | `f(intent_density, operational_risk, protection_level, violation_recency)` |
| **Readiness** | Work item status + priority + terminal state |
| **Risk** | Domain protection + task intersection strength + prohibited work |
| **Initiative Score** | Strategic value + status + priority + item signals |
| **Catalog Coverage** | Catalog Record vs inventory Evidence |
| **Golden Master Health** | Record age + latest snapshot Evidence diff |
| **Regression Trend** | Violation + regression work item time series |

### Emergent properties

| Property | Composition |
|----------|-------------|
| **Governance** | Gates + extension points + protection level on Domain |
| **Architectural Memory** | Intent + Records + History + Evidence |
| **Protected Domain** | Domain where governance is active |
| **Intent Brief** | Formatted Intent + Domain + Records for Forge |
| **Portfolio Focus** | Ranked Initiatives + ready Work Items + blockers |

### Behaviors

Forge, Intake, Triage, Detection, Verification, Classification, Curation — processes, not stored objects.

---

## Part 9 — Object Graph

```
Architectural Intent
        │
        │ expressed by
        ▼
Architectural Domain ◄──── scoped_to ──── Project (container)
        │
        ├── contains ──► Architectural Record ── references ──► repo / path
        ├── has_policy ► Change Gate, Extension Point
        └── governs ───► History (Change, Violation, Audit)

Initiative ◄── scoped_to ── Project
    │
    └── member_of ◄──► Work Item ◄── scoped_to ── Project
                           │
                           ├── produces ──► Evidence
                           ├── has ───────► Activity
                           └── matched_to ► Work Item

Verification (behavior)
    ├── consumes ──► Evidence
    ├── checks against ──► Records
    └── proves ──► Intent (via Domain)
```

### Relationship verbs

| Verb | From | To |
|------|------|-----|
| `expresses` | Domain | Intent |
| `contains` | Domain | Record |
| `references` | Record, Evidence | External artifact |
| `produces` | Work Item | Evidence |
| `verifies_against` | Evidence | Record, Intent |
| `governs` | Domain | Change, Violation, Audit |
| `scopes` | Project | Initiative, Work Item, Domain |
| `member_of` | Work Item | Initiative |
| `intersected_by` | Domain | Work Item (at Forge time) |
| `supersedes` | Record | Record |
| `preserved_by` | Memory (emergent) | Intent, Records, History, Evidence |

---

## Part 10 — Historical Evolution

```
LevrOps (Founder OS)
    │  Ideas need capture before they're lost
    ▼
DevAnvil V1 — Intake & Queue
    │  Work Item + Project
    ▼
DevAnvil V1.5 — Initiatives & Portfolio
    │  Strategic bets; Build traceability
    ▼
StudioOps + Forge
    │  AI implements fast; needs pick → plan → build → ship
    ▼
Bloom Runtime Regressions (R-004 – R-009)
    │  AI preserves implementation, violates purpose
    ▼
Protected Domains
    │  Governance without Intent is structure without soul
    ▼
DevAnvil 3.0 Vision — Architectural Intent
    │  Why must precede what
    ▼
Ontology v1.0
    │  Six roots; Project-first bias
    ▼
Ontology v2.0 (this document)
    │  Intent-first; Evidence replaces Build; Memory confirmed emergent
    │  DevAnvil becomes Architectural Memory for the organization
```

| Forcing event | Ontology response |
|---------------|-------------------|
| Ideas lost | Work Item + Intake |
| Strategic drift | Initiative |
| AI needs repo context | Evidence + MCP |
| Bloom regressions | Domain + Records + Gates |
| Purpose lost despite passing tests | Intent as foundational root |
| Branch ≠ proof | Evidence replaces Build |
| "What do we know about Bloom?" | Memory as emergent query |

---

## Part 11 — Naming Audit

| Term | Verdict |
|------|---------|
| **Protected Domain** | Rename to **Architectural Domain**; protection is posture |
| **Build** | Deprecate; use **Evidence** |
| **DevBuild** (code) | Migrate to **Evidence** when implementing |
| **DomainArtifact** | Rename to **Architectural Record** |
| **DevArtifact** | Rename to **Intake Attachment** |
| **Architectural Memory** | Keep as emergent; never a table |
| **Capability** | Deferred; not in ontology yet |
| **Gravity / Intent Density** | Keep |
| **Golden Master / Catalog / ADR** | Keep as Record kinds |
| **Runtime Contract** | Keep; alias `behavior_contract` for non-software |
| **Forge** | Keep as workflow name |

---

## Part 12 — Future-Proofing

### Products

| Product | Intent-first usage |
|---------|-------------------|
| **StudioOps** | Bloom Intent before every Forge task; rich Records and Evidence |
| **LevrOps** | Platform Intent for contracts/tenancy; Project for ventures |
| **DevAnvil** | Meta-domain for ontology itself |
| **Heirloom / Hewn** | Lighter governance; Intent still applies to durable creations |

### Beyond software

| Domain | Intent example | Records | Evidence |
|--------|---------------|---------|----------|
| Song | "Verse-chorus tension resolves in the bridge" | catalog (sections), visual_contract (mood) | recording, benchmark (audience test) |
| Furniture | "Joinery invisible from every viewing angle" | visual_contract, catalog (components) | photograph, stress test result |
| Business | "Revenue without compromising artist ownership" | decision_record, behavior_contract | financial snapshot, audit report |
| Curriculum | "Mastery through spaced repetition" | catalog (modules), decision_record | assessment results |

No new root objects required.

### Stability tests

| Question | Answer |
|----------|--------|
| Physical product support? | Same six roots; Record kind aliases |
| Autonomous AI agents? | Evidence accumulates automatically; Verification behavior adapts |
| New documentation pattern? | New Record kind, not new root |
| Product navigation by Capability? | Derived layer when triggered (Part 4) |

---

## Part 13 — Ontology Completeness Test

**Before any implementation begins**, every feature proposal must answer:

> **Can this feature be completely explained using the ontology?**

Walk through:

1. Which root object(s) does it create, read, update, or relate to?
2. Is anything new a **kind**, **metric**, **behavior**, or **emergent property** — rather than a new root?
3. Does it respect Intent-first ordering?
4. Does it treat Memory as query, not storage?
5. Does it distinguish Records (prescriptive) from Evidence (empirical)?
6. Does it violate any Ontological Invariant (Part 15)?

**If the answer is "no"**, one of two things is true:

1. **The ontology is incomplete** — amend this document first, then implement.
2. **The feature is not yet understood** — refine the proposal until it maps cleanly.

No exceptions. No "we'll add a table and fix the ontology later."

### Completeness Test examples

| Proposal | Pass? | Mapping |
|----------|-------|---------|
| "Add Intent Brief to Forge prompt" | ✓ | Behavior formatting Intent + Records |
| "Store gravity on domain" | ✗ | Gravity is computed; store inputs, not metric |
| "Add Capability table for StudioOps modules" | ✗ | Capability deferred (Part 4); use Domain spans |
| "Track Playwright results per work item" | ✓ | Evidence kind `playwright_run` on Work Item |
| "Create Memory table for onboarding" | ✗ | Memory is emergent query |
| "Add golden master snapshot after Forge audit" | ✓ | Evidence kind `golden_master_snapshot` |

---

## Part 14 — Philosophical Foundation

### The principle

**Systems become durable when they preserve intent while allowing evolution.**

Software decays when developers — and AI — forget *why* code exists, not when they forget *what* it does. Tests verify behavior. Contracts verify structure. Only Intent verifies purpose.

StudioOps proved this painfully. Bloom Runtime regressed repeatedly not because the implementation was wrong in isolation, but because each rewrite optimized locally while violating globally. The renderer worked. The lifecycle forked. The hover system duplicated. Visual stability broke. Every regression passed individual checks and failed the reason the system existed.

DevAnvil exists to prevent that failure mode — for software and for everything Hewn builds.

### Architecture is the expression. Intent is the source.

This is not a software principle. It is a **creation principle**.

| Domain | Intent preserved | Evolution allowed |
|--------|-----------------|-------------------|
| **Software** | "One renderer, stable emergence" | New atom species, new rails |
| **Architecture** | "Light enters from the north" | Materials, techniques change |
| **Song** | "The bridge releases verse tension" | Arrangement, instrumentation change |
| **Creative system** | "Visual language stays coherent" | New scenes, new characters |
| **Business** | "Artists retain ownership" | Revenue models, channels change |
| **Product design** | "Invisible joinery" | Wood species, scale change |

In every case, the durable thing is the **why**. The disposable thing is the **how**. DevAnvil makes that distinction operational.

### Why this is a Hewn philosophy

Hewn Ventures builds companies, products, music, and platforms simultaneously. The failure mode is the same everywhere: **reimplementation without remembrance**. A song rewritten loses its emotional intent. A product pivot loses its architectural intent. A business restructure loses its founding intent.

DevAnvil generalizes the lesson from StudioOps into infrastructure any Hewn product can use:

- **LevrOps** preserves founder intent across ventures
- **StudioOps** preserves creative and runtime intent across AI-driven iteration
- **DevAnvil** preserves architectural intent across implementations
- **Heirloom** and future products inherit the same model

The competitive advantage is not writing code faster. AI commoditizes implementation. The advantage is **never having to rediscover why**.

### The manifesto

Most systems remember tasks, commits, and tickets.

DevAnvil remembers **intent, tradeoffs, and meaning**.

Architecture remembers structure.  
Intent remembers purpose.  
Evidence remembers proof.  
Memory remembers everything — without storing anything twice.

The software can evolve indefinitely because its intent never has to be rediscovered.

That is what DevAnvil is for. That is what Hewn is building.

---

## Part 15 — Ontological Invariants

An ontology should not merely describe the system. It should define the invariants that every future implementation must preserve.

These invariants are true regardless of language, framework, database, UI, or AI implementation. Any feature, schema, runtime, or product that violates one of them is **architecturally incorrect** — even if it compiles and passes tests.

The Completeness Test (Part 13) asks whether a feature *maps* to the ontology. The Invariants ask whether a feature *honors* it.

---

### Invariant 1 — Intent precedes implementation

No implementation should exist without being traceable to an Architectural Intent.

**Implications:**
- Forge must load Intent before generating or modifying code
- Work Items that touch a governed Domain must resolve to that Domain's Intent
- Evidence proves implementation; Intent explains why it was permitted

**Violation examples:**
- Shipping a feature in a protected subsystem with no linked Intent
- Creating a Domain with gates and records but no Intent object
- AI agents generating code from a task description alone when a Domain is detected

---

### Invariant 2 — Domains express intent

Domains are bounded expressions of Intent. They never become independent sources of truth.

**Implications:**
- A Domain without Intent is incomplete, not autonomous
- Domain description, keywords, and path patterns scope Intent — they do not replace it
- Cross-project Domains still express a single Intent

**Violation examples:**
- Treating `ProtectedDomain` metadata as sufficient without an Intent parent
- Allowing Domain governance to drift independently of Intent evolution
- Creating Domains from path patterns alone with no stated purpose

---

### Invariant 3 — Records describe architecture; Evidence proves architecture

Never confuse what *should* exist with what *actually* occurred.

**Implications:**
- Records are prescriptive and versioned; Evidence is empirical and point-in-time
- A passing test run is Evidence; the test suite specification is a Record
- Verification compares Evidence against Records and Intent — never collapses them

**Violation examples:**
- Storing Playwright output as an Architectural Record
- Treating a golden master snapshot as the canonical golden master
- Using branch name as proof that Intent was honored

---

### Invariant 4 — Memory emerges

Architectural Memory is always computed from Intent, Records, History, and Evidence. It must never become an independently maintained source of truth.

**Implications:**
- No Memory table, document, or cache that duplicates ontological sources
- Onboarding views, Intent Briefs, and audit summaries are queries — not stores
- Memory freshness comes from source updates, not Memory maintenance

**Violation examples:**
- `ArchitecturalMemory` model summarizing Intent and Records
- A "domain wiki" maintained separately from Records and Intent
- Stale Memory copy used instead of querying current Intent

---

### Invariant 5 — Governance constrains change

Governance should never become the architecture itself. Policies exist to protect Intent, not replace it.

**Implications:**
- Change gates and extension points are Policy on Domain — not roots
- A domain with many gates but empty Intent violates the spirit of this invariant
- Governance intensity (protection level) scales with Intent Density — it does not define purpose

**Violation examples:**
- Requiring ADR approval as the sole definition of architectural correctness
- Protection level substituting for Intent clarity
- Gate checklist passing while core promises are violated

---

### Invariant 6 — Metrics are observations

Gravity, Intent Density, Readiness, Risk, Coverage, and Health are computed properties. They describe the system. They are not the system.

**Implications:**
- Metrics are derived at query time or cached as snapshots with known staleness — never authoritative
- Changing a metric must not require changing ontology roots
- High Gravity slows Forge; it does not block Intent evolution

**Violation examples:**
- `gravity` column on Domain used as source of truth
- Readiness score stored instead of work item status
- Intent Density as a manually edited field

---

### Invariant 7 — Projects organize work

Projects do not define architecture. Projects may begin, end, merge, or disappear. Intent should survive them.

**Implications:**
- Project is a container, not a root of the canonical stack
- Domains may span projects or outlive them
- Archiving StudioOps must not archive Bloom Runtime Intent

**Violation examples:**
- Project-scoped architecture that cannot survive project rename or split
- Intent stored only as project description text
- Deleting a project cascading to delete Intent

---

### Invariant 8 — Architecture must evolve; Intent must endure

Implementations should be free to change. Architectural purpose should remain recognizable across versions.

**Implications:**
- Intent evolves through versioned history — never silent overwrite
- Records supersede; Evidence accumulates; Intent clarifies
- Rewrites are permitted when Evidence proves Intent is still honored

**Violation examples:**
- Deleting Intent history on refactor
- Treating implementation rewrites as permission to abandon non-goals
- Intent so vague it cannot detect violation across versions

---

### Invariant 9 — Every object must justify its existence

If a proposed object cannot answer *"What unique concept does this represent that cannot be derived elsewhere?"* — it probably should not become a root object.

**Implications:**
- Default to kind, metric, behavior, or emergent property before creating a root
- Capability, Memory, and Governance were evaluated under this invariant and rejected or deferred
- The Completeness Test enforces this at feature time

**Violation examples:**
- Adding `Capability` as a root because product navigation needs it
- Promoting `Build` when `Evidence` with kinds suffices
- Creating `Governance` as a model because gates feel important

---

### Invariant 10 — The Constitution is the highest authority; the Ontology is structural law

When implementation, documentation, or process disagrees with the Ontology: **the Ontology wins over implementation**.

When the Ontology disagrees with the [Constitution](./devanvil-constitution.md): **the Constitution wins**. Amend the Ontology first.

If the Constitution is wrong: **change the Constitution deliberately** — it should change far less frequently than the Ontology — then align the Ontology and implementation.

**Implications:**
- Code, docs, and MCP tools are downstream of Constitution → Ontology
- Ontology amendments require explicit revision (version bump, acceptance)
- Constitutional Test (Article X) applies when philosophy is at stake; Completeness Test applies when structure is at stake
- "We've always done it this way" is not grounds for violation

**Violation examples:**
- Shipping schema because migration is already written, despite Ontology mismatch
- Ontology revision that adds roots without Constitutional Test (simplicity, proven necessity)
- MCP tool returning data shape with no ontological mapping
- Process doc describing Build as root after Evidence adoption

---

### Invariant summary

| # | Invariant | One line |
|---|-----------|----------|
| 1 | Intent precedes implementation | Why before what |
| 2 | Domains express intent | Domains are not autonomous |
| 3 | Records describe; Evidence proves | Prescriptive ≠ empirical |
| 4 | Memory emerges | Query, never store |
| 5 | Governance constrains | Policy protects, not replaces |
| 6 | Metrics observe | Describe, don't define |
| 7 | Projects organize | Architecture outlives projects |
| 8 | Evolve implementation; endure intent | Purpose persists across rewrites |
| 9 | Justify every object | Derive before you root |
| 10 | Constitution wins | Philosophy over structure; Ontology over implementation |

---

## Authority Hierarchy

```
Constitution (devanvil-constitution.md)           ← philosophy — highest authority
        ↓
Ontology (this document)                          ← structure, invariants
        ↓
Architectural Method (devanvil-architectural-method.md)  ← decision process
        ↓
Execution Model (devanvil-execution-model.md)            ← behavioral spec
        ↓
Contracts (Records in repos)                             ← behavior
        ↓
Implementation                                         ← code, schema, API, UI, MCP
```

See [DevAnvil Constitution — Authority Hierarchy](./devanvil-constitution.md#authority-hierarchy), [Architectural Method — Document Hierarchy](./devanvil-architectural-method.md#document-hierarchy), and [Execution Model — Relationship to the DevAnvil Stack](./devanvil-execution-model.md#relationship-to-the-devanvil-stack).

---

## Implementation Gate

**No schema, API, UI, or MCP changes until:**

1. The [Constitution](./devanvil-constitution.md) is accepted
2. This Ontology (v2.1) is accepted
3. The [Architectural Method](./devanvil-architectural-method.md) is accepted for significant work
4. The [Execution Model](./devanvil-execution-model.md) is accepted as behavioral specification
5. The feature proposal passes the Completeness Test (Part 13)
6. The feature proposal passes the Constitutional Test ([Constitution](./devanvil-constitution.md#constitutional-test))
7. The feature proposal violates no Ontological Invariant (Part 15)

### Acceptance checklist

- [ ] [Constitution v1.0](./devanvil-constitution.md) accepted as highest authority
- [ ] [Architectural Method v1.0](./devanvil-architectural-method.md) accepted
- [ ] [Execution Model v1.0](./devanvil-execution-model.md) accepted
- [ ] Intent-first canonical stack accepted (Part 1)
- [ ] Evidence replaces Build (Part 2)
- [ ] Architectural Memory confirmed emergent — Intent + Records + History + Evidence (Part 3)
- [ ] Capability evaluated and deferred (Part 4)
- [ ] Record kinds confirmed as only knowledge taxonomy (Part 5)
- [ ] Six foundational roots + Project container accepted (Part 6)
- [ ] Completeness Test adopted as implementation gate (Part 13)
- [ ] Philosophical foundation accepted (Part 14)
- [ ] Ontological Invariants accepted as non-negotiable constraints (Part 15)

---

## Appendix — Current Implementation Mapping

| Ontology (v2.1) | Current code | Action on implementation |
|-----------------|-------------|--------------------------|
| Architectural Intent | *none* | Create |
| Architectural Domain | `ProtectedDomain` | Rename; add Intent FK |
| Architectural Record | `ProtectedDomainArtifact` | Rename |
| Initiative | `Initiative` | — |
| Work Item | `DevItem` | Display rename |
| Evidence | `DevBuild` | Generalize to Evidence with kinds |
| Project | `Project` | Demote to container in docs/UI hierarchy |
| Capability | *none* | Deferred |
| Build | `DevBuild` | Deprecate → Evidence kind `branch` |
| Architectural Memory | *none* | Implement as query/view only |
| Gravity / Intent Density | *none* | Compute |
