const path = require('path');
const servicePath = path.join(__dirname, 'services', 'codeExecutionService.js');
console.log("Loading service from:", servicePath);
const codeExecutionService = require(servicePath);

async function test() {
    console.log("Running JS test...");
    try {
        const result = await codeExecutionService.executeJS("var solve = (s) => s.split('').reverse().join('')", [{input: '"abc"', expectedOutput: '"cba"'}]);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
