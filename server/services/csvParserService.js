const fs = require('fs');
const csv = require('csv-parser');
const Question = require('../models/Question');

const path = require('path');
const logFile = path.join(__dirname, '../server_logs.txt');

const parseAndSeedCsv = (filePath, companyId, roundNumber, overrideRoundType) => {
    return new Promise((resolve, reject) => {
        const results = [];
        console.log(`Starting CSV parse for file: ${filePath}, company: ${companyId}`);

        // Auto-detect delimiter
        let delimiter = ',';
        try {
            const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
            if (firstLine.includes(';')) delimiter = ';';
            else if (firstLine.includes('\t')) delimiter = '\t';
            fs.appendFileSync(logFile, `CSV: Detected delimiter: "${delimiter}"\n`);
        } catch (e) {
            fs.appendFileSync(logFile, `CSV: Delimiter detection failed, defaulting to comma\n`);
        }

        fs.createReadStream(filePath)
            .pipe(csv({ separator: delimiter }))
            .on('data', (row) => {
                // Find keys case-insensitively and with underscores/spaces removed
                const findKey = (patterns) => {
                    const rowKeys = Object.keys(row);
                    const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                    for (const pattern of patterns) {
                        const found = rowKeys.find(k => clean(k) === clean(pattern));
                        if (found) return row[found];
                    }
                    return null;
                };

                const roundTypeRaw = overrideRoundType || findKey(['roundType', 'round_type', 'round']) || 'APTITUDE';
                let questionTypeRaw = findKey(['questionType', 'question_type', 'type']) || 'MCQ';
                const finalRoundType = roundTypeRaw.toUpperCase().trim();
                
                // Auto-fix questionType based on roundType
                if (finalRoundType === 'CODING') questionTypeRaw = 'CODING';
                else if (finalRoundType === 'SQL') questionTypeRaw = 'SQL';
                
                const questionType = questionTypeRaw.toUpperCase().trim();

                // Support CODING, SQL and MCQ (restoring MCQ for internal company rounds)
                if (!['CODING', 'SQL', 'MCQ'].includes(questionType)) {
                    fs.appendFileSync(logFile, `CSV: Row skipped - Unsupported type: ${questionType}\n`);
                    return;
                }


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
                    roundType: finalRoundType,
                    roundNumber: roundNumber ? Number(roundNumber) : null,
                    questionType: questionType,
                    question: findKey(['question', 'question_text', 'text', 'problem', 'problem_statement', 'desc', 'description', 'name', 'title', 'nameque', 'namequestion']),
                    options: options,
                    correctAnswer: findKey(['correctAnswer', 'correct_ans', 'correct', 'answer', 'solution', 'query', 'sql', 'correct_query', 'sql_query', 'ans', 'answer_query', 'sql_ans', 'expected', 'expected_output', 'output', 'sqlanswer']),
                    solution: findKey(['solution', 'correct_code', 'correct_query', 'query', 'sql', 'sql_query', 'answer_query', 'sql_ans', 'expected', 'sqlanswer']),
                    difficulty: (findKey(['difficulty', 'level']) || 'Medium').charAt(0).toUpperCase() + (findKey(['difficulty', 'level']) || 'Medium').slice(1).toLowerCase().trim(),
                    testCases: []
                };

                // Parse SQL specific fields if type is SQL
                if (questionType === 'SQL') {
                    const schema = findKey(['schema', 'tableSchema', 'table_schema', 'create_table']) || '';
                    const sampleData = findKey(['sampleData', 'sample_data', 'insert_into', 'data']) || '';
                    const expectedOutput = findKey(['expectedOutput', 'expected_output', 'output', 'validation_query', 'validation']) || findKey(['correctAnswer', 'correct_ans', 'correct', 'answer']) || '';
                    
                    if (schema || sampleData) {
                        const combinedInput = `${schema}\n${sampleData}`.trim();
                        questionDoc.testCases = [{
                            input: combinedInput,
                            expectedOutput: expectedOutput.trim(),
                            isHidden: false
                        }];
                    }
                } else {
                    // Parse Test Cases for CODING (e.g. "input1:output1|input2:output2")
                    const rawTestCases = findKey(['testCases', 'test_cases', 'test_case', 'tests']);
                    if (rawTestCases) {
                        questionDoc.testCases = rawTestCases.split('|').map(tc => {
                            const parts = tc.split(':');
                            return { 
                                input: parts[0]?.trim() || '', 
                                expectedOutput: parts[1]?.trim() || '',
                                isHidden: false 
                            };
                        });
                    }
                }


                if (questionDoc.question && (questionDoc.correctAnswer || questionDoc.solution)) {
                    fs.appendFileSync(logFile, `CSV: Row accepted - ${questionDoc.roundType}\n`);
                    results.push(questionDoc);
                } else {
                    fs.appendFileSync(logFile, `CSV: Row skipped! Q:${!!questionDoc.question}, A:${!!questionDoc.correctAnswer}, S:${!!questionDoc.solution}\n`);
                }
            })
            .on('end', async () => {
                try {
                    let firstId = null;
                    if (results.length > 0) {
                        const inserted = await Question.insertMany(results);
                        firstId = inserted[0]?._id;
                    }
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    fs.appendFileSync(logFile, `CSV Import complete. Seeded ${results.length}\n`);
                    resolve({ count: results.length, firstId });
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

const parseSplitSqlCsv = async (tablesFiles, questionsFilePath, companyId, roundNumber) => {
    try {
        const Question = require('../models/Question');
        const fs = require('fs');
        const csv = require('csv-parser');
        const path = require('path');

        const tableDefinitions = [];
        const questions = [];

        // 1. Parse all Tables CSVs
        // Seed dummy tables IF NO OTHER SCHEMA IS PROVIDED (handled later)
        // db.run(SQL_DUMMY_DATA);
        for (const fileItem of tablesFiles) {
            const { path: tablesFilePath, originalname } = fileItem;
            const tableName = path.basename(originalname, '.csv').toLowerCase().replace(/[^a-z0-9_]/g, '');

                await new Promise((res, rej) => {
                    const rows = [];
                    let useOldLogic = false;

                    fs.createReadStream(tablesFilePath)
                        .pipe(csv())
                        .on('data', (row) => {
                            const keys = Object.keys(row);
                            const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                            
                            // Check if this row follows the old schema/data format
                            const hasSchema = keys.some(k => ['schema', 'tableschema', 'createtable', 'create'].includes(clean(k)));
                            const hasData = keys.some(k => ['data', 'sampledata', 'insertinto', 'insert'].includes(clean(k)));

                            if (hasSchema || hasData) {
                                useOldLogic = true;
                                const findKey = (patterns) => {
                                    for (const p of patterns) {
                                        const f = keys.find(k => clean(k) === clean(p));
                                        if (f) return row[f];
                                    }
                                    return null;
                                };
                                const schema = (findKey(['schema', 'tableSchema', 'createTable', 'create']) || '').trim();
                                const data = (findKey(['data', 'sampleData', 'insertInto', 'insert']) || '').trim();
                                
                                const schemaStr = schema && !schema.endsWith(';') ? schema + ';' : schema;
                                const dataStr = data && !data.endsWith(';') ? data + ';' : data;
                                
                                if (schemaStr || dataStr) {
                                    tableDefinitions.push(`${schemaStr}\n${dataStr}`.trim());
                                }
                            } else {
                                rows.push(row);
                            }
                        })
                        .on('end', () => {
                            if (!useOldLogic && rows.length > 0) {
                                const headers = Object.keys(rows[0]);
                                if (headers.length > 0) {
                                    // Generate CREATE TABLE statement
                                    const createStmt = `CREATE TABLE IF NOT EXISTS ${tableName} (${headers.map(h => `"${h}" TEXT`).join(', ')});`;
                                    
                                    // Generate INSERT statements
                                    const insertStmts = rows.map(r => {
                                        const values = headers.map(h => {
                                            const val = r[h] ? String(r[h]).replace(/'/g, "''") : '';
                                            return `'${val}'`;
                                        }).join(', ');
                                        return `INSERT INTO ${tableName} (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${values});`;
                                    }).join('\n');
                                    
                                    tableDefinitions.push(`${createStmt}\n${insertStmts}`);
                                }
                            }
                            res();
                        })
                        .on('error', rej);
                });
            }

            const combinedSchema = tableDefinitions.join('\n\n');

            // 2. Parse Questions CSV
            await new Promise((res, rej) => {
                fs.createReadStream(questionsFilePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        const findKey = (patterns) => {
                            const keys = Object.keys(row);
                            const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                            for (const p of patterns) {
                                const f = keys.find(k => clean(k) === clean(p));
                                if (f) return row[f];
                            }
                            return null;
                        };

                        const questionText = findKey(['question', 'text', 'problem', 'problem_statement', 'description', 'desc', 'q', 'name', 'title', 'nameque', 'namequestion', 'question_text']);
                        const correctAnswer = findKey(['correctAnswer', 'answer', 'query', 'solution', 'correctQuery', 'ans', 'expected', 'expected_output', 'output', 'correct_query', 'sql_query', 'sqlanswer', 'sql_ans', 'answer_query']);
                        const difficulty = (findKey(['difficulty', 'level', 'diff']) || 'Medium').trim();

                        if (questionText && correctAnswer) {
                            questions.push({
                                companyId,
                                roundType: 'SQL',
                                roundNumber: roundNumber ? Number(roundNumber) : null,
                                questionType: 'SQL',
                                question: questionText,
                                correctAnswer: correctAnswer,
                                difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase(),
                                testCases: [{
                                    input: tableDefinitions.map(t => t.endsWith(';') ? t : t + ';').join('\n'),
                                    expectedOutput: correctAnswer,
                                    isHidden: false
                                }]
                            });
                        }
                    })
                    .on('end', res)
                    .on('error', rej);
            });

            // 3. Insert into DB
            let firstId = null;
            if (questions.length > 0) {
                const inserted = await Question.insertMany(questions);
                firstId = inserted[0]?._id;
            }

            // Cleanup
            tablesFiles.forEach(fileItem => {
                if (fs.existsSync(fileItem.path)) fs.unlinkSync(fileItem.path);
            });
            if (fs.existsSync(questionsFilePath)) fs.unlinkSync(questionsFilePath);
        return { count: questions.length, firstId };
    } catch (error) {
        console.error('Split SQL Parse Error:', error);
        throw error;
    }
};

module.exports = { parseAndSeedCsv, parseSplitSqlCsv };
