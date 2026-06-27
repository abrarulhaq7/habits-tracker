// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * Enable package.json "exports" field resolution.
 *
 * Required for msw — its subpath exports (msw/native, msw/node, etc.)
 * use the "exports" field in package.json to route to the correct
 * platform-specific build. Without this flag Metro falls back to
 * file-based resolution which fails for these packages.
 */
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
