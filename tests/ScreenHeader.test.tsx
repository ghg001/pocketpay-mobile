/**
 * ScreenHeader – component tests
 *
 * Acceptance criteria covered:
 *  AC-SH1 – Renders the title.
 *  AC-SH2 – Renders the subtitle when provided.
 *  AC-SH3 – Does not render a subtitle node when omitted.
 *  AC-SH4 – Renders provided actions.
 *  AC-SH5 – Does not render an actions wrapper when omitted.
 */

import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { DARK_COLORS } from "../src/constants/theme";

// ScreenHeader pulls in useTheme -> appStore -> AsyncStorage. AsyncStorage's
// native module isn't available under Jest, so we mock useTheme directly
// (same approach the repo already uses for lucide-react-native icons) rather
// than pulling AsyncStorage mocking into scope for this component test.
jest.mock("../src/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: require("../src/constants/theme").DARK_COLORS,
    isDark: true,
    themeMode: "dark",
    setThemeMode: jest.fn(),
  }),
}));

import { ScreenHeader } from "../src/components/ScreenHeader";

describe("AC-SH1 – renders the title", () => {
  it("shows the title text", () => {
    const { getByText } = render(<ScreenHeader title="Send XLM" />);
    expect(getByText("Send XLM")).toBeTruthy();
  });
});

describe("AC-SH2 – renders the subtitle when provided", () => {
  it("shows the subtitle text", () => {
    const { getByText } = render(
      <ScreenHeader title="Send XLM" subtitle="Available Balance: 100 XLM" />,
    );
    expect(getByText("Available Balance: 100 XLM")).toBeTruthy();
  });
});

describe("AC-SH3 – no subtitle node when omitted", () => {
  it("does not render the subtitle testID when subtitle is not passed", () => {
    const { queryByTestId } = render(<ScreenHeader title="Send XLM" />);
    expect(queryByTestId("screen-header-subtitle")).toBeNull();
  });
});

describe("AC-SH4 – renders provided actions", () => {
  it("shows a custom action node", () => {
    const { getByText } = render(
      <ScreenHeader title="Vault" actions={<Text>Edit</Text>} />,
    );
    expect(getByText("Edit")).toBeTruthy();
  });
});

describe("AC-SH5 – no actions wrapper when omitted", () => {
  it("does not render the actions testID when actions is not passed", () => {
    const { queryByTestId } = render(<ScreenHeader title="Vault" />);
    expect(queryByTestId("screen-header-actions")).toBeNull();
  });
});
