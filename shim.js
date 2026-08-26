import "react-native-get-random-values";
import * as ExpoCrypto from "expo-crypto";
import "text-encoding";
import { Buffer } from "buffer";

global.Buffer = Buffer;

// Hermes's TypedArray methods (subarray/slice/map/filter) don't follow the
// ECMAScript SpeciesConstructor spec (facebook/hermes#1495), so calling
// .subarray() on a Buffer returns a plain Uint8Array instead of a Buffer,
// silently losing Buffer.prototype.toString's encoding support (e.g.
// 'base64' is ignored, falling back to a comma-joined byte list). The
// buffer package already works around this for its own .slice(), but
// @stellar/js-xdr's XdrWriter.finalize() calls the native .subarray()
// directly. Re-apply Buffer's prototype whenever subarray is called on
// something that was already a Buffer.
{
  const originalSubarray = Uint8Array.prototype.subarray;
  Uint8Array.prototype.subarray = function patchedSubarray(...args) {
    const result = originalSubarray.apply(this, args);
    if (Object.getPrototypeOf(this) === Buffer.prototype) {
      Object.setPrototypeOf(result, Buffer.prototype);
    }
    return result;
  };
}

if (
  typeof global.crypto !== "object" ||
  typeof global.crypto.getRandomValues !== "function"
) {
  const cryptoPolyfill = {
    ...(typeof global.crypto === "object" ? global.crypto : null),
    getRandomValues: (array) => ExpoCrypto.getRandomValues(array),
  };
  try {
    Object.defineProperty(global, "crypto", {
      configurable: true,
      enumerable: true,
      value: cryptoPolyfill,
    });
  } catch (e) {
    global.crypto = cryptoPolyfill;
  }
}

console.log(
  "[shim] crypto.getRandomValues installed:",
  typeof global.crypto === "object" &&
    typeof global.crypto.getRandomValues === "function",
);

// Polyfill AbortSignal.timeout for the Stellar SDK's fetch-based HTTP client
// (via the feaxios dependency, which calls it unguarded). Hermes has
// AbortController/AbortSignal but not this newer static helper.
if (
  typeof AbortSignal !== "undefined" &&
  typeof AbortSignal.timeout !== "function"
) {
  AbortSignal.timeout = function timeout(ms) {
    const controller = new AbortController();
    setTimeout(() => {
      const reason =
        typeof DOMException !== "undefined"
          ? new DOMException("The operation timed out.", "TimeoutError")
          : Object.assign(new Error("The operation timed out."), {
              name: "TimeoutError",
            });
      controller.abort(reason);
    }, ms);
    return controller.signal;
  };
}

// React Native's fetch does not know how to serialize a URLSearchParams body
// (convertRequestBody.js only recognizes string/Blob/FormData/ArrayBuffer) —
// it silently sends an empty body instead. The Stellar SDK's HTTP client
// (feaxios) converts urlencoded string bodies into URLSearchParams, which is
// how submitTransaction's `tx=<xdr>` payload was arriving at Horizon empty.
// Stringify it back before it reaches RN's fetch.
if (typeof global.fetch === "function") {
  const originalFetch = global.fetch;
  global.fetch = function patchedFetch(input, init) {
    if (
      init &&
      typeof URLSearchParams !== "undefined" &&
      init.body instanceof URLSearchParams
    ) {
      init = { ...init, body: init.body.toString() };
    }
    return originalFetch(input, init);
  };
}

// Polyfill process for Stellar SDK.
// 'process/browser' avoids Metro treating this as the Node built-in module.
const bProcess = require("process/browser");
if (typeof process === "undefined") {
  global.process = bProcess;
} else {
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

// Polyfill global env
if (!global.process.env) {
  global.process.env = {};
}
global.process.env.NODE_ENV = __DEV__ ? "development" : "production";
