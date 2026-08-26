import { validateScanPay, describeScanPay } from "@/features/payments";

const VALID_ADDRESS = "G".padEnd(56, "A"); // 56-char Stellar-style key starting with G
const OTHER_ADDRESS = "G".padEnd(56, "B");

describe("validateScanPay", () => {
  it("accepts a bare valid Stellar address", () => {
    const r = validateScanPay(VALID_ADDRESS);
    expect(r.isPaymentRequest).toBe(false);
    expect(r.destination).toBe(VALID_ADDRESS);
    expect(r.amount).toBeNull();
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects an empty / whitespace scan", () => {
    const r = validateScanPay("   ");
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field === "payload")).toBe(true);
  });

  it("rejects a malformed destination", () => {
    const r = validateScanPay("not-an-address");
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field === "destination")).toBe(true);
  });

  it("does not trust the scan: never signs or submits", () => {
    // Even a fully valid scan must not produce anything executable here.
    const r = validateScanPay(VALID_ADDRESS);
    expect(r.isValid).toBe(true);
    expect(r.raw).toBe(VALID_ADDRESS); // raw kept, not transformed into a tx
  });

  it("parses a SEP-0007 payment request URI", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&amount=10.5&memo=invoice-9&memo_type=MEMO_TEXT`;
    const r = validateScanPay(uri);
    expect(r.isPaymentRequest).toBe(true);
    expect(r.destination).toBe(VALID_ADDRESS);
    expect(r.amount).toBe("10.5");
    expect(r.memo).toBe("invoice-9");
    expect(r.memoType).toBe("MEMO_TEXT");
    expect(r.isValid).toBe(true);
  });

  it("flags an invalid amount in a payment request", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&amount=-5`;
    const r = validateScanPay(uri);
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("flags an amount above balance as invalid", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&amount=999`;
    const r = validateScanPay(uri, { balance: "10" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("flags a self-payment (own address) as invalid", () => {
    const r = validateScanPay(VALID_ADDRESS, { ownPublicKey: VALID_ADDRESS });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field === "destination")).toBe(true);
  });

  it("drops a lone asset code without issuer (ambiguous)", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&asset_code=USDC`;
    const r = validateScanPay(uri);
    expect(r.assetCode).toBeNull();
    expect(r.errors.some((e) => e.field === "asset")).toBe(true);
  });

  it("accepts a valid asset (code + issuer)", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&asset_code=USDC&asset_issuer=${OTHER_ADDRESS}`;
    const r = validateScanPay(uri);
    expect(r.assetCode).toBe("USDC");
    expect(r.assetIssuer).toBe(OTHER_ADDRESS);
    expect(r.isValid).toBe(true);
  });

  it("flags an invalid asset issuer", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&asset_code=USDC&asset_issuer=not-an-address`;
    const r = validateScanPay(uri);
    expect(r.errors.some((e) => e.field === "asset")).toBe(true);
  });

  it("flags an oversized memo (> 28 bytes)", () => {
    const longMemo = "x".repeat(40);
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&memo=${longMemo}`;
    const r = validateScanPay(uri);
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field === "memo")).toBe(true);
  });

  it("flags an unknown memo type", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&memo=hi&memo_type=MEMO_BOGUS`;
    const r = validateScanPay(uri);
    expect(r.errors.some((e) => e.field === "memo")).toBe(true);
  });

  it("collects multiple errors at once without throwing", () => {
    const uri = `web+stellar:pay?destination=bad&amount=-1&asset_code=USDC`;
    const r = validateScanPay(uri);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("describeScanPay", () => {
  it("summarises parsed fields for display, — when absent", () => {
    const r = validateScanPay(VALID_ADDRESS);
    const d = describeScanPay(r);
    expect(d.destination).toBe(VALID_ADDRESS);
    expect(d.amount).toBeNull();
    expect(d.asset).toBeNull();
  });

  it("joins asset code + issuer", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&asset_code=USDC&asset_issuer=${OTHER_ADDRESS}`;
    const d = describeScanPay(validateScanPay(uri));
    expect(d.asset).toBe(`USDC:${OTHER_ADDRESS}`);
  });

  it("renders memo with its type", () => {
    const uri = `web+stellar:pay?destination=${VALID_ADDRESS}&memo=pay&memo_type=MEMO_TEXT`;
    const d = describeScanPay(validateScanPay(uri));
    expect(d.memo).toBe("pay (MEMO_TEXT)");
  });
});
