const transpileCppToJs = (cppCode) => {
    let jsCode = cppCode;

    // 1. Remove comments
    jsCode = jsCode.replace(/\/\/.*$/gm, '');
    jsCode = jsCode.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Remove headers and namespaces
    jsCode = jsCode.replace(/#include\s*<.*?>/g, '');
    jsCode = jsCode.replace(/using\s+namespace\s+std\s*;/g, '');

    // 3. Remove visibility markers
    jsCode = jsCode.replace(/\b(public|private|protected)\s*:/g, '');

    // 4. Handle method signatures in classes
    // type methodName(type param1, type param2) -> methodName(param1, param2)
    jsCode = jsCode.replace(/\b[a-zA-Z0-9_<>]+\b\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*{/g, (match, methodName, params) => {
        if (['if', 'for', 'while', 'switch'].includes(methodName)) return match;
        const cleanParams = params.split(',').map(p => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            const parts = trimmed.split(/\s+/);
            return parts[parts.length - 1].replace(/[&*]/g, ''); 
        }).filter(p => p).join(', ');
        return `${methodName}(${cleanParams}) {`;
    });

    // 5. Replace types with 'let' for variable declarations
    jsCode = jsCode.replace(/\b(int|double|float|bool|string|auto|long|char|vector\s*<[^>]+>)\b(?!\s*\()/g, 'let');

    // 6. Common methods
    jsCode = jsCode.replace(/\.size\(\)/g, '.length');
    jsCode = jsCode.replace(/\bmax\s*\(/g, 'Math.max(');
    jsCode = jsCode.replace(/\bmin\s*\(/g, 'Math.min(');
    
    // 7. Remove remaining C++isms
    jsCode = jsCode.replace(/\bstd::/g, '');

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

// Test run
const inputVal = [-2,1,-3,4,-1,2,1,-5,4];
try {
    const Solution = eval(`(function() { ${result}; return Solution; })()`);
    const sol = new Solution();
    const res = sol.maxSubArray(inputVal);
    console.log('Eval Result:', res);
} catch (e) {
    console.log('Eval Error:', e.message, e.stack);
}
