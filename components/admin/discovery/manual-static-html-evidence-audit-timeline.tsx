import type { ManualStaticHtmlEvidenceAuditEvent } from "@/lib/discovery-static-html-evidence-audit-review";

type ManualStaticHtmlEvidenceAuditTimelineProps = {
  events: ManualStaticHtmlEvidenceAuditEvent[];
  warning?: string | null;
};

function formatDate(value: string) {
  if (!Number.isFinite(Date.parse(value))) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value: string | null) {
  if (!value) return null;

  return value.replaceAll("_", " ");
}

function formatBooleanFlag({
  falseLabel,
  trueLabel,
  value,
}: {
  falseLabel: string;
  trueLabel: string;
  value: boolean | null;
}) {
  if (value === null) return null;

  return value ? trueLabel : falseLabel;
}

function TimelineDetail({ label, value }: { label: string; value: string | number | null }) {
  if (value === null) return null;

  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value}
      </dd>
    </div>
  );
}

function SafetyChip({ label }: { label: string }) {
  return (
    <li className="max-w-full rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 break-words">
      {label}
    </li>
  );
}

function TimelineEvent({ event }: { event: ManualStaticHtmlEvidenceAuditEvent }) {
  const safetyLabels = [
    formatBooleanFlag({
      value: event.rawHtmlPersisted,
      falseLabel: "Raw HTML not persisted",
      trueLabel: "Raw HTML persisted",
    }),
    formatBooleanFlag({
      value: event.candidatesCreated,
      falseLabel: "No candidates created",
      trueLabel: "Candidates created",
    }),
    formatBooleanFlag({
      value: event.publicToolsInserted,
      falseLabel: "No public tools inserted",
      trueLabel: "Public tools inserted",
    }),
    formatBooleanFlag({
      value: event.llmAnalysisPerformed,
      falseLabel: "No LLM/AI analysis performed",
      trueLabel: "LLM/AI analysis performed",
    }),
  ].filter((label): label is string => Boolean(label));

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h5 className="break-words text-sm font-black text-slate-900">
            {event.label}
          </h5>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatDate(event.createdAt)}
          </p>
        </div>

        <span className="w-fit max-w-full rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-900 break-words">
          {event.statusLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TimelineDetail label="Event type" value={event.eventType} />
        <TimelineDetail label="URL index" value={event.urlIndex} />
        <TimelineDetail label="URL count" value={event.urlCount} />
        <TimelineDetail
          label="Acquisition status"
          value={formatStatus(event.acquisitionStatus)}
        />
        <TimelineDetail
          label="Evidence status"
          value={formatStatus(event.evidenceStatus)}
        />
        <TimelineDetail label="Failure code" value={event.failureCode} />
        <TimelineDetail
          label="Failure reason"
          value={formatStatus(event.failureReason)}
        />
      </dl>

      {safetyLabels.length > 0 ? (
        <ul className="mt-4 flex min-w-0 flex-wrap gap-2">
          {safetyLabels.map((label) => (
            <SafetyChip key={label} label={label} />
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function ManualStaticHtmlEvidenceAuditTimeline({
  events,
  warning = null,
}: ManualStaticHtmlEvidenceAuditTimelineProps) {
  return (
    <section
      aria-labelledby="manual-static-html-evidence-audit-timeline-heading"
      className="border-t border-slate-200 bg-slate-50 px-4 py-5"
    >
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
        <h4
          id="manual-static-html-evidence-audit-timeline-heading"
          className="text-sm font-black text-slate-900"
        >
          Static evidence audit timeline
        </h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Operational/safety audit records for this static evidence run. These
          records are not candidate evidence and do not approve or publish a tool.
        </p>
      </div>

      {warning ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-900">
          {warning}
        </p>
      ) : null}

      {events.length === 0 ? (
        <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
          No static evidence audit events are available for this run.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {events.map((event) => (
            <li key={`${event.eventType}-${event.createdAt}-${event.urlIndex ?? "run"}`}>
              <TimelineEvent event={event} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
