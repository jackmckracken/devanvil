# DevAnvil Constitution

**Version:** 1.0  
**Status:** Highest architectural authority

---

## Purpose

This document is intentionally shorter than the [Ontology](./devanvil-ontology.md).

The Ontology defines the **structure** of DevAnvil.  
The Constitution defines the **philosophy** behind every architectural decision.

When implementation, process, documentation, or even the Ontology itself are uncertain, this document becomes the highest decision-making authority.

The Ontology describes the system.  
The Constitution describes the philosophy that guides its evolution.

The Constitution should change far less frequently than the Ontology.

---

## Article I — Intent First

The purpose of software is not implementation.

The purpose of software is to preserve intent.

Implementation exists to serve intent. Never optimize implementation at the expense of architectural purpose.

---

## Article II — Evolution Without Amnesia

Software must evolve continuously.

Architecture must evolve deliberately.

Intent should evolve only through conscious decision.

The goal is not preventing change. The goal is preventing *accidental* change.

---

## Article III — Reality Over Assumption

Architecture should emerge from building real systems.

Never introduce concepts because they seem theoretically useful. Introduce concepts because repeated experience demonstrates they are necessary.

StudioOps is the proving ground. DevAnvil generalizes proven patterns.

---

## Article IV — Simplicity Is Earned

Every new root object increases the cognitive cost of the entire system.

Prefer derivation over duplication.  
Prefer computation over storage.  
Prefer relationships over hierarchy.

A concept should exist only when it cannot be explained any simpler.

---

## Article V — Evidence Wins

Opinions begin architectural conversations. Evidence ends them.

Runtime behavior, regressions, inventories, tests, contracts, and observations should always outweigh assumptions.

If reality disagrees with theory, improve the theory.

---

## Article VI — Protect Meaning, Not Mechanics

Do not freeze implementations. Freeze architectural promises.

Implementations should remain replaceable. Meaning should remain recognizable.

---

## Article VII — Governance Exists to Enable Creativity

Governance is not bureaucracy.

Governance preserves freedom to move quickly without destroying what already works.

The stronger the architectural foundation, the more confidently systems can evolve.

---

## Article VIII — AI Is an Architect's Apprentice

AI should accelerate implementation. AI should not invent architecture.

Before proposing structural change, AI must first understand:

- Intent
- Domain
- Records
- History
- Evidence

Only then should implementation begin.

---

## Article IX — Every Decision Leaves Memory

No important architectural decision should disappear.

Every significant decision should leave behind enough context that another engineer — or another AI — can understand why it was made years later.

The goal is continuity, not documentation.

---

## Article X — Preserve Intent. Enable Evolution.

This is the governing principle of DevAnvil.

Every architectural decision should increase one or both of these qualities:

1. **Preserve intent**
2. **Enable evolution**

If a proposal preserves intent while enabling evolution, it moves the platform forward.

If it sacrifices either, it should be reconsidered.

---

## Constitutional Test

Before approving any significant architectural change, ask:

1. Does this preserve intent?
2. Does this enable healthy evolution?
3. Does it simplify the Ontology?
4. Does it reduce architectural ambiguity?
5. Will another engineer understand why this exists five years from now?

If the answer to any question is **no**, the proposal should be revised before implementation.

---

## Authority Hierarchy

```
Constitution          ← philosophy (this document)
        ↓
Ontology              ← structure (devanvil-ontology.md)
        ↓
Architectural Method  ← process (devanvil-architectural-method.md)
        ↓
Execution Model       ← behavior (devanvil-execution-model.md)
        ↓
Contracts             ← behavior in repos (Records)
        ↓
Implementation        ← code, schema, API, UI, MCP
```

When documents conflict:

- **Implementation vs Ontology** — the Ontology wins. Amend the Ontology first if it is wrong; then fix implementation.
- **Ontology vs Constitution** — the Constitution wins. Amend the Ontology to align; the Constitution changes only through deliberate revision.
- **Any uncertainty** — apply the Constitutional Test before proceeding.

The Completeness Test ([Ontology Part 13](./devanvil-ontology.md#part-13--ontology-completeness-test)) asks whether a feature maps to the structure.  
The Constitutional Test asks whether a feature honors the philosophy.

Both must pass.

---

## Related Documents

| Document | Role |
|----------|------|
| [devanvil-constitution.md](./devanvil-constitution.md) | Philosophy — highest authority |
| [devanvil-ontology.md](./devanvil-ontology.md) | Structure, invariants, completeness test |
| [devanvil-architectural-method.md](./devanvil-architectural-method.md) | How architectural decisions are made |
| [devanvil-execution-model.md](./devanvil-execution-model.md) | How DevAnvil executes decisions automatically |
| [mcp.md](./mcp.md) | MCP tool reference (implementation) |

---

*This Constitution is intentionally stable.*
