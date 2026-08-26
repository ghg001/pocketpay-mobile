const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  events: require.resolve("events"),
  process: require.resolve("process/browser"),
  buffer: require.resolve("buffer"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Shim Node-only modules for React Native compatibility
  if (moduleName === "eventsource") {
    return {
      filePath: path.resolve(__dirname, "src/shims/eventsource.js"),
      type: "sourceFile",
    };
  }

  // The SDK loads dotenv for Node consumers. Expo injects EXPO_PUBLIC_* variables
  // itself, so resolve dotenv to a no-op instead of bundling Node-only modules.
  if (moduleName === 'dotenv') {
    return {
      filePath: path.resolve(__dirname, 'src/shims/dotenv.js'),
      type: 'sourceFile',
    };
  }

  // @stellar/stellar-sdk's package.json "browser" field points resolverMainFields
  // (['react-native', 'browser', 'main']) at dist/stellar-sdk.min.js, a Webpack/Terser
  // bundle that uses native `#privateField` syntax Hermes can't parse. Force the
  // Babel-compiled Node build instead, which is already down-leveled. As of SDK
  // 16.1.0 that build moved from lib/index.js to lib/cjs/index.js.
  if (moduleName === '@stellar/stellar-sdk') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@stellar/stellar-sdk/lib/cjs/index.js'),
      type: 'sourceFile',
    };
  }

  // Same problem as above, one level down: @stellar/js-xdr's "browser" field
  // (dist/xdr.js) bundles its own private copy of the buffer polyfill via
  // Webpack, isolated from the global.Buffer set up in shim.js — its
  // Buffer.prototype.toString('base64') doesn't produce valid output in this
  // environment. lib/xdr.js references the global Buffer directly instead.
  if (moduleName === '@stellar/js-xdr') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@stellar/js-xdr/lib/xdr.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
