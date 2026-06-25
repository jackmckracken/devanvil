import type {
  ArchitectMentalModel,
  ArchitecturalPressure,
  ModelNode,
} from "@/lib/architect/mental-model-types";
import {
  architectBeliefForPressure,
  changeToLivingLanguage,
  formatEvidenceBrief,
  isArchitectureContested,
  isNodeFocus,
  isNodeSettled,
  isRelationshipUnsettled,
  nodeStatusLabel,
  optionBelief,
  pressuresNeedingAttention,
  recommendationLabel,
  relationshipBelief,
} from "@/lib/architect/present";

function Section({
  question,
  children,
  className = "",
}: {
  question: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{question}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ArchitectMentalModelCanvas({ model }: { model: ArchitectMentalModel }) {
  const root = model.nodes.find((n) => n.id === model.rootId);
  const activePressures = pressuresNeedingAttention(model.pressures ?? []);
  const unsettledRelationships = model.relationships.filter(isRelationshipUnsettled);
  const showCompeting = isArchitectureContested(model);
  const settledCount = model.nodes.filter((n) => n.id !== model.rootId && isNodeSettled(n)).length;

  return (
    <div className="space-y-8">
      {activePressures.length > 0 ? (
        <Section question="What is reality trying to become?">
          <div className="space-y-3">
            {activePressures.map((pressure) => (
              <PressureFocus key={`${pressure.nodeId}-${pressure.kind}`} pressure={pressure} />
            ))}
          </div>
        </Section>
      ) : (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-900">
          The current model holds. No architectural pressure requires attention.
        </div>
      )}

      <Section question="What exists?">
        {root ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 font-mono text-sm">
            <ModelTree nodes={model.nodes} rootId={model.rootId} />
            {settledCount > 0 && (
              <p className="mt-3 border-t border-zinc-200/80 pt-3 font-sans text-xs text-zinc-400">
                {settledCount} settled {settledCount === 1 ? "node" : "nodes"} faded — focus on
                what still needs thinking.
              </p>
            )}
          </div>
        ) : null}
      </Section>

      {model.changes.length > 0 && (
        <Section question="What changed?">
          <ul className="space-y-2">
            {model.changes.map((change) => (
              <li
                key={change.summary}
                className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-sm text-violet-900"
              >
                {changeToLivingLanguage(change)}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {unsettledRelationships.length > 0 && (
        <Section question="How do these things influence each other?">
          <ul className="space-y-2">
            {unsettledRelationships.map((rel) => (
              <li
                key={rel.id}
                className="rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2.5 text-sm text-amber-950"
              >
                <p className="text-zinc-800">
                  <span className="font-medium">{rel.fromLabel}</span>
                  <span className="text-zinc-400"> → </span>
                  <span className="italic text-zinc-600">{rel.label}</span>
                  <span className="text-zinc-400"> → </span>
                  <span className="font-medium">{rel.toLabel}</span>
                </p>
                <p className="mt-1 text-xs text-amber-800/90">{relationshipBelief(rel)}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {showCompeting && model.options.length > 0 && (
        <Section question="What other structures are plausible?">
          <div className="space-y-3">
            {model.options.map((option) => {
              const isRecommended = option.id === model.recommendedOptionId;
              return (
                <div
                  key={option.id}
                  className={`rounded-xl border p-3 ${
                    isRecommended
                      ? "border-violet-200 bg-violet-50/40"
                      : "border-zinc-100 bg-zinc-50/40 opacity-75"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900">{option.label}</p>
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-zinc-500">
                    {option.preview}
                  </pre>
                  <p className="mt-2 text-sm text-zinc-600">
                    {optionBelief(option, isRecommended)}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function PressureFocus({ pressure }: { pressure: ArchitecturalPressure }) {
  const evidence = formatEvidenceBrief(pressure.evidence);
  const belief = architectBeliefForPressure(pressure);

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-semibold text-zinc-900">{pressure.nodeLabel}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
          {recommendationLabel(pressure.recommendation)}
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        <span className="font-medium text-zinc-500">Architect&apos;s belief: </span>
        &ldquo;{belief}&rdquo;
      </p>
      {evidence && (
        <p className="mt-2 text-xs text-zinc-500">Evidence: {evidence}</p>
      )}
    </div>
  );
}

function ModelTree({
  nodes,
  rootId,
  parentId = rootId,
  prefix = "",
}: {
  nodes: ModelNode[];
  rootId: string;
  parentId?: string;
  prefix?: string;
}) {
  const node = nodes.find((n) => n.id === parentId);
  if (!node) return null;

  const children = nodes.filter((n) => n.parentId === parentId);

  return (
    <div>
      {prefix === "" ? (
        <div className="font-semibold text-zinc-900">{node.label}</div>
      ) : null}
      {children.map((child, i) => {
        const settled = isNodeSettled(child);
        const focus = isNodeFocus(child);
        const isLast = i === children.length - 1;
        const branch = isLast ? "└── " : "├── ";
        const childPrefix = prefix + (prefix ? (isLast ? "    " : "│   ") : "");

        return (
          <div key={child.id} className={settled ? "opacity-40" : undefined}>
            <div className={focus ? "text-zinc-900" : "text-zinc-600"}>
              {childPrefix}
              {branch}
              <span
                className={
                  focus
                    ? child.state === "proposed"
                      ? "font-semibold text-violet-800"
                      : "font-medium text-amber-900"
                    : child.state === "locked"
                      ? "text-emerald-800"
                      : ""
                }
              >
                {child.label}
              </span>
              {focus && (
                <span className="ml-2 font-sans text-[10px] font-medium uppercase tracking-wide text-amber-600">
                  {nodeStatusLabel(child)}
                </span>
              )}
            </div>
            {focus && child.annotation && (
              <div
                className={`${childPrefix}${isLast ? "    " : "│   "}    font-sans text-xs text-zinc-500`}
              >
                {child.annotation}
              </div>
            )}
            {focus &&
              child.assumptions
                .filter((a) => a.status === "open")
                .map((a) => (
                  <div
                    key={a.text}
                    className={`${childPrefix}${isLast ? "    " : "│   "}    font-sans text-xs text-amber-700`}
                  >
                    ? {a.text}
                  </div>
                ))}
            <ModelTree nodes={nodes} rootId={rootId} parentId={child.id} prefix={childPrefix} />
          </div>
        );
      })}
    </div>
  );
}
