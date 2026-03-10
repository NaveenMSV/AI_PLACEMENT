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
            { id: 'optionA', title: 'optionA' },
            { id: 'optionB', title: 'optionB' },
            { id: 'optionC', title: 'optionC' },
            { id: 'optionD', title: 'optionD' },
            { id: 'correctAnswer', title: 'correctAnswer' },
            { id: 'difficulty', title: 'difficulty' },
            { id: 'roundType', title: 'roundType' }
        ]
    });

    const records = [
        {
            question: 'What is the sum of 2+2?',
            optionA: '3',
            optionB: '4',
            optionC: '5',
            optionD: '6',
            correctAnswer: '4',
            difficulty: 'Easy',
            roundType: 'APTITUDE'
        }
    ];

    await csvWriter.writeRecords(records);
    return filePath;
};

module.exports = { generateTemplate };
