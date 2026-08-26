import { useCallback, useMemo, useState } from "react";
import {
  validateScanPay,
  describeScanPay,
  type ScanPayReview,
} from "./scanPayPayload";

export type ScanPayStage = "idle" | "review" | "cancelled";

export interface ScanPayReviewController {
  /** The current validated review model (null until a scan arrives). */
  review: ScanPayReview | null;
  /** Derived, display-ready field summaries. */
  description: ReturnType<typeof describeScanPay> | null;
  /** Current stage of the scan-to-pay flow. */
  stage: ScanPayStage;
  /** Feed a freshly scanned string; moves to `review` (or stays idle on empty). */
  onScan: (raw: string) => void;
  /** User confirms the review and proceeds to payment creation. */
  onConfirm: () => void;
  /** User cancels before any payment intent is created or signed. */
  onCancel: () => void;
  /** Reset entirely (e.g. after a successful handoff). */
  reset: () => void;
}

/**
 * Drives the QR scan -> review -> cancel/confirm flow for issue #407.
 * Deliberately does NOT create a payment intent or sign anything; it only
 * holds validated state until the user explicitly confirms, at which point the
 * caller is responsible for handing off to the existing send flow.
 */
export function useScanPayReview(opts: {
  ownPublicKey?: string | null;
  balance?: string;
} = {}): ScanPayReviewController {
  const [review, setReview] = useState<ScanPayReview | null>(null);
  const [stage, setStage] = useState<ScanPayStage>("idle");

  const onScan = useCallback(
    (raw: string) => {
      const next = validateScanPay(raw, {
        ownPublicKey: opts.ownPublicKey,
        balance: opts.balance,
      });
      setReview(next);
      // Even an invalid scan is shown on the review screen so the user can
      // see WHY it was rejected rather than silently looping the scanner.
      setStage(next.raw.trim() ? "review" : "idle");
    },
    [opts.ownPublicKey, opts.balance],
  );

  const onConfirm = useCallback(() => {
    // No side effects here: confirmation is the caller's handoff point.
    // We only guard that there is a valid review to confirm.
    if (review?.isValid) {
      setStage("review"); // stays review; caller navigates away
    }
  }, [review]);

  const onCancel = useCallback(() => {
    setStage("cancelled");
    setReview(null);
  }, []);

  const reset = useCallback(() => {
    setReview(null);
    setStage("idle");
  }, []);

  const description = useMemo(
    () => (review ? describeScanPay(review) : null),
    [review],
  );

  return {
    review,
    description,
    stage,
    onScan,
    onConfirm,
    onCancel,
    reset,
  };
}
