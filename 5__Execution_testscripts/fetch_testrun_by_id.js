#!/usr/bin/env node
/**
 * CLI to fetch a specific Zephyr Scale test run by ID and display test results.
 * Usage: node fetch_testrun_by_id.js <TEST_RUN_ID> <ITEM_ID>
 */

const { fetchTestRunById } = require('./zephyr_utils');

function parseArgs() {
  const args = { 
    testRunId: process.argv[2],
    itemId: process.argv[3]
  };
  process.argv.slice(4).forEach(arg => {
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  });
  return args;
}

function showHelp() {
  console.log(`Usage: node fetch_testrun_by_id.js <TEST_RUN_ID> <ITEM_ID>

Arguments:
  TEST_RUN_ID     Test run ID/key (e.g., 56564)
  ITEM_ID         Item ID (e.g., 810548)

Options:
  --help, -h      Show this help message

Examples:
  node fetch_testrun_by_id.js 56564 810548`);
}

async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    return;
  }

  if (!args.testRunId) {
    console.error('❌ Error: Test run ID is required');
    console.error('Usage: node fetch_testrun_by_id.js <TEST_RUN_ID> <ITEM_ID>');
    process.exit(1);
  }

  if (!args.itemId) {
    console.error('❌ Error: Item ID is required');
    console.error('Usage: node fetch_testrun_by_id.js <TEST_RUN_ID> <ITEM_ID>');
    process.exit(1);
  }

  try {
    console.log(`🔄 Fetching test run ${args.testRunId} with item ID ${args.itemId}...`);
    const options = { itemId: args.itemId };

    const result = await fetchTestRunById(args.testRunId, options);
    
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
