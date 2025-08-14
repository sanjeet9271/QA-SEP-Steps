#!/usr/bin/env node
/**
 * CLI to fetch all Zephyr Scale test cycles (test runs) with all available fields.
 * Usage: node fetch_test_cycles.js
 */

const { fetchTestRuns } = require('./zephyr_utils');

async function main() {
  try {
    console.log('🔄 Fetching all test cycles...');
    const result = await fetchTestRuns();
    
    if (!result) {
      console.error('❌ No data returned');
      process.exit(2);
    }

    console.log('📄 Full response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(3);
  }
}

main();
