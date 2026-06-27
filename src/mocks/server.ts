import { setupServer } from "msw/native";
import { handlers } from "./handlers";

/**
 * MSW server using the NATIVE integration.
 *
 * msw/native is the correct export for React Native / Expo.
 * It patches the global fetch at the JavaScript level without
 * requiring a browser Service Worker or Node.js http module.
 *
 * ✅ USE    msw/native   → works in React Native managed workflow
 */
export const server = setupServer(...handlers);
