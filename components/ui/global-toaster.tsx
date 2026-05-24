"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/app/theme-provider";

export function GlobalToaster() {
  const { isLightMode } = useTheme();

  return (
    <Toaster
      closeButton
      richColors
      position="top-right"
      theme={isLightMode ? "light" : "dark"}
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}
