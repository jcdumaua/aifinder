"use client";

import { useLayoutEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyOverscrollBehavior = "";
let originalHtmlOverscrollBehavior = "";
let originalBodyPaddingRight = "";
let originalHtmlScrollBehavior = "";
let lockedScrollX = 0;
let lockedScrollY = 0;

function isInsideScrollableOverlay(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        ".tool-details-modal-scroll, [data-overlay-scroll-container='true']",
      ),
    )
  );
}

function preventBackgroundScroll(event: Event) {
  if (isInsideScrollableOverlay(event.target)) return;
  event.preventDefault();
}

export function useOverlayScrollLock(isLocked: boolean) {
  useLayoutEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      lockedScrollX = window.scrollX;
      lockedScrollY = window.scrollY;

      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyOverscrollBehavior = document.body.style.overscrollBehavior;
      originalHtmlOverscrollBehavior =
        document.documentElement.style.overscrollBehavior;
      originalBodyPaddingRight = document.body.style.paddingRight;
      originalHtmlScrollBehavior =
        document.documentElement.style.scrollBehavior;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "contain";
      document.documentElement.style.overscrollBehavior = "contain";
      document.documentElement.style.scrollBehavior = "auto";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      document.addEventListener("wheel", preventBackgroundScroll, {
        passive: false,
      });
      document.addEventListener("touchmove", preventBackgroundScroll, {
        passive: false,
      });
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overscrollBehavior = originalBodyOverscrollBehavior;
        document.documentElement.style.overscrollBehavior =
          originalHtmlOverscrollBehavior;
        document.documentElement.style.scrollBehavior =
          originalHtmlScrollBehavior;
        document.body.style.paddingRight = originalBodyPaddingRight;
        document.removeEventListener("wheel", preventBackgroundScroll);
        document.removeEventListener("touchmove", preventBackgroundScroll);

        window.scrollTo({
          left: lockedScrollX,
          top: lockedScrollY,
          behavior: "auto",
        });
      }
    };
  }, [isLocked]);
}
