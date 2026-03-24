const mongoose = require('mongoose');
const Company = require('./models/Company');
const InterviewBlueprint = require('./models/InterviewBlueprint');
const Question = require('./models/Question');
const DailyChallenge = require('./models/DailyChallenge');

async function finalFix() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Clear Daily Challenges to fix 500 errors
        await DailyChallenge.deleteMany({});
        console.log('Cleared all DailyChallenge entries.');

        // 2. Fix "Coding Practice"
        let codingPractice = await Company.findOne({ name: 'Coding Practice' });
        if (!codingPractice) {
            codingPractice = await Company.create({
                name: 'Coding Practice',
                description: 'General coding practice across various topics and difficulty levels.',
                logo: 'https://cdn-icons-png.flaticon.com/512/1150/1150592.png'
            });
            console.log('Created Coding Practice company.');
        }

        let codingBlueprint = await InterviewBlueprint.findOne({ companyId: codingPractice._id });
        if (!codingBlueprint) {
            codingBlueprint = await InterviewBlueprint.create({
                companyId: codingPractice._id,
                rounds: [{ roundNumber: 1, roundType: 'CODING', duration: 300, totalQuestions: 45 }]
            });
            console.log('Created Coding Practice blueprint.');
        } else {
            codingBlueprint.rounds = [{ roundNumber: 1, roundType: 'CODING', duration: 300, totalQuestions: 45 }];
            await codingBlueprint.save();
            console.log('Updated Coding Practice blueprint to CODING round.');
        }
        
        codingPractice.blueprintId = codingBlueprint._id;
        await codingPractice.save();

        // 3. Fix "SQL Practice"
        let sqlPractice = await Company.findOne({ name: 'SQL Practice' });
        if (!sqlPractice) {
            sqlPractice = await Company.create({
                name: 'SQL Practice',
                description: 'SQL query practice for database management and data analysis.',
                logo: 'https://cdn-icons-png.flaticon.com/512/2772/2772128.png'
            });
            console.log('Created SQL Practice company.');
        }

        let sqlBlueprint = await InterviewBlueprint.findOne({ companyId: sqlPractice._id });
        if (!sqlBlueprint) {
            sqlBlueprint = await InterviewBlueprint.create({
                companyId: sqlPractice._id,
                rounds: [{ roundNumber: 1, roundType: 'SQL', duration: 300, totalQuestions: 45 }]
            });
            console.log('Created SQL Practice blueprint.');
        } else {
            sqlBlueprint.rounds = [{ roundNumber: 1, roundType: 'SQL', duration: 300, totalQuestions: 45 }];
            await sqlBlueprint.save();
            console.log('Updated SQL Practice blueprint to SQL round.');
        }

        sqlPractice.blueprintId = sqlBlueprint._id;
        await sqlPractice.save();

        // 4. Seed Questions (90 total)
        await Question.deleteMany({ companyId: { $in: [codingPractice._id, sqlPractice._id] } });
        console.log('Cleared existing practice questions.');

        const codingQuestions = [];
        const codingTitles = [
            "Two Sum", "Reverse Linked List", "Valid Parentheses", "Merge Two Sorted Lists", "Best Time to Buy and Sell Stock",
            "Valid Palindrome", "LCA of BST", "Balanced Binary Tree", "Linked List Cycle", "Implement Queue using Stacks",
            "Invert Binary Tree", "Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Number of 1 Bits", "Climbing Stairs",
            "Longest Palindrome", "Reverse Bits", "Pascal's Triangle", "Middle of the Linked List", "Ransom Note",
            "Binary Search", "Flood Fill", "Lowest Common Ancestor", "Valid Anagram", "K Closest Points to Origin",
            "Insert Interval", "01 Matrix", "Binary Tree Level Order Traversal", "Clone Graph", "Course Schedule",
            "Implement Trie", "Coin Change", "Product of Array Except Self", "Min Stack", "Validate BST",
            "Number of Islands", "Rotting Oranges", "Search in Rotated Sorted Array", "Combination Sum", "Permutations",
            "Merge Intervals", "Lowest Common Ancestor of a Binary Tree", "Time Based Key-Value Store", "Accounts Merge", "Sort Colors"
        ];

        for (let i = 0; i < 45; i++) {
            codingQuestions.push({
                companyId: codingPractice._id,
                roundType: 'CODING',
                questionType: 'CODING',
                question: codingTitles[i] || `Coding Challenge ${i+1}`,
                difficulty: i < 15 ? 'Easy' : (i < 35 ? 'Medium' : 'Hard'),
                testCases: [{ input: '1', expectedOutput: '1', isHidden: false }],
                boilerplates: {
                    python: "class Solution:\n    def solve(self, n):\n        return n",
                    javascript: "class Solution {\n    solve(n) {\n        return n;\n    }\n}",
                    java: "class Solution {\n    public int solve(int n) {\n        return n;\n    }\n}",
                    cpp: "class Solution {\npublic:\n    int solve(int n) {\n        return n;\n    }\n};"
                }
            });
        }

        const sqlQuestions = [];
        const sqlTitles = [
            "Select All Employees", "High Salary Departments", "Frequent Customers", "Recent Orders", "Product Stock Levels",
            "Employee Manager Hierarchy", "Project Deadlines", "Department Avg Salary", "Top Selling Products", "Inactive Users",
            "Employee Tenure", "Monthly Revenue", "Customer Lifetime Value", "Inventory Turnover", "Sales Growth Rate",
            "Unique Visitors", "Page View Analysis", "Conversion Rate", "Bounce Rate", "Session Duration",
            "Error Logs Summary", "Server Uptime", "Database Lock Analysis", "Slow Query Log", "Table Size Stats",
            "Index Usage", "Backup Status", "User Permissions Check", "Security Audit", "API Usage Quota",
             "Test SQL 31", "Test SQL 32", "Test SQL 33", "Test SQL 34", "Test SQL 35",
             "Test SQL 36", "Test SQL 37", "Test SQL 38", "Test SQL 39", "Test SQL 40",
             "Test SQL 41", "Test SQL 42", "Test SQL 43", "Test SQL 44", "Test SQL 45"
        ];

        for (let i = 0; i < 45; i++) {
            sqlQuestions.push({
                companyId: sqlPractice._id,
                roundType: 'SQL',
                questionType: 'SQL',
                question: sqlTitles[i] || `SQL Practice ${i+1}`,
                difficulty: i < 15 ? 'Easy' : (i < 35 ? 'Medium' : 'Hard'),
                correctAnswer: 'SELECT * FROM test;',
                testCases: [{ input: 'CREATE TABLE test (id INT); INSERT INTO test VALUES (1);', expectedOutput: '1' }]
            });
        }

        await Question.insertMany([...codingQuestions, ...sqlQuestions]);
        console.log('Seeded 90 questions successfully.');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

finalFix();
