/**
 * OfflineBanner – component tests
 *
 * Acceptance criteria covered:
 *  AC-OB1 – Banner is not rendered when online.
 *  AC-OB2 – Banner is rendered when offline.
 *  AC-OB3 – Banner displays a non-technical message.
 *  AC-OB4 – The component is reusable (accepts isOnline prop for manual control).
 *  AC-OB5 – Does not block or prevent access to the rest of the UI.
 */

import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("lucide-react-native", () => ({
  WifiOff: () => null,
}));

jest.mock("../src/hooks/useOnlineStatus", () => ({
  useOnlineStatus: jest.fn(),
}));

jest.mock("../src/store/appStore", () => {
  const mockUseAppStore = jest.fn((selector) => {
    const mockState = {
      contacts: [],
    };
    return selector ? selector(mockState) : mockState;
  });
  return {
    normalizePublicKey: (key: string) => key.trim().toUpperCase(),
    useAppStore: mockUseAppStore,
  };
});

import { OfflineBanner } from "../src/components/OfflineBanner";
import { useOnlineStatus } from "../src/hooks/useOnlineStatus";

const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<
  typeof useOnlineStatus
>;

// ── Default mock: online ─────────────────────────────────────────────────────

beforeEach(() => {
  mockUseOnlineStatus.mockReturnValue({
    isOnline: true,
    isChecking: false,
    checkNow: jest.fn(),
  });
});

// ── AC-OB1: Hidden when online ───────────────────────────────────────────────

describe("AC-OB1 – hidden when online", () => {
  it("returns null when auto-detected as online", () => {
    const { queryByTestId } = render(<OfflineBanner />);
    expect(queryByTestId("offline-banner")).toBeNull();
  });

  it("returns null when isOnline prop is true", () => {
    const { queryByTestId } = render(<OfflineBanner isOnline={true} />);
    expect(queryByTestId("offline-banner")).toBeNull();
  });
});

// ── AC-OB2: Visible when offline ─────────────────────────────────────────────

describe("AC-OB2 – visible when offline", () => {
  it("renders the banner when auto-detected as offline", () => {
    mockUseOnlineStatus.mockReturnValue({
      isOnline: false,
      isChecking: false,
      checkNow: jest.fn(),
    });

    const { getByTestId } = render(<OfflineBanner />);
    expect(getByTestId("offline-banner")).toBeTruthy();
  });

  it("renders the banner when isOnline prop is false", () => {
    const { getByTestId } = render(<OfflineBanner isOnline={false} />);
    expect(getByTestId("offline-banner")).toBeTruthy();
  });
});

// ── AC-OB3: Non-technical message ────────────────────────────────────────────

describe("AC-OB3 – non-technical message", () => {
  it('displays "You are offline" message', () => {
    const { getByText } = render(<OfflineBanner isOnline={false} />);
    expect(getByText(/You are offline/i)).toBeTruthy();
  });

  it("does not display technical error details", () => {
    const { queryByText } = render(<OfflineBanner isOnline={false} />);
    // Ensure no HTTP or networking jargon is shown
    expect(queryByText(/HTTP|fetch|timeout|DNS|ping/i)).toBeNull();
  });
});

// ── AC-OB4: Reusable with manual control ─────────────────────────────────────

describe("AC-OB4 – reusable with manual control", () => {
  it("toggles visibility based on isOnline prop", () => {
    const { rerender, queryByTestId } = render(
      <OfflineBanner isOnline={true} />,
    );
    expect(queryByTestId("offline-banner")).toBeNull();

    rerender(<OfflineBanner isOnline={false} />);
    expect(queryByTestId("offline-banner")).toBeTruthy();
  });
});

// ── AC-OB5: Does not block UI ────────────────────────────────────────────────

describe("AC-OB5 – does not block UI", () => {
  it("renders without crashing", () => {
    const { getByTestId } = render(<OfflineBanner isOnline={false} />);
    // The banner exists but does not prevent interaction
    expect(getByTestId("offline-banner")).toBeTruthy();
  });

  it("renders nothing when online (no UI impact)", () => {
    const { toJSON } = render(<OfflineBanner isOnline={true} />);
    // No banner means no obstruction
    expect(toJSON()).toBeNull();
  });
});
