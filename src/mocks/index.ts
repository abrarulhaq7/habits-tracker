/**
 * MSW Bootstrap — imported at the top of _layout.tsx.
 *
 * Only runs in development (__DEV__).
 * Polyfills MUST be applied before setupServer() is called,
 * so we use require() for guaranteed synchronous load order.
 */
import './polyfills';
import { server } from './server';

if (__DEV__) {
  server.listen({ onUnhandledRequest: 'warn' });
}

