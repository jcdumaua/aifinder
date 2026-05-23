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
    <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
        How AiFinder helps you
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {onboardingSteps.map((step) => (
          <div
            key={step.label}
            className="rounded-2xl border border-cyan-400/15 bg-slate-950/35 p-3"
          >
            <p className="text-xs font-black text-cyan-300">{step.label}</p>
            <h3 className="mt-2 text-sm font-black text-white">
              {step.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
