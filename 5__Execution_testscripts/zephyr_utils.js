/**
 * Zephyr Scale Utility Functions for Test Result Updates
 */

const https = require('https');

// Configuration
const BASE_URL = "https://jira.trimble.tools";
const EMAIL = "sanjeet_kumar@trimble.com";
const API_TOKEN = "hdTpPFDp8qypBoOpPwEO2LPB68fe3wsBjSrI1U";

// Test Result Status IDs
const STATUS_PASS = 16074;
const STATUS_FAIL = 16075;
const STATUS_BLOCKED = 16076;
const STATUS_NOT_EXECUTED = 16072;
const STATUS_IN_PROGRESS = 16073;

/**
 * Generate Basic Auth header
 * @returns {string} Basic auth header value
 */
function getAuthHeader() {
    const auth = `${EMAIL}:${API_TOKEN}`;
    const encoded = Buffer.from(auth).toString('base64');
    return `Basic ${encoded}`;
}

/**
 * Generate request headers
 * @returns {Object} Request headers
 */
function getHeaders() {
    return {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
}

/**
 * Update test result status in Zephyr Scale
 * @param {number} testScriptResultId - The test script result ID
 * @param {boolean} passed - True if test passed, False if failed
 * @param {string} executionDate - Test execution timestamp
 * @returns {Promise<boolean>} True if update successful, False otherwise
 */
async function updateTestResult(testScriptResultId, passed, executionDate = "2025-01-13T09:03:18.229Z") {
    const statusId = passed ? STATUS_PASS : STATUS_FAIL;
    const url = `${BASE_URL}/rest/tests/1.0/testscriptresult/${testScriptResultId}`;
    
    const payload = {
        executionDate: executionDate,
        id: testScriptResultId,
        testResultStatusId: statusId
    };

    const options = {
        method: 'PUT',
        headers: getHeaders(),
        timeout: 30000
    };

    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            options.hostname = urlObj.hostname;
            options.port = urlObj.port || 443;
            options.path = urlObj.pathname;

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const success = res.statusCode === 200;
                    const status = passed ? '✅ PASS' : '❌ FAIL';
                    
                    console.log(`📊 Test ${testScriptResultId}: ${status} - HTTP ${res.statusCode}`);
                    resolve(success);
                });
            });

            req.on('error', (error) => {
                console.log(`❌ Error updating test ${testScriptResultId}:`, error.message);
                resolve(false);
            });

            req.on('timeout', () => {
                console.log(`❌ Timeout updating test ${testScriptResultId}`);
                req.destroy();
                resolve(false);
            });

            req.write(JSON.stringify(payload));
            req.end();

        } catch (error) {
            console.log(`❌ Error updating test ${testScriptResultId}:`, error.message);
            resolve(false);
        }
    });
}

/**
 * Fetch a Zephyr Scale test case by key with full field selection
 * @param {string} testCaseKey - e.g., "GSSEP-T44"
 * @returns {Promise<object>} Parsed JSON test case object
 */
async function fetchTestCaseByKey(testCaseKey) {
	const fields = 'id,projectId,archived,key,name,objective,majorVersion,latestVersion,precondition,folder(id,fullName),status,priority,estimatedTime,averageTime,componentId,owner,labels,customFieldValues,testScript(id,text,steps(index,reflectRef,description,text,expectedResult,testData,attachments,customFieldValues,id,stepParameters(id,testCaseParameterId,value),testCase(projectId,id,key,name,archived,majorVersion,latestVersion,parameters(id,name,defaultValue,index)))),testData,parameters(id,name,defaultValue,index),paramType';
	const url = `${BASE_URL}/rest/tests/1.0/testcase/${encodeURIComponent(testCaseKey)}?fields=${encodeURIComponent(fields)}`;

	const options = {
		method: 'GET',
		headers: getHeaders(),
		timeout: 30000
	};

	return new Promise((resolve, reject) => {
		try {
			const urlObj = new URL(url);
			options.hostname = urlObj.hostname;
			options.port = urlObj.port || 443;
			options.path = urlObj.pathname + urlObj.search; // include query string

			const req = https.request(options, (res) => {
				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try {
							const json = JSON.parse(data || '{}');
							resolve(json);
						} catch (e) {
							resolve({ raw: data, parseError: String(e) });
						}
					} else {
						reject(new Error(`HTTP ${res.statusCode}: ${data}`));
					}
				});
			});

			req.on('error', (error) => {
				reject(error);
			});

			req.on('timeout', () => {
				req.destroy();
				reject(new Error('Timeout while fetching test case'));
			});

			req.end();
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Search Zephyr Scale test runs (test cycles)
 * @param {Object} [opts]
 * @param {string} [opts.fields] Comma-separated fields to return (optional)
 * @param {string} [opts.query] JQL-like query for filtering test runs (optional)
 * @param {number} [opts.startAt] Pagination start index (optional, default: 0)
 * @param {number} [opts.maxResults] Max results per page (optional, default: 40)
 * @param {boolean} [opts.archived] Include archived test runs (optional, default: false)
 * @returns {Promise<object>} Parsed JSON listing of test runs
 */
async function fetchTestRuns(opts = {}) {
	const { fields, query, startAt, maxResults, archived } = opts;
	const base = `${BASE_URL}/rest/tests/1.0/testrun/search`;
	
	// Default comprehensive fields for test runs (from actual API)
	const defaultFields = 'id,key,name,folderId,iterationId,projectVersionId,environmentId,userKeys,environmentIds,plannedStartDate,plannedEndDate,executionTime,estimatedTime,testResultStatuses,testCaseCount,issueCount,status(id,name,i18nKey,color),customFieldValues,createdOn,createdBy,updatedOn,updatedBy,owner';
	
	// Default query to filter by project ID 48405 only
	const defaultQuery = 'testRun.projectId IN (48405) ORDER BY testRun.name ASC';
	
	const params = new URLSearchParams();
	params.set('fields', fields || defaultFields);
	params.set('query', query || defaultQuery);
	params.set('startAt', String(startAt ?? 0));
	params.set('maxResults', String(maxResults ?? 40));
	params.set('archived', String(archived ?? false));
	const url = `${base}?${params.toString()}`;

	const options = {
		method: 'GET',
		headers: getHeaders(),
		timeout: 30000
	};

	return new Promise((resolve, reject) => {
		try {
			const urlObj = new URL(url);
			options.hostname = urlObj.hostname;
			options.port = urlObj.port || 443;
			options.path = urlObj.pathname + (urlObj.search || '');

			const req = https.request(options, (res) => {
				let data = '';
				res.on('data', (chunk) => { data += chunk; });
				res.on('end', () => {
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try { resolve(JSON.parse(data || '{}')); }
						catch (e) { resolve({ raw: data, parseError: String(e) }); }
					} else {
						reject(new Error(`HTTP ${res.statusCode}: ${data}`));
					}
				});
			});

			req.on('error', (error) => reject(error));
			req.on('timeout', () => { req.destroy(); reject(new Error('Timeout while fetching test runs')); });
			req.end();
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Fetch a specific Zephyr Scale test run by ID/key with test results
 * @param {string|number} testRunId - Test run ID/key (e.g., "56564")
 * @param {Object} [opts]
 * @param {string} [opts.fields] Comma-separated fields to return (optional)
 * @param {string|number} [opts.itemId] Specific item ID filter (optional)
 * @returns {Promise<object>} Parsed JSON test run object with test results
 */
async function fetchTestRunById(testRunId, opts = {}) {
	const { fields, itemId } = opts;
	
	// Default comprehensive fields for test run results
	const defaultFields = 'id,testResultStatusId,automated,estimatedTime,scenarioResultIds,customFieldValues,executionTime,executionDate,plannedStartDate,plannedEndDate,actualStartDate,actualEndDate,environmentId,jiraVersionId,iterationId,comment,userKey,assignedTo,testScriptResults(id,testResultStatusId,executionDate,comment,index,description,expectedResult,testData,traceLinks,attachments,sourceScriptType,parameterSetId,customFieldValues,stepAttachmentsMapping,reflectRef),traceLinks,attachments';
	
	const base = `${BASE_URL}/rest/tests/1.0/testrun/${encodeURIComponent(testRunId)}/testresults`;
	const params = new URLSearchParams();
	params.set('fields', fields || defaultFields);
	if (itemId) params.set('itemId', String(itemId));
	const url = `${base}?${params.toString()}`;

	const options = {
		method: 'GET',
		headers: getHeaders(),
		timeout: 30000
	};

	return new Promise((resolve, reject) => {
		try {
			const urlObj = new URL(url);
			options.hostname = urlObj.hostname;
			options.port = urlObj.port || 443;
			options.path = urlObj.pathname + (urlObj.search || '');

			const req = https.request(options, (res) => {
				let data = '';
				res.on('data', (chunk) => { data += chunk; });
				res.on('end', () => {
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try { resolve(JSON.parse(data || '{}')); }
						catch (e) { resolve({ raw: data, parseError: String(e) }); }
					} else {
						reject(new Error(`HTTP ${res.statusCode}: ${data}`));
					}
				});
			});

			req.on('error', (error) => reject(error));
			req.on('timeout', () => { req.destroy(); reject(new Error('Timeout while fetching test run')); });
			req.end();
		} catch (error) {
			reject(error);
		}
	});
}

// Test Script Result IDs mapping (6 tests: 8410254 to 8410259)
const TEST_IDS = {
  'ignite_primary_engines': 8410254,
  'release_main_valves': 8410255, 
  'ignite_secondary_engines': 8410256,
  'monitor_temperature_pressure': 8410257,
  'verify_pressure_readings': 8410258,
  'controlled_shutdown': 8410259
};

/**
 * Update Zephyr Scale test result by test name
 * @param {string} testName - Name of the test from TEST_IDS mapping
 * @param {boolean} passed - Whether test passed or failed
 * @returns {Promise<boolean>} True if update successful, False otherwise
 */
async function updateZephyrResult(testName, passed) {
  const testId = TEST_IDS[testName];
  if (!testId) {
    console.log(`❌ No test ID found for: ${testName}`);
    return false;
  }

  try {
    const success = await updateTestResult(testId, passed);
    return success;
  } catch (error) {
    console.log(`❌ Failed to update Zephyr result for ${testName}:`, error.message);
    return false;
  }
}

module.exports = {
    updateTestResult,
    updateZephyrResult,
	fetchTestCaseByKey,
	fetchTestRuns,
	fetchTestRunById,
    TEST_IDS,
    STATUS_PASS,
    STATUS_FAIL,
    STATUS_BLOCKED,
    STATUS_NOT_EXECUTED,
    STATUS_IN_PROGRESS
};
