const { runCode } = require('./services/codeExecutionService');

const testCases = [
    { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
    { input: '[1]', expectedOutput: '1' },
    { input: '[5,4,-1,7,8]', expectedOutput: '23' }
];

const cppCode = `
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxsum=nums[0];
        int currentsum=nums[0];
        for(int i=1;i<nums.size();i++){
            currentsum=max(nums[i],currentsum+nums[i]);
            maxsum=max(maxsum,currentsum);
        }
        return maxsum;
    }
};
`;

async function verify() {
    console.log('--- Testing C++ Zero-Install Shim ---');
    try {
        const result = await runCode('C++', cppCode, testCases);
        console.log('Passed:', result.passedCount, '/', result.totalTests);
        
        result.results.forEach(r => {
            console.log(`TC ${r.id}: Input=${r.input}, Expected=${r.expected}, Actual=${r.actual}, Status=${r.status}`);
            if (r.error) console.log(`   Error: ${r.error}`);
        });

        if (result.passedCount === 3) {
            console.log('\nVERIFICATION SUCCESSFUL: C++ code executed correctly via JS shim!');
        } else {
            console.log('\nVERIFICATION FAILED: Test cases did not pass.');
        }
    } catch (err) {
        console.error('Execution Error:', err);
    }
}

verify().catch(console.error);
