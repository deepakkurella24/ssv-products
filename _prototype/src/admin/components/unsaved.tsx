import { useCallback, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router";
import { ConfirmSheet } from "./sheet";

/**
 * Blocks in-app navigation and tab closing while a form has unsaved changes,
 * asking for confirmation in a bottom sheet.
 */
export function useUnsavedChanges(dirty: boolean) {
  const skip = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !skip.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (dirty && !skip.current) {
          e.preventDefault();
          e.returnValue = "";
        }
      },
      [dirty],
    ),
  );

  const sheet = (
    <ConfirmSheet
      open={blocker.state === "blocked"}
      title="Discard unsaved changes?"
      message="You have changes that haven't been saved yet."
      confirmLabel="Discard changes"
      cancelLabel="Keep editing"
      destructive
      onConfirm={() => blocker.proceed?.()}
      onClose={() => blocker.reset?.()}
    />
  );

  return {
    sheet,
    /** Call before navigating away after a successful save or delete. */
    allowLeave: () => {
      skip.current = true;
    },
  };
}
