#!/usr/bin/env node
/**
 * CLI to fetch a Zephyr Scale test case by key and print step IDs and descriptions.
 * Usage: node fetch_testcase_by_key.js GSSEP-T44
 */

const { fetchTestCaseByKey } = require('./zephyr_utils');

async function main() {
  const key = process.argv[2];
  if (!key) {
    console.error('Usage: node fetch_testcase_by_key.js <TEST_CASE_KEY>');
    process.exit(1);
  }

  try {
    const tc = await fetchTestCaseByKey(key);
    if (!tc) {
      console.error('No data returned');
      process.exit(2);
    }

    // Navigate to testScript.steps if present    const steps = tc?.testScript?.steps || [];
    if (!Array.isArray(steps) || steps.length === 0) {
      console.log('No steps found for this test case.');
      console.log(JSON.stringify(tc, null, 2));
      return;
    }

    console.log(`Test Case: ${tc.key || key} - ${tc.name || ''}`);
    console.log(`Total steps: ${steps.length}`);
    console.log('Steps:');
    for (const s of steps) {
      const line = [
        `id=${s.id ?? 'n/a'}`,
        `index=${s.index ?? 'n/a'}`,
        `description=${(s.description || s.text || '').toString().slice(0, 120)}`,
        `expected=${(s.expectedResult || '').toString().slice(0, 120)}`,
      ].join(' | ');
      console.log('- ' + line);
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(3);
  }
}

main();


