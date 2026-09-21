#!/usr/bin/env node
/**
 * scripts/validateEnv.js
 * Pre-start CLI check — validates all required environment variables.
 * Run before starting the server: `node scripts/validateEnv.js`
 *
 * Exit code 0 → all vars valid
 * Exit code 1 → one or more vars missing or invalid (names are printed)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

// Keep this CLI check on the same canonical schema used by server startup.
require('../server/src/config/env');
console.log('\n✅ Environment validation passed — all required variables are set.\n');
