const fs = require('fs');
const csv = require('csv-parser');
const Question = require('../models/Question');

const parseAndSeedCsv = (filePath, companyId, roundNumber) => {
    return new Promise((resolve, reject) => {
        const results = [];
        console.log(`Starting CSV parse for file: ${filePath}, company: ${companyId}`);

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Find keys case-insensitively and with underscores/spaces removed
                const findKey = (patterns) => {
                    const rowKeys = Object.keys(row);
                    for (const pattern of patterns) {
                        const found = rowKeys.find(k =>
                            k.toLowerCase().replace(/[\s_]/g, '') === pattern.toLowerCase().replace(/[\s_]/g, '')
                        );
                        if (found) return row[found];
                    }
                    return null;
                };

                const roundTypeRaw = findKey(['roundType', 'round_type', 'round']) || 'APTITUDE';
                const questionTypeRaw = findKey(['questionType', 'question_type', 'type']) || 'MCQ';

                // Construct options (handle multiple formats: opt_a, options pipe separated, etc)
                let options = [];
                const pipeOptions = findKey(['options', 'choices']);
                if (pipeOptions) {
                    options = pipeOptions.split('|').map(o => o.trim());
                } else {
                    options = [
                        findKey(['opt_a', 'option_a', 'optionA', '1']),
                        findKey(['opt_b', 'option_b', 'optionB', '2']),
                        findKey(['opt_c', 'option_c', 'optionC', '3']),
                        findKey(['opt_d', 'option_d', 'optionD', '4'])
                    ].filter(Boolean);
                }

                const questionDoc = {
                    companyId,
                    roundType: roundTypeRaw.toUpperCase().trim(),
                    roundNumber: roundNumber ? Number(roundNumber) : null,
                    questionType: questionTypeRaw.toUpperCase().trim(),
                    question: findKey(['question', 'question_text', 'text']),
                    options: options,
                    correctAnswer: findKey(['correctAnswer', 'correct_ans', 'correct', 'answer']),
                    difficulty: (findKey(['difficulty', 'level']) || 'Medium').charAt(0).toUpperCase() + (findKey(['difficulty', 'level']) || 'Medium').slice(1).toLowerCase().trim()
                };

                if (questionDoc.question && questionDoc.correctAnswer) {
                    results.push(questionDoc);
                }
            })
            .on('end', async () => {
                try {
                    console.log(`Parsed ${results.length} questions from CSV. Inserting into DB...`);
                    if (results.length > 0) {
                        await Question.insertMany(results);
                    }
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    console.log('CSV Import successful.');
                    resolve(results.length);
                } catch (error) {
                    console.error('Database insertion error:', error.message);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('CSV Stream error:', error.message);
                reject(error);
            });
    });
};

module.exports = { parseAndSeedCsv };
