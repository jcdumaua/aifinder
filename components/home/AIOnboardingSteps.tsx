const onboardingSteps = [
  {
    label: "01",
    title: "Tell AiFinder what you need",
    text: "Start with a goal, task, category, or workflow.",
  },
  {
    label: "02",
    title: "Discover matched AI tools",
    text: "Scan focused results shaped around your intent.",
  },
  {
    label: "03",
    title: "Compare and choose the best option",
    text: "Shortlist tools and decide with clearer context.",
  },
];

export function AIOnboardingSteps() {
  return (
    <section className="ai-product-surface-soft mt-4 rounded-3xl border p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 [.theme-light_&]:text-cyan-800">
        How AiFinder helps you
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {onboardingSteps.map((step) => (
          <div
            key={step.label}
            className="rounded-2xl border border-cyan-400/15 bg-slate-950/20 p-3 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/85 [.theme-light_&]:shadow-sm"
          >
            <p className="text-xs font-black text-cyan-300 [.theme-light_&]:text-cyan-800">{step.label}</p>
            <h3 className="ai-product-heading mt-2 text-sm font-black">
              {step.title}
            </h3>
            <p className="ai-product-muted mt-1 text-xs leading-5">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
