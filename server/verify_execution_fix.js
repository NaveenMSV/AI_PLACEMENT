const { runCode } = require('./services/codeExecutionService');

const testCases = [
    { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
    { input: '[1]', expectedOutput: '1' },
    { input: '[5,4,-1,7,8]', expectedOutput: '23' }
];

const wrongCode = `
class Solution {
    maxSubArray(nums) {
        return 0; // INCORRECT
    }
}
`;

const correctCode = `
class Solution {
    maxSubArray(nums) {
        let maxSoFar = nums[0];
        let maxEndingHere = nums[0];
        for (let i = 1; i < nums.length; i++) {
            maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
            maxSoFar = Math.max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
}
`;

async function verify() {
    console.log('--- Testing WRONG code ---');
    const wrongResult = await runCode('JavaScript', wrongCode, testCases);
    console.log('Passed:', wrongResult.passedCount, '/', wrongResult.totalTests);
    console.log('Status Case 1:', wrongResult.results[0].status);
    console.log('Actual Case 1:', wrongResult.results[0].actual);

    console.log('\n--- Testing CORRECT code ---');
    const correctResult = await runCode('JavaScript', correctCode, testCases);
    console.log('Passed:', correctResult.passedCount, '/', correctResult.totalTests);
    console.log('Status Case 1:', correctResult.results[0].status);
    console.log('Actual Case 1:', correctResult.results[0].actual);

    if (wrongResult.passedCount === 0 && correctResult.passedCount === 3) {
        console.log('\nVERIFICATION SUCCESSFUL: System correctly distinguishes between right and wrong code.');
    } else {
        console.log('\nVERIFICATION FAILED: Unexpected behavior.');
    }
}

verify().catch(console.error);
