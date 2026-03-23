require('dotenv').config();
const { runCode } = require('./services/codeExecutionService');
const fs = require('fs');

async function testAll() {
    const results = [];
    const tc = [{ input: '[2, 7, 11, 15]\n9', expectedOutput: '[0, 1]' }];

    // 1. JavaScript
    try {
        const jsCode = `var solve = function(nums, target) {
    const map = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map[complement] !== undefined) return [map[complement], i];
        map[nums[i]] = i;
    }
    return [];
};`;
        const r = await runCode('JavaScript', jsCode, tc);
        results.push('JS: ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('JS: ERROR | ' + e.message); }

    // 2. Java
    try {
        const javaCode = `import java.util.*;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) return new int[]{map.get(complement), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`;
        const r = await runCode('Java', javaCode, tc);
        results.push('Java: ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('Java: ERROR | ' + e.message); }

    // 3. Python
    try {
        const pyCode = `class Solution:
    def twoSum(self, nums, target):
        lookup = {}
        for i, n in enumerate(nums):
            if target - n in lookup:
                return [lookup[target - n], i]
            lookup[n] = i
        return []`;
        const r = await runCode('Python', pyCode, tc);
        results.push('Python: ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('Python: ERROR | ' + e.message); }

    // 4. C++ with .at()
    try {
        const cppCode = `#include <vector>
using namespace std;
class Solution {
public:
    int solve(vector<int> nums) {
        int sum = 0;
        for (int i = 0; i < nums.size(); i++) {
            sum += nums.at(i);
        }
        return sum;
    }
};`;
        const r = await runCode('C++', cppCode, [{ input: '[1, 2, 3]', expectedOutput: '6' }]);
        results.push('C++ .at(): ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('C++ .at(): ERROR | ' + e.message); }

    // 5. C++ Math and swap
    try {
        const cppCode2 = `#include <cmath>
#include <algorithm>
class Solution {
public:
    int solve(int a, int b) {
        std::swap(a, b);
        return (int)std::abs(a) + std::max(a, b);
    }
};`;
        const r = await runCode('C++', cppCode2, [{ input: '-5\n10', expectedOutput: '20' }]); 
        results.push('C++ Math: ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('C++ Math: ERROR | ' + e.message); }

    // 6. Java String Manipulation
    try {
        const javaCode2 = `class Solution {
    public String solve(String s) {
        return s.replace("a", "o");
    }
}`;
        const r = await runCode('Java', javaCode2, [{ input: '"banana"', expectedOutput: 'bonono' }]);
        results.push('Java String: ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('Java String: ERROR | ' + e.message); }

    // 7. JS Palindrome
    try {
        const palCode = `var solve = function(x) { const s = String(x); return s === s.split('').reverse().join(''); };`;
        const r = await runCode('JavaScript', palCode, [{ input: '121', expectedOutput: 'true' }]);
        results.push('JS Palindrome: ' + r.results[0].status + ' | actual: ' + r.results[0].actual);
    } catch (e) { results.push('JS Palindrome: ERROR | ' + e.message); }

    // Write to file for clean reading
    fs.writeFileSync('test_results.txt', results.join('\n'));
    process.exit(0);
}

testAll().catch(e => { console.error(e); process.exit(1); });
