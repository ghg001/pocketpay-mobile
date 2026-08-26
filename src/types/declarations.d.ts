// Ambient type declarations for third-party libraries and React Native globals when node_modules is not installed

declare module 'react' {
  const React: any;
  export default React;
  export * from 'react';
}

declare module 'react-native' {
  const content: any;
  export default content;
  export * from 'react-native';
}

declare module 'expo-router' {
  const content: any;
  export default content;
  export * from 'expo-router';
}

declare module 'lucide-react-native' {
  const content: any;
  export default content;
  export * from 'lucide-react-native';
}

declare module '@react-native-async-storage/async-storage' {
  const content: any;
  export default content;
  export * from '@react-native-async-storage/async-storage';
}

declare module '@stellar/stellar-sdk' {
  const content: any;
  export default content;
  export * from '@stellar/stellar-sdk';
}

declare module 'expo-crypto' {
  const content: any;
  export default content;
  export * from 'expo-crypto';
}

declare module 'buffer' {
  const content: any;
  export default content;
  export * from 'buffer';
}

declare module 'zustand' {
  const content: any;
  export default content;
  export * from 'zustand';
}

declare module 'zustand/middleware' {
  const content: any;
  export default content;
  export * from 'zustand/middleware';
}

declare module 'react-native-mmkv' {
  const content: any;
  export default content;
  export * from 'react-native-mmkv';
}

declare module 'expo-local-authentication' {
  const content: any;
  export default content;
  export * from 'expo-local-authentication';
}

declare module 'expo-secure-store' {
  const content: any;
  export default content;
  export * from 'expo-secure-store';
}

declare module 'react-native-svg' {
  const content: any;
  export default content;
  export * from 'react-native-svg';
}

declare module 'react-native-qrcode-svg' {
  const content: any;
  export default content;
  export * from 'react-native-qrcode-svg';
}

declare module 'expo-clipboard' {
  const content: any;
  export default content;
  export * from 'expo-clipboard';
}

declare module 'expo-constants' {
  const content: any;
  export default content;
  export * from 'expo-constants';
}

declare module 'expo-linking' {
  const content: any;
  export default content;
  export * from 'expo-linking';
}

declare module 'react-native-safe-area-context' {
  const content: any;
  export default content;
  export * from 'react-native-safe-area-context';
}

declare module 'react-native-screens' {
  const content: any;
  export default content;
  export * from 'react-native-screens';
}

declare module 'text-encoding' {
  const content: any;
  export default content;
  export * from 'text-encoding';
}

// Global ambient variables
declare var process: any;
declare var console: any;
declare var fetch: any;
declare var setTimeout: any;
