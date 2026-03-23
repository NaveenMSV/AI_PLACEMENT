const { runCode } = require('./services/codeExecutionService');

const testCases = [
    { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' }
];

const cppCode = `
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        return 0; 
    }
};
`;

async function verify() {
    console.log('--- Testing C++ code error feedback ---');
    const result = await runCode('C++', cppCode, testCases);
    console.log('Status Case 1:', result.results[0].status);
    console.log('Actual Case 1:', result.results[0].actual);
    console.log('Error Case 1:', result.results[0].error);

    if (result.results[0].status === 'ERROR' && result.results[0].actual.includes('requires \'g++\'')) {
        console.log('\nVERIFICATION SUCCESSFUL: Error message is correctly captured and displayed.');
    } else {
        console.log('\nVERIFICATION FAILED: Unexpected output.');
    }
}

verify().catch(console.error);
