const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Bundle the airport seed (assets/airports.dat) as a raw asset instead of
// inlining it into the JS bundle. Loaded once on first launch (PAR-37).
config.resolver.assetExts.push('dat');

module.exports = withNativeWind(config, { input: './src/global.css' });
