export default function Loading() {
  return (
    <main className="ai-product-page flex min-h-dvh items-center justify-center px-4 py-12">
      <div
        className="ai-product-surface rounded-2xl border px-6 py-5 text-center shadow-xl"
        role="status"
        aria-live="polite"
      >
        <p className="ai-product-body font-semibold">Loading AiFinder…</p>
      </div>
    </main>
  );
}
