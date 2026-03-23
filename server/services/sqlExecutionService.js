const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL = null;

const getSQL = async () => {
    if (SQL) return SQL;
    SQL = await initSqlJs();
    return SQL;
};


/**
 * Executes a SQL query and evaluates it
 * @param {string} query - Student's SQL query
 * @param {Array} testCases - Array of { input: 'Setup SQL', expectedOutput: 'JSON rows' }
 */
const runSql = async (query, testCases = []) => {
    const SQL = await getSQL();
    const results = [];
    
    // If no test cases, just run the query against dummy data once
    if (testCases.length === 0) {
        testCases = [{ input: '', expectedOutput: null }];
    }

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const db = new SQL.Database();
        
        try {
            // 1. Setup Environment from Test Case Input (Schema + Data)
            if (tc.input) {
                // Split by semicolon and run each statement to ensure it all executes
                const statements = tc.input.split(';').map(s => s.trim()).filter(s => s.length > 0);
                for (const sql of statements) {
                    db.run(sql + ';');
                }
            }


            // 2. Run Student Query
            const res = db.exec(query);
            
            let actualRows = [];
            let columns = [];
            if (res.length > 0) {
                columns = res[0].columns;
                actualRows = res[0].values;
            }

            // 3. Evaluate
            let status = 'PASSED';
            let expectedMsg = tc.expectedOutput || 'Success';
            
            if (tc.expectedOutput) {
                try {
                    const expected = JSON.parse(tc.expectedOutput);
                    // Simple comparison of JSON stringified values
                    const normalizedActual = JSON.stringify(actualRows);
                    const normalizedExpected = JSON.stringify(expected);
                    status = normalizedActual === normalizedExpected ? 'PASSED' : 'FAILED';
                } catch (e) {
                    // If expectedOutput isn't JSON, just check if something was returned
                    status = actualRows.length > 0 ? 'PASSED' : 'FAILED';
                }
            }

            results.push({
                id: i + 1,
                input: query,
                expected: expectedMsg,
                actual: JSON.stringify(actualRows),
                columns,
                status
            });

        } catch (err) {
            results.push({
                id: i + 1,
                input: query,
                expected: tc.expectedOutput || 'Valid Query',
                actual: `ERROR: ${err.message}`,
                status: 'ERROR'
            });
        } finally {
            db.close();
        }
    }

    const passedCount = results.filter(r => r.status === 'PASSED').length;
    return {
        results,
        passedCount,
        failedCount: results.length - passedCount,
        totalTests: results.length,
        output: passedCount === results.length ? "All Test Cases Passed!" : "Query executed with mismatches."
    };
};

module.exports = { runSql };
