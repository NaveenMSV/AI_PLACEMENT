const { runCode } = require('./server/services/codeExecutionService');

async function test() {
    console.log('--- TESTING PYTHON LINKED LIST REVERSE ---');
    const pyCode = `
import math
import collections

class Solution:
    def solve(self, head):
        prev = None
        curr = head
        
        while curr:
            # 1. Save the next node before breaking the link
            next_node = curr.next
            
            # 2. Reverse the 'next' pointer
            curr.next = prev
            
            # 3. Move the window (prev and curr) forward
            prev = curr
            curr = next_node
            
        # At the end, prev points to the new head (the old tail)
        return prev
`;
    // Input is [1, 2, 3, 4, 5], Expected is [5, 4, 3, 2, 1]
    const pyResult = await runCode('Python', pyCode, [{ input: '[1, 2, 3, 4, 5]', expectedOutput: '[5, 4, 3, 2, 1]' }]);
    console.log('Python Linked List Result:', JSON.stringify(pyResult.results[0], null, 2));
}

test().catch(console.error);
