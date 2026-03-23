import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Play, ChevronLeft, Database as DbIcon, Terminal, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { SQL_DUMMY_DATA } from '../../lib/sqlDummyData';

export default function SqlPracticePage() {
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [query, setQuery] = useState('-- Write your SQL query here...');
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSqlReady, setIsSqlReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const SQLObject = useRef(null);

    // Fetch daily SQL challenge
    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/challenge/today?type=SQL', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.questionId) {
                    setChallenge(data.questionId);
                }
            } catch (e) {
                console.error('Fetch challenge error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, []);

    // Initialize SQL.js
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
            }).catch(console.error);
        };
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }, []);

    const setupDatabase = useCallback(() => {
        if (!SQLObject.current || !challenge) return null;
        try {
            const db = new SQLObject.current.Database();
            
            // Seed dummy tables first
            db.run(SQL_DUMMY_DATA);

            const schema = challenge.testCases || [];
            if (schema.length > 0) {
                schema.forEach(tc => {
                    if (tc.input) {
                        const statements = tc.input.split(';').filter(s => s.trim());
                        statements.forEach(stmt => {
                            if (stmt.trim()) db.run(stmt.trim());
                        });
                    }
                });
            }
            return db;
        } catch (e) {
            console.error('DB setup error:', e);
            return null;
        }
    }, [challenge]);

    const handleRunQuery = () => {
        if (!isSqlReady) return;
        setIsRunning(true);
        setError('');

        try {
            const db = setupDatabase();
            if (!db) throw new Error('Failed to initialize database');
            const res = db.exec(query);
            if (res.length > 0) {
                setResults({
                    columns: res[0].columns,
                    rows: res[0].values
                });
            } else {
                setResults({ columns: [], rows: [] });
            }
            db.close();
        } catch (err) {
            setError(err.message);
            setResults(null);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!challenge) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/challenge/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    questionId: challenge._id,
                    passed: true,
                    type: 'SQL',
                    query: query
                })
            });
            const data = await res.json();
            alert(data.message || 'Submitted successfully!');
            navigate('/dashboard');
        } catch (e) {
            console.error('Submission error:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseSchemaFromChallenge = () => {
        if (!challenge) return [];
        const testCases = challenge.testCases || [];
        const tables = [];
        testCases.forEach(tc => {
            if (tc.input) {
                const createMatches = tc.input.match(/CREATE TABLE[^;]+/gi) || [];
                createMatches.forEach(stmt => {
                    const nameMatch = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
                    const colMatches = [...stmt.matchAll(/(\w+)\s+(INTEGER|TEXT|REAL|FLOAT|VARCHAR|INT|DATE|BOOLEAN|BLOB)(?:\s+PRIMARY\s+KEY)?/gi)];
                    if (nameMatch) {
                        tables.push({
                            name: nameMatch[1],
                            columns: colMatches.map(m => `${m[1]} (${m[2].toUpperCase()})`)
                                .filter(c => !c.startsWith('TABLE ') && !c.startsWith('CREATE ') && !c.startsWith('NOT ') && !c.startsWith('IF '))
                        });
                    }
                });
            }
        });

        // Add dummy tables to schema explorer
        const dummyMatches = SQL_DUMMY_DATA.match(/CREATE TABLE[^;]+/gi) || [];
        dummyMatches.forEach(stmt => {
            const nameMatch = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
            const colMatches = [...stmt.matchAll(/(\w+)\s+(INTEGER|TEXT|REAL|FLOAT|VARCHAR|INT|DATE|BOOLEAN|BLOB)(?:\s+PRIMARY\s+KEY)?/gi)];
            if (nameMatch) {
                // Prevent duplicate tables if already parsed from challenge
                if (!tables.find(t => t.name === nameMatch[1])) {
                    tables.push({
                        name: nameMatch[1],
                        columns: colMatches.map(m => `${m[1]} (${m[2].toUpperCase()})`)
                            .filter(c => !['TABLE', 'CREATE', 'NOT', 'IF'].includes(c.split(' ')[0].toUpperCase()))
                    });
                }
            }
        });

        if (tables.length === 0 && challenge.options?.length > 0) {
            return [{ name: 'data', columns: challenge.options.map(o => `${o} (TEXT)`) }];
        }
        return tables;
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!challenge) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-slate-800 mb-4">No SQL challenge available for today.</h2>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
    );

    const schema = parseSchemaFromChallenge();

    return (
        <div className="h-screen bg-slate-50 flex flex-col text-slate-700 font-sans">
            {/* SQL Navbar */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                            <Database size={18} />
                        </div>
                        <span className="font-bold text-slate-800">SQL Practice: {challenge.question.split('\n')[0]}</span>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px] font-black">
                            {challenge.difficulty || 'Medium'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-lg shadow-blue-200" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Solution'} <Send size={14} className="ml-2" />
                    </Button>
                </div>
            </header>

            {/* Main Interactive Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Tables & Editor */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 flex">
                        {/* Database Explorer Sidebar */}
                        <div className="w-64 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Explorer</span>
                                <Badge className="bg-slate-100 text-slate-500 border-none scale-75">{schema.length} Table{schema.length !== 1 ? 's' : ''}</Badge>
                            </div>
                            <div className="p-2 space-y-4">
                                {schema.map((table, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="p-2 rounded-lg bg-blue-50/50 text-blue-700 font-bold text-sm flex items-center gap-2">
                                            <DbIcon size={14} /> {table.name}
                                        </div>
                                        <div className="pl-8 space-y-1.5 py-1">
                                            {table.columns.map(col => (
                                                <div key={col} className="text-[11px] font-medium text-slate-400 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div> {col}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Query Editor */}
                        <div className="flex-1 flex flex-col bg-white">
                            <div className="h-10 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
                                <div className="flex items-center">
                                    <Terminal size={12} className="text-slate-400 mr-2" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Query Editor</span>
                                </div>
                                <button
                                    onClick={handleRunQuery}
                                    disabled={isRunning || !isSqlReady}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase"
                                >
                                    <Play size={10} className="fill-current" /> Run Query
                                </button>
                            </div>
                            <textarea
                                className="flex-1 p-6 font-mono text-sm text-slate-700 focus:outline-none resize-none bg-slate-50/20"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Results Table (Fixed Height) */}
                    <div className="h-1/2 border-t-4 border-slate-200 bg-white flex flex-col">
                        <div className="h-12 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
                            <div className="flex gap-6">
                                <button className="text-xs font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 py-4 translate-y-[1px]">Output Data</button>
                            </div>
                            {results && <span className="text-[10px] text-slate-400 font-bold">{results.rows.length} rows returned</span>}
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {!isSqlReady && (
                                <div className="flex flex-col items-center justify-center h-full opacity-50">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Mounting SQL Engine...</span>
                                </div>
                            )}
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Query Error</h4>
                                        <p className="text-sm font-mono text-rose-600 leading-relaxed">{error}</p>
                                    </div>
                                </div>
                            )}
                            {results && results.columns.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                {results.columns.map(col => (
                                                    <th key={col} className="px-4 py-3 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.rows.map((row, i) => (
                                                <tr key={i} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="px-4 py-3 text-sm font-medium text-slate-600">
                                                            {cell === null ? <span className="text-slate-300 italic">NULL</span> : String(cell)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : !error && isSqlReady && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                    <Terminal size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Run your query to see results in this pane.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Problem Description */}
                <div className="w-[350px] border-l border-slate-200 bg-white p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Problem Statement</h3>
                        <div className="prose prose-sm text-slate-600">
                            <p className="leading-relaxed whitespace-pre-wrap">
                                {challenge.question}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Practice Goal</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                                Execute a SQL query that correctly fetches the required data as per the problem description.
                            </p>
                            <Badge className="bg-blue-600 text-[10px] font-bold py-1">50 XP REWARD</Badge>
                        </div>
                        <div className="absolute bottom-0 right-0 p-2 opacity-10">
                            <CheckCircle2 size={64} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
