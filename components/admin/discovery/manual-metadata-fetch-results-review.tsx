import {
  normalizeManualMetadataFetchAuditEvents,
  type ManualMetadataFetchReview,
} from "@/lib/discovery-run-results-review";

type ManualMetadataFetchResultsReviewProps = {
  panelId: string;
  run: {
    id: string;
    source_id: string | null;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    audit_events?: unknown;
    audit_warning?: unknown;
  };
  review: ManualMetadataFetchReview;
};

function formatDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(startedAt: string | null, finishedAt: string | null) {
  if (!startedAt || !finishedAt) return "—";

  const startedMs = Date.parse(startedAt);
  const finishedMs = Date.parse(finishedAt);

  if (!Number.isFinite(startedMs) || !Number.isFinite(finishedMs) || finishedMs < startedMs) {
    return "—";
  }

  const durationMs = finishedMs - startedMs;

  if (durationMs < 1_000) return `${durationMs} ms`;
  if (durationMs < 60_000) return `${(durationMs / 1_000).toFixed(1)} s`;

  return `${Math.floor(durationMs / 60_000)}m ${Math.round((durationMs % 60_000) / 1_000)}s`;
}

function formatValue(value: string | number | null) {
  return value === null ? "—" : value;
}

function formatBoolean(value: boolean | null) {
  if (value === null) return "—";

  return value ? "Yes" : "No";
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-all text-sm font-bold text-slate-800">
        {formatValue(value)}
      </dd>
    </div>
  );
}

function SafetyFlag({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <dt className="min-w-0 break-words text-slate-600">{label}</dt>
      <dd className="shrink-0 whitespace-nowrap font-bold text-slate-800">
        {formatBoolean(value)}
      </dd>
    </div>
  );
}

export function ManualMetadataFetchResultsReview({
  panelId,
  run,
  review,
}: ManualMetadataFetchResultsReviewProps) {
  const auditEvents = normalizeManualMetadataFetchAuditEvents(run.audit_events);
  const auditWarning =
    typeof run.audit_warning === "string" && run.audit_warning.length <= 120
      ? run.audit_warning
      : null;

  return (
    <section
      id={panelId}
      aria-labelledby={`${panelId}-heading`}
      className="border-t border-slate-200 bg-slate-50 px-4 py-5"
    >
      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-950">
        Metadata only — no extraction performed.
      </div>

      <div className="mt-5">
        <h3 id={`${panelId}-heading`} className="text-base font-black text-slate-950">
          Manual metadata-fetch results
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Read-only run metadata and safe fetch outcomes.
        </p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Run status" value={run.status} />
        <SummaryItem label="Source" value={run.source_id || "Manual / unknown"} />
        <SummaryItem label="Executor mode" value={review.executorMode} />
        <SummaryItem label="Execution status" value={review.executionStatus} />
        <SummaryItem label="Total URLs" value={review.counts.totalUrls} />
        <SummaryItem label="Processed URLs" value={review.counts.processedUrls} />
        <SummaryItem label="Fetched URLs" value={review.counts.fetchedUrls} />
        <SummaryItem label="Failed URLs" value={review.counts.failedUrls} />
        <SummaryItem label="Skipped URLs" value={review.counts.skippedUrls} />
        <SummaryItem label="Started" value={formatDate(run.started_at)} />
        <SummaryItem label="Finished" value={formatDate(run.finished_at)} />
        <SummaryItem
          label="Duration"
          value={formatDuration(run.started_at, run.finished_at)}
        />
      </dl>

      <div className="mt-6">
        <h4 className="text-sm font-black text-slate-900">Safety flags</h4>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SafetyFlag label="No fetch performed" value={review.flags.noFetchPerformed} />
          <SafetyFlag
            label="No extraction performed"
            value={review.flags.noExtractionPerformed}
          />
          <SafetyFlag
            label="No LLM analysis performed"
            value={review.flags.noLlmAnalysisPerformed}
          />
          <SafetyFlag
            label="No candidates inserted"
            value={review.flags.noCandidatesInserted}
          />
          <SafetyFlag
            label="No public tools inserted"
            value={review.flags.noPublicToolsInserted}
          />
          <SafetyFlag label="Dry run" value={review.flags.dryRun} />
          <SafetyFlag
            label="Execution enabled"
            value={review.flags.executionEnabled}
          />
        </dl>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-black text-slate-900">Per-URL results</h4>
        {review.fetchResults.length === 0 ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
            No per-URL metadata results were recorded for this run.
          </p>
        ) : (
          <div className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 bg-white">
            <table className="min-w-[1440px] table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[150px]" />
                <col className="w-[360px]" />
                <col className="w-[220px]" />
                <col className="w-[70px]" />
                <col className="w-[150px]" />
                <col className="w-[100px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
                <col className="w-[150px]" />
                <col className="w-[190px]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Host</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">URL</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Status</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">HTTP</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Content type</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Length</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">IP family</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Bytes</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Truncated</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Duration</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Error code</th>
                  <th className="whitespace-nowrap px-3 py-3 font-bold">Failure reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {review.fetchResults.map((fetchResult, index) => (
                  <tr key={`${fetchResult.hostname || "unknown"}-${index}`}>
                    <td className="break-words px-3 py-3 font-semibold">
                      {formatValue(fetchResult.hostname)}
                    </td>
                    <td className="break-words px-3 py-3">
                      {formatValue(fetchResult.normalizedUrl)}
                    </td>
                    <td className="break-words px-3 py-3">{formatValue(fetchResult.status)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatValue(fetchResult.httpStatus)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatValue(fetchResult.contentType)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatValue(fetchResult.contentLengthHeader)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatValue(fetchResult.resolvedIpFamily)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{formatValue(fetchResult.bytesRead)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatBoolean(fetchResult.responseTruncated)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {fetchResult.durationMs === null
                        ? "—"
                        : `${fetchResult.durationMs} ms`}
                    </td>
                    <td className="break-words px-3 py-3">{formatValue(fetchResult.errorCode)}</td>
                    <td className="break-words px-3 py-3">
                      {formatValue(fetchResult.failureReason)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-black text-slate-900">Audit timeline</h4>
        {auditWarning ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            {auditWarning}
          </p>
        ) : auditEvents.length === 0 ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
            No manual metadata-fetch audit events were available for this run.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {auditEvents.map((event, index) => (
              <li
                key={`${event.eventType}-${event.createdAt || "unknown"}-${index}`}
                className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{event.message}</p>
                    <p className="mt-1 break-all text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {event.eventType}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-500">{formatDate(event.createdAt)}</time>
                </div>
                <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  {event.status ? <span className="break-all">Status: {event.status}</span> : null}
                  {event.hostname ? <span className="break-words">Host: {event.hostname}</span> : null}
                  {event.errorCode ? <span className="break-all">Error: {event.errorCode}</span> : null}
                  {event.failureReason ? <span className="break-all">Reason: {event.failureReason}</span> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
