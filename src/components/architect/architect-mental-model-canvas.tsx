import type {
  ArchitectMentalModel,
  ArchitecturalPressure,
  ModelNode,
} from "@/lib/architect/mental-model-types";

function confidenceTone(value: number): string {
  if (value >= 80) return "text-emerald-600 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-orange-700 bg-orange-50 animate-pulse";
}

function nodeBorder(state: ModelNode["state"]): string {
  if (state === "locked") return "border-emerald-300 bg-emerald-50/40";
  if (state === "proposed") return "border-violet-300 bg-violet-50/50";
  if (state === "uncertain") return "border-amber-300 bg-amber-50/40";
  return "border-zinc-200 bg-white";
}

export function ArchitectMentalModelCanvas({ model }: { model: ArchitectMentalModel }) {
  const root = model.nodes.find((n) => n.id === model.rootId);
  const pressures = model.pressures ?? [];

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          Current Mental Model
        </h3>
        {root && (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 font-mono text-sm">
            <ModelTree nodes={model.nodes} rootId={model.rootId} />
          </div>
        )}
      </section>

      {model.changes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Model Evolution
          </h3>
          <ul className="mt-2 space-y-1.5">
            {model.changes.map((change) => (
              <li
                key={change.summary}
                className="flex items-start gap-2 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-900"
              >
                <ChangeBadge type={change.type} />
                <span>{change.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {model.relationships.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Relationships
          </h3>
          <ul className="mt-2 space-y-2">
            {model.relationships.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-zinc-100 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-zinc-800">
                    <span className="font-medium">{r.fromLabel}</span>
                    <span className="text-zinc-400"> → </span>
                    <span className="italic text-zinc-600">{r.label}</span>
                    <span className="text-zinc-400"> → </span>
                    <span className="font-medium">{r.toLabel}</span>
                  </p>
                  <ConfidencePill value={r.confidence} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {model.options.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Competing Architectures
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {model.options.map((option) => {
              const isRecommended = option.id === model.recommendedOptionId;
              return (
                <div
                  key={option.id}
                  className={`rounded-xl border p-3 ${
                    isRecommended
                      ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">{option.label}</p>
                    <ConfidencePill value={option.confidence} />
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-zinc-600">
                    {option.preview}
                  </pre>
                  <p className="mt-2 text-xs text-zinc-500">{option.reason}</p>
                  {isRecommended && (
                    <p className="mt-2 text-xs font-medium text-emerald-700">Recommendation</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Node Confidence & Assumptions
        </h3>
        <ul className="mt-2 space-y-2">
          {model.nodes
            .filter((n) => n.id !== model.rootId)
            .map((n) => (
              <li key={n.id} className={`rounded-lg border px-3 py-2 ${nodeBorder(n.state)}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900">{n.label}</span>
                  <ConfidencePill value={n.confidence} />
                </div>
                {n.annotation && (
                  <p className="mt-1 text-xs text-zinc-500">{n.annotation}</p>
                )}
                {n.assumptions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {n.assumptions.map((a) => (
                      <li key={a.text} className="flex gap-2 text-xs">
                        <span
                          className={
                            a.status === "locked" ? "text-emerald-600" : "text-amber-500"
                          }
                        >
                          {a.status === "locked" ? "✓" : "?"}
                        </span>
                        <span className="text-zinc-700">{a.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </section>

      {pressures.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Architectural Pressure
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Pressure accumulates from evidence — not discussion. Architect asks what reality is
            trying to become.
          </p>
          <div className="mt-3 space-y-4">
            {pressures.map((pressure) => (
              <PressureCard key={`${pressure.nodeId}-${pressure.kind}`} pressure={pressure} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModelTree({ nodes, rootId, parentId = rootId, prefix = "" }: {
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
        const isLast = i === children.length - 1;
        const branch = isLast ? "└── " : "├── ";
        const childPrefix = prefix + (prefix ? (isLast ? "    " : "│   ") : "");
        return (
          <div key={child.id}>
            <div className="text-zinc-800">
              {childPrefix}
              {branch}
              <span
                className={
                  child.state === "proposed"
                    ? "font-semibold text-violet-800"
                    : child.state === "locked"
                      ? "text-emerald-800"
                      : ""
                }
              >
                {child.label}
              </span>
              <span className="text-zinc-400"> ({child.confidence}%)</span>
            </div>
            {child.annotation && (
              <div className={`${childPrefix}${isLast ? "    " : "│   "}    text-zinc-500`}>
                {child.annotation}
              </div>
            )}
            <ModelTree nodes={nodes} rootId={rootId} parentId={child.id} prefix={childPrefix} />
          </div>
        );
      })}
    </div>
  );
}

function ConfidencePill({ value }: { value: number }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${confidenceTone(value)}`}
    >
      {value}%
    </span>
  );
}

function ChangeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    new_node: "NEW",
    boundary_moved: "MOVED",
    new_relationship: "LINK",
    node_split: "SPLIT",
    assumption_locked: "LOCKED",
  };
  return (
    <span className="shrink-0 rounded bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
      {labels[type] ?? type}
    </span>
  );
}

function PressureCard({ pressure }: { pressure: ArchitecturalPressure }) {
  const filled = Math.round(pressure.level / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  const recTone =
    pressure.recommendation === "stable"
      ? "text-emerald-700"
      : pressure.recommendation === "observe"
        ? "text-amber-700"
        : pressure.recommendation === "prepare"
          ? "text-orange-700"
          : "text-violet-700";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{pressure.nodeLabel}</p>
          <p className="text-xs text-zinc-500 capitalize">
            Status: {pressure.status}
          </p>
        </div>
        <ConfidencePill value={pressure.level} />
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {pressure.label}
        </p>
        <p className="mt-1 font-mono text-sm text-zinc-700">
          {bar}{" "}
          <span className="tabular-nums text-zinc-500">{pressure.level}%</span>
        </p>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Evidence</p>
        <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
          {pressure.evidence.map((row) => (
            <li
              key={row.label}
              className="flex justify-between rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
            >
              <span>{row.label}</span>
              <span className="font-semibold tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Recommendation
        </p>
        <p className={`mt-1 text-sm ${recTone}`}>{pressure.recommendationDetail}</p>
      </div>
    </div>
  );
}
