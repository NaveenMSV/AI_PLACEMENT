import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Play, Send, ChevronLeft, ChevronRight, CheckCircle, Timer, AlertTriangle } from 'lucide-react';
import { SQL_DUMMY_DATA } from '../../lib/sqlDummyData';

export default function SqlRound({ questions = [], onFinish, attemptId, roundNumber = 1 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [queryResults, setQueryResults] = useState(null);
    const [queryError, setQueryError] = useState('');
    const [tableSamples, setTableSamples] = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSqlReady, setIsSqlReady] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1800);
    const dbRef = useRef(null);
    const SQLObject = useRef(null);

    const currentQuestion = questions[currentIndex];

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitAll();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Initialize sql.js via CDN script for better compatibility
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://sql.js.org/dist/sql-wasm.js";
        script.async = true;
        script.onload = () => {
            window.initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            }).then(SQL => {
                SQLObject.current = SQL;
                setIsSqlReady(true);
            }).catch(err => {
                console.error('Failed to init sql.js:', err);
                setQueryError('Failed to load SQL engine. Please refresh.');
            });
        };
        script.onerror = () => {
            setQueryError('Network error loading SQL engine.');
        };
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);

    // Setup database for current question
    const setupDatabase = useCallback(() => {
        if (!SQLObject.current || !currentQuestion) return null;

        try {
            const db = new SQLObject.current.Database();
            
            // Seed dummy tables IF NO OTHER SCHEMA IS PROVIDED (handled later)
            // db.run(SQL_DUMMY_DATA);

            // Parse schema and seed data from question
            const schema = currentQuestion.testCases || [];

            // If schema contains SQL setup statements, execute them
            if (schema.length > 0) {
                schema.forEach(tc => {
                    if (tc.input) {
                        try {
                            // Split multiple statements and execute each
                            const statements = tc.input.split(';').filter(s => s.trim());
                            statements.forEach(stmt => {
                                if (stmt.trim()) db.run(stmt.trim());
                            });
                        } catch (e) {
                            console.warn('Schema setup error:', e.message);
                        }
                    }
                });
            } else {
                // Seed standard dummy data set as fallback
                try {
                    db.run(SQL_DUMMY_DATA);
                } catch (e) {
                    console.warn('DUMMY data error:', e.message);
                }

                // Default: Create sample tables from the question context
                try {
                    db.run(`
                        CREATE TABLE IF NOT EXISTS sales (
                            sale_id INTEGER PRIMARY KEY, item_id INTEGER, quantity INTEGER,
                            price REAL, sale_date TEXT
                        );
                        INSERT INTO sales VALUES (1, 1, 10, 25.50, '2023-01-15');
                        INSERT INTO sales VALUES (2, 2, 5, 100.00, '2023-03-20');
                        INSERT INTO sales VALUES (3, 1, 8, 25.50, '2023-06-10');
                        INSERT INTO sales VALUES (4, 3, 20, 10.00, '2023-06-15');
                        INSERT INTO sales VALUES (5, 2, 3, 100.00, '2023-09-01');
                    `);
                    db.run(`
                        CREATE TABLE IF NOT EXISTS items (
                            item_id INTEGER PRIMARY KEY, item_name TEXT
                        );
                        INSERT INTO items VALUES (1, 'Widget A');
                        INSERT INTO items VALUES (2, 'Gadget B');
                        INSERT INTO items VALUES (3, 'Tool C');
                    `);
                } catch (e) {
                    console.warn('Default schema error:', e.message);
                }
            }

            // Fetch sample data for each table
            const samples = {};
            const schemaTables = parseSchema();
            schemaTables.forEach(table => {
                try {
                    const res = db.exec(`SELECT * FROM "${table.name}" LIMIT 5`);
                    if (res.length > 0) {
                        samples[table.name] = {
                            columns: res[0].columns,
                            rows: res[0].values
                        };
                    }
                } catch (e) {
                    console.warn(`Failed to fetch sample for ${table.name}:`, e.message);
                }
            });
            setTableSamples(samples);

            return db;
        } catch (err) {
            console.error('DB setup error:', err);
            return null;
        }
    }, [currentQuestion]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Run query against local sql.js database
    const handleRunQuery = async () => {
        if (!currentQuestion) return;
        const query = answers[currentQuestion._id] || '';
        if (!query.trim()) {
            setQueryError('Please write a SQL query first.');
            setQueryResults(null);
            return;
        }

        if (!isSqlReady) {
            setQueryError('SQL engine is still loading. Please wait a moment...');
            return;
        }

        setIsRunning(true);
        setQueryError('');
        setQueryResults(null);

        try {
            const db = setupDatabase();
            if (!db) {
                setQueryError('Failed to initialize database for this question.');
                setIsRunning(false);
                return;
            }

            const results = db.exec(query.trim());
            db.close();

            if (results.length > 0) {
                setQueryResults({
                    columns: results[0].columns,
                    rows: results[0].values
                });
            } else {
                setQueryResults({ columns: [], rows: [] });
                setQueryError('Query executed successfully but returned no results.');
            }
        } catch (err) {
            setQueryError(err.message);
        } finally {
            setIsRunning(false);
        }
    };

    // Submit all answers
    const handleSubmitAll = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/test/${attemptId}/round/${roundNumber}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    answers,
                    timeTaken: 1800 - timeLeft
                })
            });
            if (res.ok) onFinish();
        } catch (error) {
            console.error('SQL submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Parse schema from question for display
    const parseSchema = () => {
        if (!currentQuestion) return [];
        const testCases = currentQuestion.testCases || [];
        const tables = [];

        // Try to extract CREATE TABLE statements from testCases
        testCases.forEach(tc => {
            if (tc.input) {
                const createMatches = tc.input.match(/CREATE TABLE[^;]+/gi) || [];
                createMatches.forEach(stmt => {
                    // Match table name (handle optional quotes)
                    const nameMatch = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["']?(\w+)["']?/i);
                    // Match column definitions: name type
                    const colMatches = [...stmt.matchAll(/["']?(\w+)["']?\s+([A-Z]+)/gi)];
                    
                    if (nameMatch) {
                        const tableName = nameMatch[1];
                        const columns = colMatches
                            .map(m => ({ name: m[1], type: m[2].toUpperCase() }))
                            .filter(c => !['CREATE', 'TABLE', 'IF', 'NOT', 'EXISTS'].includes(c.name.toUpperCase()));

                        if (columns.length > 0) {
                            tables.push({ name: tableName, columns });
                        }
                    }
                });
            }
        });

        // Fallback if no schema parsed
        if (tables.length === 0 && currentQuestion.options && currentQuestion.options.length > 0) {
            // Use options as table hints
            return [{ name: 'data', columns: currentQuestion.options.map(o => ({ name: o, type: 'TEXT' })) }];
        }

        return tables;
    };

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertTriangle size={48} className="text-orange-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">No SQL Questions Found</h2>
                    <p className="text-slate-500 mt-2">No questions available for this round.</p>
                </div>
            </div>
        );
    }

    const schema = parseSchema();

    return (
        <div className="h-[calc(100vh-48px)] flex flex-col bg-slate-50">
            {/* Header */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-900">
                        SQL Assessment: Q{currentIndex + 1}/{questions.length}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`font-mono text-sm font-bold flex items-center gap-1 ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                        <Timer size={16} />{formatTime(timeLeft)}
                    </span>
                    <button
                        onClick={handleSubmitAll}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} /> Submit All
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem & Schema */}
                <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-slate-900">{currentQuestion?.question || 'SQL Problem'}</h2>

                        {schema.length > 0 && (
                            <>
                                <h3 className="font-semibold flex items-center gap-2 mb-3 text-slate-700">
                                    <Database size={16} className="text-blue-500" /> Database Schema ({schema.length} table{schema.length !== 1 ? 's' : ''})
                                </h3>
                                <div className="space-y-4">
                                    {schema.map((table, i) => (
                                        <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-medium text-sm text-slate-700">
                                                Table: {table.name}
                                            </div>
                                            <div className="p-3 text-sm font-mono text-slate-600 space-y-1">
                                                {table.columns.map((col, j) => (
                                                    <div key={j} className="flex justify-between">
                                                        <span>{col.name}</span>
                                                        <span className="text-blue-600">{col.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {tableSamples[table.name] && (
                                                <div className="border-t border-slate-100 p-2">
                                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 ml-1">Sample Data</div>
                                                    <div className="overflow-x-auto max-h-40">
                                                        <table className="min-w-full text-[10px] border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50">
                                                                    {tableSamples[table.name].columns.map((col, k) => (
                                                                        <th key={k} className="px-2 py-1 text-left border border-slate-100">{col}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {tableSamples[table.name].rows.slice(0, 3).map((row, k) => (
                                                                    <tr key={k}>
                                                                        {row.map((cell, l) => (
                                                                            <td key={l} className="px-2 py-1 border border-slate-100 truncate max-w-[80px]">{cell}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Question navigation */}
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setQueryResults(null); setQueryError(''); }}
                                disabled={currentIndex === 0}
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <div className="flex gap-2">
                                {questions.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setCurrentIndex(i); setQueryResults(null); setQueryError(''); }}
                                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${i === currentIndex
                                            ? 'bg-blue-600 text-white'
                                            : answers[questions[i]?._id]
                                                ? 'bg-green-100 text-green-700 border border-green-300'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {answers[questions[i]?._id] ? <CheckCircle size={14} /> : i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1)); setQueryResults(null); setQueryError(''); }}
                                disabled={currentIndex === questions.length - 1}
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor & Results */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <div className="h-10 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50 shrink-0">
                        <span className="text-sm font-medium text-slate-600">Query Editor (SQLite)</span>
                        <button
                            onClick={handleRunQuery}
                            disabled={isRunning}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            <Play size={14} /> {isRunning ? 'Running...' : 'Run Query'}
                        </button>
                    </div>

                    {/* SQL Editor */}
                    <div className="flex-1 p-4 border-b border-slate-200">
                        <textarea
                            className="w-full h-full font-mono text-sm p-3 bg-slate-900 text-green-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
                            placeholder="-- Write your SQL query here..."
                            value={answers[currentQuestion?._id] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion._id]: e.target.value }))}
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                    handleRunQuery();
                                }
                            }}
                            spellCheck={false}
                        />
                    </div>

                    {/* Results Table */}
                    <div className="h-1/3 bg-white flex flex-col shrink-0">
                        <div className="px-4 py-2 border-b border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-2 shrink-0">
                            Result
                            {queryResults && (
                                <span className="text-xs text-slate-400 font-normal">
                                    ({queryResults.rows.length} row{queryResults.rows.length !== 1 ? 's' : ''})
                                </span>
                            )}
                        </div>
                        <div className="p-4 overflow-auto flex-1 bg-slate-50">
                            {!isSqlReady && (
                                <div className="flex flex-col items-center justify-center p-8 text-slate-500 italic">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mb-2"></div>
                                    <p className="text-sm">SQL engine initializing...</p>
                                </div>
                            )}
                            {isSqlReady && queryError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-mono">
                                    <AlertTriangle size={14} className="inline mr-2" />
                                    {queryError}
                                </div>
                            )}
                            {isSqlReady && queryResults && queryResults.columns.length > 0 ? (
                                <div className="overflow-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                {queryResults.columns.map((col, i) => (
                                                    <th key={i} className="px-3 py-2 text-left font-bold text-slate-700 border-b border-slate-200">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {queryResults.rows.map((row, i) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="px-3 py-2 text-slate-600 font-mono border-b border-slate-100">{cell === null ? 'NULL' : String(cell)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : isSqlReady && !queryError ? (
                                <p className="text-slate-400 text-sm italic">Run your query to see results here.</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
