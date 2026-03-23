const transpileCppToJs = (cppCode) => {
    let jsCode = cppCode;

    // 1. Remove headers and namespaces
    jsCode = jsCode.replace(/#include\s*<.*?>/g, '');
    jsCode = jsCode.replace(/using\s+namespace\s+std\s*;/g, '');

    // 2. Accessibility
    jsCode = jsCode.replace(/public:/g, '');
    jsCode = jsCode.replace(/private:/g, '');
    jsCode = jsCode.replace(/protected:/g, '');

    // 3. Types
    jsCode = jsCode.replace(/\b(?:int|double|float|bool|string|void|auto|long|char|vector\s*<[^>]+>)\s+([a-zA-Z0-9_]+)\s*\(/g, '$1(');
    jsCode = jsCode.replace(/(\(|\,)\s*(?:int|double|float|bool|string|void|auto|long|char|vector\s*<[^>]+>)\s*&?\s*([a-zA-Z0-9_]+)/g, '$1 $2');
    jsCode = jsCode.replace(/\b(int|double|float|bool|string|void|auto|long|char)\b/g, 'let');
    jsCode = jsCode.replace(/vector\s*<[^>]+>\s*&?/g, 'let');

    // 4. Methods
    jsCode = jsCode.replace(/\.size\(\)/g, '.length');
    jsCode = jsCode.replace(/\bmax\s*\(/g, 'Math.max(');
    jsCode = jsCode.replace(/\bmin\s*\(/g, 'Math.min(');
    jsCode = jsCode.replace(/\bpush_back\s*\(/g, 'push(');

    jsCode = jsCode.replace(/\blet\s+let\b/g, 'let');
    
    return jsCode;
};

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

const result = transpileCppToJs(cppCode);
console.log('--- START ---');
console.log(result);
console.log('--- END ---');

// Test if it runs in a small context
const inputVal = [-2,1,-3,4,-1,2,1,-5,4];
try {
    const wrapped = `
        ${result}
        (new Solution()).maxSubArray(${JSON.stringify(inputVal)});
    `;
    const evalRes = eval(wrapped);
    console.log('Eval Result:', evalRes);
} catch (e) {
    console.log('Eval Error:', e.message);
}
