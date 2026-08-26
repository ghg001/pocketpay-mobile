// Manual mock for useAppStore -- provides controllable defaults.
// Individual tests can call (useAppStore as jest.Mock).mockReturnValue
// to override per-test.

const defaultState = {
  contacts: [],
  themeMode: "dark",
  isInitialized: true,
  initializeApp: jest.fn(async () => {}),
  addContact: jest.fn(async () => {}),
  addContactIfUnique: jest.fn(async (contact) => ({
    isDuplicate: false,
    type: "none" as const,
    message: "",
  })),
  removeContact: jest.fn(async () => {}),
  findContactByPublicKey: jest.fn(() => undefined),
  findContactByName: jest.fn(() => undefined),
  findDuplicateContact: jest.fn(() => ({
    isDuplicate: false,
    type: "none" as const,
    message: "",
  })),
  setThemeMode: jest.fn(async () => {}),
};

export const useAppStore = jest.fn(
  (selector?: (state: typeof defaultState) => unknown) =>
    selector ? selector(defaultState) : defaultState,
);

export const normalizePublicKey = (key: string): string =>
  key ? key.trim().toUpperCase() : '';

export function isValidThemeMode(value: unknown): boolean {
  return typeof value === 'string' && ['light', 'dark', 'system'].includes(value);
}