/**
 * Firebase 9+ exposes typings via package.json "exports". TypeScript 4.x with
 * "moduleResolution": "node" resolves `firebase/firestore` to the CJS bundle
 * and misses those types (TS7016). This ambient module restores checking.
 */
declare module 'firebase/firestore';
