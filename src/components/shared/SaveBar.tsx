"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Floating bar for forms that save explicitly: shows "unsaved changes" with
 * Discard / Save, then a brief "Saved". Also warns before leaving the page.
 */
export function SaveBar({
  dirty,
  saving,
  saved,
  error,
  canSave = true,
  onDiscard,
  onSavedShown,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error?: string;
  canSave?: boolean;
  onDiscard: () => void;
  /** Called after "Saved" has been on screen for a moment */
  onSavedShown: () => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(onSavedShown, 2500);
    return () => clearTimeout(t);
  }, [saved, onSavedShown]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  return (
    <AnimatePresence>
      {(dirty || saved || error) && (
        <motion.div
          className="hp-bar glass-strong"
          role="status"
          initial={reduce ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          {error ? (
            <span className="hp-bar-msg bad">{error}</span>
          ) : dirty ? (
            <span className="hp-bar-msg">You have unsaved changes</span>
          ) : (
            <span className="hp-bar-msg good"><Check size={15} /> Saved</span>
          )}
          {dirty && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={onDiscard}>Discard</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !canSave}>{saving ? "Saving…" : "Save changes"}</button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
