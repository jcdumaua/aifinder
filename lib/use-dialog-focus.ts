"use client";

import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const dialogFocusStack: symbol[] = [];

type DialogFocusOptions = {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onEscape: () => void;
  restoreFocus: boolean;
};

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return (
    element.getClientRects().length > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function isFocusable(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  if (element.matches("[disabled], [aria-hidden='true'], [inert]")) return false;
  if (!isVisible(element)) return false;

  return element.matches(FOCUSABLE_SELECTOR);
}

function focusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(isFocusable);
}

function isTopmostDialog(token: symbol) {
  return dialogFocusStack[dialogFocusStack.length - 1] === token;
}

function removeDialogToken(token: symbol) {
  const index = dialogFocusStack.lastIndexOf(token);
  if (index !== -1) dialogFocusStack.splice(index, 1);
}

export function useDialogFocus({
  isOpen,
  containerRef,
  initialFocusRef,
  onEscape,
  restoreFocus,
}: DialogFocusOptions) {
  const tokenRef = useRef(Symbol("aifinder-dialog-focus"));
  const openerRef = useRef<HTMLElement | null>(null);
  const previousOpenRef = useRef(false);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isOpen) {
      previousOpenRef.current = false;
      return;
    }

    const token = tokenRef.current;
    if (!previousOpenRef.current) {
      openerRef.current = isFocusable(document.activeElement)
        ? document.activeElement
        : null;
    }
    previousOpenRef.current = true;
    removeDialogToken(token);
    dialogFocusStack.push(token);

    let focusFrame = 0;
    let focusAttempts = 0;

    function focusInitialControl() {
      if (!isTopmostDialog(token)) return;

      const container = containerRef.current;
      if (!container || !container.isConnected) {
        focusAttempts += 1;
        if (focusAttempts < 5) {
          focusFrame = window.requestAnimationFrame(focusInitialControl);
        }
        return;
      }

      const explicitInitial = initialFocusRef?.current;
      if (explicitInitial && isFocusable(explicitInitial)) {
        explicitInitial.focus();
        return;
      }

      const firstFocusable = focusableElements(container)[0];
      if (firstFocusable) {
        firstFocusable.focus();
        return;
      }

      container.focus();
    }

    focusFrame = window.requestAnimationFrame(focusInitialControl);

    function handleKeyDown(event: KeyboardEvent) {
      if (!isTopmostDialog(token)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const controls = focusableElements(container);
      const firstFocusable = controls[0];
      const lastFocusable = controls[controls.length - 1];

      if (!firstFocusable || !lastFocusable) {
        event.preventDefault();
        container.focus();
        return;
      }

      const activeElement = document.activeElement;
      if (!container.contains(activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
      const wasTopmost = isTopmostDialog(token);
      removeDialogToken(token);

      const opener = openerRef.current;
      openerRef.current = null;
      if (restoreFocus && wasTopmost && opener?.isConnected && isFocusable(opener)) {
        window.requestAnimationFrame(() => {
          if (opener.isConnected && isFocusable(opener)) opener.focus();
        });
      }
    };
  }, [containerRef, initialFocusRef, isOpen, restoreFocus]);
}
