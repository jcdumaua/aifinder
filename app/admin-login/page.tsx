"use client";

import { useEffect, useState } from "react";
import { useOverlayScrollLock } from "@/lib/use-overlay-scroll-lock";

type PopupMessage = {
  type: "success" | "error";
  title: string;
  message: string;
};

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [popup, setPopup] = useState<PopupMessage | null>(null);

  useOverlayScrollLock(Boolean(popup));

  function showError(message: string, title = "Admin Access Denied") {
    setPopup({
      type: "error",
      title,
      message,
    });
  }

  function getRedirectPath() {
    if (typeof window === "undefined") return "/admin";

    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");

    if (from && from.startsWith("/admin")) {
      return from;
    }

    return "/admin";
  }

  async function checkAdminSession() {
    setIsCheckingSession(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.authenticated) {
        window.location.replace(getRedirectPath());
        return;
      }
    } catch {
      // Stay on login page.
    } finally {
      setIsCheckingSession(false);
    }
  }

  async function unlockAdmin() {
    if (!password.trim()) {
      showError("Please enter the admin password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        showError(result?.error || "Wrong password. Please try again.");
        return;
      }

      setPassword("");
      window.location.replace(getRedirectPath());
    } catch {
      showError("Admin login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  useEffect(() => {
    checkAdminSession();
  }, []);

  const messagePopup = popup && (
    <div
      className="aifinder-responsive-modal-backdrop fixed inset-0 z-[9999] flex w-screen items-center justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="aifinder-responsive-modal-panel ai-corner-safe-panel relative isolate max-w-md overflow-hidden rounded-[2rem] border border-red-400/30 bg-slate-950 p-5 text-center shadow-2xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-slate-950" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(circle_at_20%_0%,rgba(248,113,113,0.16),transparent_34%),linear-gradient(135deg,rgba(248,113,113,0.08),rgba(15,23,42,0.02),rgba(2,6,23,0))]" />
        <div className="relative z-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/15 text-4xl font-black text-red-300">
          !
        </div>

        <h2 className="mt-5 text-2xl font-black text-white">
          {popup.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {popup.message}
        </p>

        <button
          onClick={() => setPopup(null)}
          className="mt-6 rounded-full bg-red-400 px-7 py-3 text-sm font-bold text-slate-950 hover:bg-red-300"
        >
          OK
        </button>
        </div>
      </div>
    </div>
  );

  if (isCheckingSession) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            AiFinder Admin
          </p>

          <h1 className="mt-3 text-3xl font-black">Checking session...</h1>

          <p className="mt-4 text-sm text-slate-400">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 text-white">
      {messagePopup}

      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          Admin Access
        </p>

        <h1 className="mt-3 text-4xl font-black">AiFinder Admin</h1>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          Enter the admin password to continue.
        </p>

        <input suppressHydrationWarning
          type="password"
          placeholder="Admin password"
          value={password}
          disabled={isLoggingIn}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isLoggingIn) {
              unlockAdmin();
            }
          }}
          className="mt-6 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          onClick={unlockAdmin}
          disabled={isLoggingIn}
          className="mt-4 w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingIn ? "Checking..." : "Unlock Dashboard"}
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Admin password is checked securely on the server. A secure cookie
          session is used after login.
        </p>
      </div>
    </main>
  );
}
