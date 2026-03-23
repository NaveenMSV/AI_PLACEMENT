require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');

const seedQuestions = [
    {
        roundType: 'CODING',
        questionType: 'CODING',
        question: 'Two Sum\nGiven an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        difficulty: 'Easy',
        testCases: [
            { input: '[2, 7, 11, 15]\n9', expectedOutput: '[0, 1]', isHidden: false },
            { input: '[3, 2, 4]\n6', expectedOutput: '[1, 2]', isHidden: false },
            { input: '[3, 3]\n6', expectedOutput: '[0, 1]', isHidden: true }
        ],
        solution: 'Use a hash map to store the previous elements and their indices.'
    },
    {
        roundType: 'CODING',
        questionType: 'CODING',
        question: 'Palindrome Number\nGiven an integer x, return true if x is a palindrome, and false otherwise.',
        difficulty: 'Easy',
        testCases: [
            { input: '121', expectedOutput: 'true', isHidden: false },
            { input: '-121', expectedOutput: 'false', isHidden: false },
            { input: '10', expectedOutput: 'false', isHidden: true }
        ],
        solution: 'Convert to string or reverse the integer mathematically.'
    },
    {
        roundType: 'CODING',
        questionType: 'CODING',
        question: 'Reverse String\nWrite a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
        difficulty: 'Medium',
        testCases: [
            { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
            { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: true }
        ],
        solution: 'Use a two-pointer approach, swapping characters from both ends.'
    }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    let cpCompany = await Company.findOne({ name: 'Coding Practice' });
    if (!cpCompany) {
        console.error('Coding Practice company not found!');
        process.exit(1);
    }

    const newQuestions = seedQuestions.map(q => ({
        ...q,
        companyId: cpCompany._id
    }));

    await Question.insertMany(newQuestions);
    console.log(`Successfully seeded ${newQuestions.length} CODING questions for 'Coding Practice'.`);
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
