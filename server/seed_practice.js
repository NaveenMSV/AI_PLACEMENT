const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Company = require('./models/Company');
const Question = require('./models/Question');
const User = require('./models/User');

async function seed() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Find an admin user to be the owner
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found. Please create an admin first.');
            process.exit(1);
        }

        // 1. Create/Find Practice Companies
        const practiceCompanies = [
            { name: 'Coding Practice', description: 'Default track for programming challenges', estimatedDuration: 60 },
            { name: 'SQL Practice', description: 'Default track for database challenges', estimatedDuration: 60 }
        ];

        for (const companyData of practiceCompanies) {
            let company = await Company.findOne({ name: companyData.name });
            if (!company) {
                company = await Company.create({
                    ...companyData,
                    numberOfRounds: 1,
                    createdByAdmin: admin._id
                });
                console.log(`Created company: ${company.name}`);
            }

            // 2. Add Sample Questions to each
            if (company.name === 'Coding Practice') {
                const codingQuestions = [
                    { question: 'Write a function to check if a string is a palindrome.', correctAnswer: 'bool isPalindrome(string s)...', difficulty: 'Easy' },
                    { question: 'Find the maximum element in an array.', correctAnswer: 'int max = arr[0]...', difficulty: 'Easy' },
                    { question: 'Implement a binary search algorithm.', correctAnswer: 'int binarySearch(int[] arr)...', difficulty: 'Medium' }
                ];
                for (const q of codingQuestions) {
                    await Question.create({
                        ...q,
                        companyId: company._id,
                        questionType: 'CODING',
                        roundType: 'CODING',
                        createdByAdmin: admin._id,
                        testCases: [{ input: '', expectedOutput: q.correctAnswer, isHidden: false }]
                    });
                }
                console.log(`Added ${codingQuestions.length} coding questions.`);
            } else if (company.name === 'SQL Practice') {
                const sqlQuestions = [
                    { question: 'Select all columns from the customers table.', correctAnswer: 'SELECT * FROM customers;', difficulty: 'Easy' },
                    { question: 'Count the total number of orders.', correctAnswer: 'SELECT COUNT(*) FROM orders;', difficulty: 'Easy' },
                    { question: 'Find the names of customers who spent more than 500.', correctAnswer: 'SELECT name FROM customers JOIN orders...', difficulty: 'Medium' }
                ];
                for (const q of sqlQuestions) {
                    await Question.create({
                        ...q,
                        companyId: company._id,
                        questionType: 'SQL',
                        roundType: 'SQL',
                        createdByAdmin: admin._id,
                        testCases: [{ input: 'CREATE TABLE customers(id INT, name TEXT);', expectedOutput: q.correctAnswer, isHidden: false }]
                    });
                }
                console.log(`Added ${sqlQuestions.length} SQL questions.`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('FAIL:', err.message);
        process.exit(1);
    }
}

seed();
