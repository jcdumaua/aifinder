import type {
  ManualStaticHtmlDerivedEvidence,
  ManualStaticHtmlEvidenceReview,
} from "@/lib/discovery-static-html-evidence-results-review";

type ManualStaticHtmlEvidenceResultsReviewProps = {
  panelId: string;
  run: {
    source_id: string | null;
    status: string;
    started_at: string | null;
    finished_at: string | null;
  };
  review: ManualStaticHtmlEvidenceReview;
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

function formatStatus(value: string | null) {
  if (!value) return "—";

  return value.replaceAll("_", " ");
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
      <dd className="mt-1 min-w-0 break-words text-sm font-bold text-slate-800">
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

function EvidenceText({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function EvidenceLinks({ label, links }: { label: string; links: string[] }) {
  if (links.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <ul className="mt-1 space-y-1 text-sm leading-6 text-slate-700">
        {links.map((link) => (
          <li key={link} className="break-all">
            {link}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceHints({ label, hints }: { label: string; hints: string[] }) {
  if (hints.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <ul className="mt-1 flex flex-wrap gap-2 text-sm text-slate-700">
        {hints.map((hint) => (
          <li key={hint} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 break-all">
            {hint}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DerivedEvidence({ evidence }: { evidence: ManualStaticHtmlDerivedEvidence }) {
  return (
    <section className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h5 className="text-sm font-black text-slate-900">Tentative static-derived evidence</h5>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Untrusted derived evidence for human review only. It does not create a candidate.
          </p>
        </div>
        <span className="w-fit rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs font-bold text-cyan-900">
          Tentative
        </span>
      </div>

      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <EvidenceText label="Title" value={evidence.title} />
        <EvidenceText label="Meta description" value={evidence.metaDescription} />
        <EvidenceText label="Open Graph title" value={evidence.openGraphTitle} />
        <EvidenceText
          label="Open Graph description"
          value={evidence.openGraphDescription}
        />
        <EvidenceText label="Canonical URL" value={evidence.canonicalUrl} />
        <EvidenceText label="Product name hint" value={evidence.productNameHint} />
        <EvidenceText label="Company name hint" value={evidence.companyNameHint} />
      </dl>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <EvidenceLinks label="App store links" links={evidence.appStoreLinks} />
        <EvidenceLinks label="Pricing links" links={evidence.pricingLinks} />
        <EvidenceLinks label="Contact links" links={evidence.contactLinks} />
        <EvidenceLinks label="Documentation links" links={evidence.docsLinks} />
        <EvidenceHints label="Category hints" hints={evidence.categoryHints} />
        <EvidenceHints label="AI-tool relevance hints" hints={evidence.aiToolRelevanceHints} />
        <EvidenceHints label="Safety flags" hints={evidence.safetyFlags} />
        <EvidenceText
          label="Evidence truncated"
          value={formatBoolean(evidence.truncated)}
        />
      </div>
    </section>
  );
}

export function ManualStaticHtmlEvidenceResultsReview({
  panelId,
  run,
  review,
}: ManualStaticHtmlEvidenceResultsReviewProps) {
  return (
    <section
      id={panelId}
      aria-labelledby={`${panelId}-heading`}
      className="border-t border-slate-200 bg-slate-50 px-4 py-5"
    >
      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-950">
        Static-derived evidence — tentative. Raw HTML not stored.
      </div>

      <div className="mt-5">
        <h3 id={`${panelId}-heading`} className="text-base font-black text-slate-950">
          Static HTML evidence results
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Read-only derived evidence. No candidates created. Human review required.
        </p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Run status" value={run.status} />
        <SummaryItem label="Source" value={run.source_id || "Manual / unknown"} />
        <SummaryItem label="Executor mode" value={review.executorMode} />
        <SummaryItem label="Execution status" value={formatStatus(review.executionStatus)} />
        <SummaryItem label="Total URLs" value={review.counts.totalUrls} />
        <SummaryItem label="Attempted URLs" value={review.counts.attemptedUrls} />
        <SummaryItem label="Acquired URLs" value={review.counts.acquiredUrls} />
        <SummaryItem
          label="Evidence attempted"
          value={review.counts.evidenceAttemptedUrls}
        />
        <SummaryItem
          label="Evidence produced"
          value={review.counts.evidenceProducedUrls}
        />
        <SummaryItem label="Failed URLs" value={review.counts.failedUrls} />
        <SummaryItem label="Skipped URLs" value={review.counts.skippedUrls} />
        <SummaryItem
          label="All failed"
          value={formatBoolean(review.counts.allFailed)}
        />
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
            label="No LLM/AI analysis performed"
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
          <SafetyFlag label="Raw HTML persisted" value={review.flags.rawHtmlPersisted} />
          <SafetyFlag label="Candidates created" value={review.flags.candidatesCreated} />
          <SafetyFlag label="Dry run" value={review.flags.dryRun} />
          <SafetyFlag
            label="Execution enabled"
            value={review.flags.executionEnabled}
          />
        </dl>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-black text-slate-900">Per-URL evidence</h4>
        {review.evidenceResults.length === 0 ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
            No safe per-URL evidence was recorded for this run.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {review.evidenceResults.map((result, index) => (
              <li key={`${result.hostname || "unknown"}-${index}`}>
                <article className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <h5 className="break-words text-sm font-black text-slate-900">
                        {result.hostname || "Unknown host"}
                      </h5>
                      <p className="mt-1 break-all text-xs leading-5 text-slate-600">
                        {result.normalizedUrl || "Safe URL unavailable"}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2 text-xs font-bold">
                      <span className="max-w-full break-all rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                        {formatStatus(result.status)}
                      </span>
                      <span className="max-w-full break-all rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                        {formatStatus(result.acquisitionStatus)}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryItem label="HTTP" value={result.httpStatus} />
                    <SummaryItem label="Content type" value={result.contentType} />
                    <SummaryItem label="Content length" value={result.contentLengthHeader} />
                    <SummaryItem label="IP family" value={result.resolvedIpFamily} />
                    <SummaryItem label="Bytes read" value={result.bytesRead} />
                    <SummaryItem
                      label="Response truncated"
                      value={formatBoolean(result.responseTruncated)}
                    />
                    <SummaryItem
                      label="Duration"
                      value={result.durationMs === null ? null : `${result.durationMs} ms`}
                    />
                    <SummaryItem label="Error code" value={result.errorCode} />
                    <SummaryItem label="Failure reason" value={result.failureReason} />
                    <SummaryItem
                      label="Extraction status"
                      value={formatStatus(result.extractionStatus)}
                    />
                    <SummaryItem label="Extraction version" value={result.extractionVersion} />
                    <SummaryItem
                      label="Evidence attempted"
                      value={formatBoolean(result.evidenceAttempted)}
                    />
                  </dl>

                  {result.derivedEvidence ? (
                    <DerivedEvidence evidence={result.derivedEvidence} />
                  ) : null}

                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
                    No candidate created. Raw HTML not stored.
                  </p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
