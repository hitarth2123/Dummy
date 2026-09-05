#!/usr/bin/env node
/**
 * scripts/loginPuter.js
 * Performs browser-based login to get a Puter auth token for Node.js usage.
 *
 * Usage:
 *   node scripts/loginPuter.js
 */
const { getAuthToken } = require('@heyputer/puter.js/src/init.cjs');

async function main() {
  console.log('────────────────────────────────────────────');
  console.log('       Puter.js Browser Authentication      ');
  console.log('────────────────────────────────────────────');
  console.log('Opening browser for authentication...\n');

  try {
    const authToken = await getAuthToken();
    console.log('✅ Authentication Successful!\n');
    console.log('Your Puter Auth Token:');
    console.log(`\nputerAuthToken=${authToken}\n`);
    console.log('Add the line above to your server/.env file.');
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
  }
}

main();
