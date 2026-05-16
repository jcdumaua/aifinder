import Link from "next/link";

export default function SubmitToolPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Back Home
          </Link>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            Submit a Tool
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Suggest an AI Tool
          </h1>

          <p className="mt-4 text-slate-300">
            Know an AI tool that should be listed on AiFinder? Submit it below.
          </p>

          <form className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-300">
                Tool Name
              </label>
              <input
                type="text"
                placeholder="Example: ChatGPT"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-300">
                Website URL
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-300">
                Category
              </label>
              <select className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none focus:border-cyan-400">
                <option>Chatbots</option>
                <option>Image AI</option>
                <option>Video AI</option>
                <option>Voice AI</option>
                <option>Music AI</option>
                <option>Coding</option>
                <option>Writing</option>
                <option>Productivity</option>
                <option>Automation</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-300">
                Short Description
              </label>
              <textarea
                placeholder="What does this AI tool do?"
                rows={5}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <button
              type="button"
              className="w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-slate-200"
            >
              Submit Tool
            </button>

            <p className="text-center text-xs text-slate-500">
              For now, this is a front-end form only. Later we’ll connect it to a database.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}