const initSqlJs = require('sql.js');
const { runCode } = require('./codeExecutionService');

/**
 * Execute a SQL query against a schema and return results
 */
const executeSqlQuery = async (query, schemaSql) => {
    try {
        const SQL = await initSqlJs();
        const db = new SQL.Database();

        // 1. Setup schema
        if (schemaSql && schemaSql.length > 0) {
            schemaSql.split(';').forEach(stmt => {
                if (stmt.trim()) db.run(stmt.trim());
            });
        }

        // 2. Execute query
        const res = db.exec(query);
        db.close();

        if (res.length === 0) return { columns: [], rows: [] };
        return {
            columns: res[0].columns,
            rows: res[0].values
        };
    } catch (error) {
        console.error('SQL Execution Error:', error.message);
        return { error: error.message };
    }
};

const compareSqlResults = (res1, res2) => {
    if (res1.error || res2.error) return false;
    if (res1.columns.length !== res2.columns.length) return false;
    if (res1.rows.length !== res2.rows.length) return false;

    // Compare values (stringified for deep comparison)
    return JSON.stringify(res1.rows) === JSON.stringify(res2.rows);
};

const calculateScore = async (submittedAnswers, actualQuestions) => {
    let score = 0;
    let correct = 0;

    for (const q of actualQuestions) {
        const qId = q._id.toString();
        const studentAnswer = submittedAnswers[qId];

        if (studentAnswer !== undefined && studentAnswer !== null) {
            if (q.questionType === 'SQL') {
                // REAL SQL EXECUTION
                const schemaStatements = (q.testCases || []).map(tc => tc.input).join('; ');

                const studentRes = await executeSqlQuery(studentAnswer, schemaStatements);
                const correctRes = await executeSqlQuery(q.correctAnswer, schemaStatements);

                const isMatch = compareSqlResults(studentRes, correctRes);

                // Fallback: If execution fails or returns no results, try normalized string comparison
                let fallbackMatch = false;
                if (!isMatch) {
                    const normalizeSql = (sql) => sql.toLowerCase().replace(/;/g, '').replace(/\s+/g, ' ').trim();
                    if (normalizeSql(studentAnswer) === normalizeSql(q.correctAnswer)) {
                        fallbackMatch = true;
                    }
                }

                console.log(`  Q[${qId}] (SQL): studentMatch=${isMatch} (fallback=${fallbackMatch})`);
                if (isMatch || fallbackMatch) {
                    score += 5;
                    correct++;
                }
            } else if (q.questionType === 'CODING') {
                // REAL CODING EVALUATION
                const result = await runCode(submittedAnswers.language || 'JavaScript', studentAnswer, q.testCases || []);
                
                console.log(`  Q[${qId}] (CODING): passed=${result.passedCount}/${result.totalTests}`);
                
                // Score based on percentage of test cases passed
                if (result.totalTests > 0) {
                    const passRatio = result.passedCount / result.totalTests;
                    score += 5 * passRatio;
                    if (passRatio === 1) correct++;
                }
            } else if (q.questionType === 'SHORT_ANSWER') {
                // Short answer / Interview questions are NOT auto-scored
                // They will be manually marked by the admin
                console.log(`  Q[${qId}] (SHORT_ANSWER): Skipping auto-score (Manual marking required)`);
                // We don't advance score or correct count here
            } else {
                // Standard logic for MCQ
                let studentStr = String(studentAnswer).trim().toLowerCase();
                let correctStr = String(q.correctAnswer).trim().toLowerCase();

                // If q.correctAnswer is just a letter (A, B, C, D) but q.options exists, map it
                const letterMatch = q.correctAnswer.trim().match(/^([A-Da-d])$/);
                if (letterMatch && q.options && q.options.length > 0) {
                    const letterIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
                    if (letterIndex >= 0 && letterIndex < q.options.length) {
                        correctStr = q.options[letterIndex].trim().toLowerCase();
                    }
                }
                
                // Also check if the student SUBMITTED a letter but the correct answer is the full text
                const studentLetterMatch = studentStr.match(/^([a-d])$/);
                if (studentLetterMatch && q.options && q.options.length > 0) {
                    const studentIndex = studentLetterMatch[1].toUpperCase().charCodeAt(0) - 65;
                    if (studentIndex >= 0 && studentIndex < q.options.length) {
                        studentStr = q.options[studentIndex].trim().toLowerCase();
                    }
                }

                const normalize = (str) => {
                    if (!str) return "";
                    return str.toString()
                        .replace(/;/g, '') // Remove semicolons
                        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
                        .replace(/\s+/g, ' ') // Collapse multiple spaces
                        .trim()
                        .toLowerCase();
                };

                const normalizedStudent = normalize(studentStr);
                const normalizedCorrect = normalize(correctStr);

                const isMatch = normalizedStudent === normalizedCorrect;

                console.log(`  Q[${qId}] (${q.questionType}): student="${normalizedStudent}" correct="${normalizedCorrect}" match=${isMatch}`);

                if (isMatch) {
                    score += 5;
                    correct++;
                }
            }
        }
    }

    console.log(`Score Result: ${correct}/${actualQuestions.length} correct, ${score} points`);
    return { score, correct, total: actualQuestions.length };
};

const finalizeTestAttempt = async (attemptId, models) => {
    const { TestAttempt, RoundAttempt } = models;

    try {
        // Check current status first
        const currentAttempt = await TestAttempt.findById(attemptId);
        if (!currentAttempt) {
            console.error(`finalizeTestAttempt: Attempt ${attemptId} not found.`);
            return null;
        }

        // If already completed, just return it
        if (currentAttempt.status === 'COMPLETED') {
            console.log(`finalizeTestAttempt: Attempt ${attemptId} already COMPLETED.`);
            return currentAttempt;
        }

        const roundAttempts = await RoundAttempt.find({ attemptId });

        let totalScore = 0;
        let totalQuestions = 0;
        roundAttempts.forEach(ra => {
            totalScore += (ra.score || 0);

            if (ra.totalQuestions !== undefined && ra.totalQuestions > 0) {
                totalQuestions += ra.totalQuestions;
            }
            else if (ra.answers && typeof ra.answers === 'object') {
                totalQuestions += Object.keys(ra.answers).length;
            }
        });

        const maxPoints = totalQuestions > 0 ? totalQuestions * 5 : 1;
        const scorePercent = totalQuestions > 0 ? Math.round((totalScore / maxPoints) * 100) : totalScore;

        console.log(`Finalizing attempt ${attemptId}. Raw Score: ${totalScore}. Questions: ${totalQuestions}. Percentage: ${scorePercent}%. Rounds: ${roundAttempts.length}. Current Status: ${currentAttempt.status}`);

        // Force update to COMPLETED regardless of current status (IN_PROGRESS, MALPRACTICE, etc.)
        const updatedAttempt = await TestAttempt.findByIdAndUpdate(
            attemptId,
            {
                status: 'COMPLETED',
                endTime: new Date(),
                score: scorePercent
            },
            { new: true }
        ).populate('companyId', 'name');

        if (!updatedAttempt) {
            console.error(`Attempt ${attemptId} update failed during finalization.`);
        } else {
            console.log(`finalizeTestAttempt: SUCCESS - ${attemptId} now COMPLETED with score ${scorePercent}%`);
        }

        return updatedAttempt;
    } catch (error) {
        console.error(`Error in finalizeTestAttempt for ${attemptId}:`, error);
        // Last resort fallback
        return await TestAttempt.findByIdAndUpdate(attemptId, { status: 'COMPLETED', endTime: new Date() }, { new: true });
    }
};

module.exports = { calculateScore, finalizeTestAttempt };
