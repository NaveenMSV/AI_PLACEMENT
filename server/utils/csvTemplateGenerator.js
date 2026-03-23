const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

const generateTemplate = async () => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, 'question_template.csv');

    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'question', title: 'question' },
            { id: 'difficulty', title: 'difficulty' },
            { id: 'roundType', title: 'roundType' },
            { id: 'schema', title: 'schema' },
            { id: 'sample_data', title: 'sample_data' },
            { id: 'expected_output', title: 'expected_output' },
            { id: 'test_cases', title: 'test_cases' }
        ]

    });

    const records = [
        {
            question: 'Select all columns from employees where salary is greater than 80000',
            difficulty: 'Easy',
            roundType: 'SQL',
            schema: 'CREATE TABLE employees (id INTEGER, name TEXT, salary REAL);',
            sample_data: "INSERT INTO employees VALUES (1, 'Alice', 95000); INSERT INTO employees VALUES (2, 'Bob', 70000);",
            expected_output: '[[1,"Alice",95000]]',
            test_cases: ''
        },
        {
            question: 'Find the maximum value in an array',
            difficulty: 'Medium',
            roundType: 'CODING',
            schema: '',
            sample_data: '',
            expected_output: '',
            test_cases: '[1,2,3,4,5]:5 | [10,2,8]:10'
        }
    ];


    await csvWriter.writeRecords(records);
    return filePath;
};

module.exports = { generateTemplate };
