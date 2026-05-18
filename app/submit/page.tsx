"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SubmitToolPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [pricing, setPricing] = useState("");
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function uploadLogoFile(file: File) {
    setIsUploadingLogo(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-logo", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setIsUploadingLogo(false);

    if (!response.ok) {
      alert(result.error || "Failed to upload logo");
      return;
    }

    setLogoUrl(result.logoUrl);
    alert("Logo uploaded successfully.");
  }

  async function submitTool() {
    if (!name || !category || !website || !description) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    const { error } = await supabase.from("submitted_tools").insert([
      {
        name,
        category,
        website,
        logo_url: logoUrl || null,
        pricing,
        description,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        status: "pending",
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setCategory("");
    setWebsite("");
    setLogoUrl("");
    setPricing("");
    setDescription("");
    setSubmitterName("");
    setSubmitterEmail("");

    setSuccessMessage(
      "Thank you! Your tool has been submitted for admin review."
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-6 py-16 text-white">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          Submit AI Tool
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-5xl">
          Submit your AI tool to AiFinder
        </h1>

        <p className="mt-4 text-slate-400">
          Send your tool for review. Approved tools will appear publicly on
          AiFinder.
        </p>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          {successMessage && (
            <div className="mb-6 rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">
              {successMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Tool name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Website URL *"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Logo image URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />

            <label className="cursor-pointer rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center text-sm font-bold text-cyan-200 hover:bg-cyan-400/20">
              {isUploadingLogo ? "Uploading logo..." : "Upload Logo File"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    await uploadLogoFile(file);
                  }

                  event.target.value = "";
                }}
              />
            </label>

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Pricing"
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Your name"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
            />

            <input
              type="email"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Your email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
            />
          </div>

          {logoUrl && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <img
                src={logoUrl}
                alt="Uploaded logo preview"
                className="h-14 w-14 rounded-2xl border border-white/10 bg-white object-contain p-2"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <p className="break-all text-xs text-slate-400">{logoUrl}</p>
            </div>
          )}

          <textarea
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            placeholder="Short description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />

          <button
            onClick={submitTool}
            disabled={isSubmitting || isUploadingLogo}
            className="mt-6 rounded-full bg-cyan-400 px-7 py-4 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </section>
    </main>
  );
}