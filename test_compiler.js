const codeExecutionService = require('./server/services/codeExecutionService');
const mongoose = require('mongoose');

async function testCompiler() {
    console.log("--- Testing JavaScript ---");
    const jsCode = "var solve = function(s) { return s.split('').reverse().join(''); };";
    const jsResult = await codeExecutionService.executeJS(jsCode, [{ input: '"hello"', expectedOutput: '"olleh"' }]);
    console.log("JS Result:", JSON.stringify(jsResult, null, 2));

    console.log("\n--- Testing Python ---");
    const pyCode = "class Solution:\n    def solve(self, s):\n        return s[::-1]";
    const pyResult = await codeExecutionService.executePython(pyCode, [{ input: '"hello"', expectedOutput: '"olleh"' }]);
    console.log("Python Result:", JSON.stringify(pyResult, null, 2));

    console.log("\n--- Testing Java ---");
    const javaCode = "class Solution {\n    public String solve(String s) {\n        return new StringBuilder(s).reverse().toString();\n    }\n}";
    // Note: Java execution might fail if 'java' command is missing, but let's see.
    try {
        const javaResult = await codeExecutionService.executeJava(javaCode, [{ input: '"hello"', expectedOutput: '"olleh"' }]);
        console.log("Java Result:", JSON.stringify(javaResult, null, 2));
    } catch (e) {
        console.log("Java Error:", e.message);
    }

    console.log("\n--- Testing C++ (Shim) ---");
    const cppCode = "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    string solve(string s) {\n        reverse(s.begin(), s.end());\n        return s;\n    }\n};";
    const cppResult = await codeExecutionService.executeCppShim(cppCode, [{ input: '"hello"', expectedOutput: '"olleh"' }]);
    console.log("C++ Result:", JSON.stringify(cppResult, null, 2));

    process.exit(0);
}

// Mock some environment variables if needed
process.env.NODE_ENV = 'development';

testCompiler();
