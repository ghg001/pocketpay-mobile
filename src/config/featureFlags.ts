export const FEATURE_FLAGS = {
  // Example flags – set to true/false as needed
  ENABLE_VAULT_EXPERIMENTAL: {
    enabled: true,
    experimental: true,
    description: 'Toggle the experimental Soroban vault implementation.',
  },
  SHOW_DEBUG_PANEL: {
    enabled: false,
    experimental: false,
    description: 'Show a developer debug panel on the wallet screen.',
  },
  ENABLE_NEW_SEND_FLOW: {
    enabled: false,
    experimental: true,
    description: 'Enable the new Send flow prototype.',
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[key].enabled;
};
