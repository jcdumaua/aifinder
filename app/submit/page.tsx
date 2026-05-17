"use client";

import Link from "next/link";
import { useTheme } from "../theme-provider";

export default function SubmitToolPage() {
  const { isLightMode, toggleTheme } = useTheme();

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  const inputBg = isLightMode
    ? "bg-white border-slate-300 text-slate-950 placeholder:text-slate-400"
    : "bg-black/30 border-white/10 text-white placeholder:text-slate-500";

  const softText = isLightMode ? "text-slate-600" : "text-slate-300";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Back Home
          </Link>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <div className={`mt-8 overflow-hidden rounded-[2rem] border ${cardBg}`}>
          <div className="relative border-b border-white/10 p-6 sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                Submit a Tool
              </p>

              <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                Suggest an AI Tool
              </h1>

              <p className={`mt-4 max-w-2xl text-lg leading-8 ${softText}`}>
                Help grow AiFinder by submitting useful AI tools for review.
                Add the website, app links, pricing, category, and a short
                description.
              </p>
            </div>
          </div>

          <form
            action="https://formspree.io/f/YOUR_FORM_ID"
            method="POST"
            className="space-y-6 p-6 sm:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Tool Name"
                name="toolName"
                placeholder="ChatGPT"
                inputBg={inputBg}
              />

              <Field
                label="Website URL"
                name="website"
                type="url"
                placeholder="https://example.com"
                inputBg={inputBg}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-400">
                  Category
                </label>

                <select
                  name="category"
                  className={`mt-2 w-full rounded-2xl border px-5 py-4 outline-none focus:border-cyan-400 ${inputBg}`}
                >
                  <option>Chatbots</option>
                  <option>Research</option>
                  <option>Image AI</option>
                  <option>Video AI</option>
                  <option>Voice AI</option>
                  <option>Music AI</option>
                  <option>Coding</option>
                  <option>Writing</option>
                  <option>Productivity</option>
                  <option>Automation</option>
                  <option>Website Builders</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-400">
                  Pricing
                </label>

                <select
                  name="pricing"
                  className={`mt-2 w-full rounded-2xl border px-5 py-4 outline-none focus:border-cyan-400 ${inputBg}`}
                >
                  <option>Free</option>
                  <option>Paid</option>
                  <option>Free + Paid</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="iOS App Store Link"
                name="ios"
                type="url"
                placeholder="https://apps.apple.com/..."
                inputBg={inputBg}
              />

              <Field
                label="Android Play Store Link"
                name="android"
                type="url"
                placeholder="https://play.google.com/..."
                inputBg={inputBg}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-400">
                Platforms
              </label>

              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                {["Web", "iOS", "Android", "Desktop"].map((platform) => (
                  <label
                    key={platform}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${cardBg}`}
                  >
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      className="h-4 w-4"
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-400">
                Short Description
              </label>

              <textarea
                name="description"
                required
                rows={5}
                placeholder="What does this AI tool do?"
                className={`mt-2 w-full rounded-2xl border px-5 py-4 outline-none focus:border-cyan-400 ${inputBg}`}
              />
            </div>

            <Field
              label="Best For"
              name="bestFor"
              placeholder="Example: AI writing, video editing, research"
              inputBg={inputBg}
            />

            <Field
              label="Use Cases"
              name="useCases"
              placeholder="Example: Writing, Research, Productivity"
              inputBg={inputBg}
            />

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-sm leading-7 text-cyan-200">
              For now, this form is ready for Formspree. Replace{" "}
              <span className="font-bold">YOUR_FORM_ID</span> with your
              Formspree form ID later so submissions go to your email.
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-slate-200"
            >
              Submit Tool for Review
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  inputBg,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  inputBg: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-400">{label}</label>

      <input
        name={name}
        type={type}
        required={name === "toolName" || name === "website"}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-2xl border px-5 py-4 outline-none focus:border-cyan-400 ${inputBg}`}
      />
    </div>
  );
}