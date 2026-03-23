import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Database, Play, Trash2, Download, Table, Info, Search, Code, CheckCircle, AlertCircle } from 'lucide-react';

export default function SqlPlaygroundPage() {
    const [query, setQuery] = useState('-- Write your SQL here\nSELECT * FROM employees;');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSqlReady, setIsSqlReady] = useState(false);
    const [history, setHistory] = useState([]);
    const [schema, setSchema] = useState([]);
    const dbRef = useRef(null);
    const SQLObject = useRef(null);

    // Initialize sql.js
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://sql.js.org/dist/sql-wasm.js";
        script.async = true;
        script.onload = () => {
            window.initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            }).then(SQL => {
                SQLObject.current = SQL;
                dbRef.current = new SQL.Database();
                seedDefaultData();
                setIsSqlReady(true);
                updateSchema();
            }).catch(err => {
                console.error('Failed to init sql.js:', err);
                setError('Failed to load SQL engine. Please refresh.');
            });
        };
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
            if (dbRef.current) dbRef.current.close();
        };
    }, []);

    const seedDefaultData = () => {
        if (!dbRef.current) return;
        try {
            dbRef.current.run(`
                CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, role TEXT, salary INTEGER, dept_id INTEGER);
                INSERT INTO employees VALUES (1, 'Alice Johnson', 'Software Engineer', 85000, 1);
                INSERT INTO employees VALUES (2, 'Bob Smith', 'Product Manager', 95000, 2);
                INSERT INTO employees VALUES (3, 'Charlie Brown', 'Designer', 75000, 2);
                INSERT INTO employees VALUES (4, 'Diana Ross', 'Data Scientist', 110000, 1);
                INSERT INTO employees VALUES (5, 'Edward Norton', 'HR Lead', 65000, 3);

                CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT, location TEXT);
                INSERT INTO departments VALUES (1, 'Engineering', 'Building A');
                INSERT INTO departments VALUES (2, 'Product', 'Building B');
                INSERT INTO departments VALUES (3, 'Human Resources', 'Building C');
            `);
        } catch (e) {
            console.error('Seeding error:', e);
        }
    };

    const updateSchema = () => {
        if (!dbRef.current) return;
        try {
            const res = dbRef.current.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
            if (res.length > 0) {
                const tables = res[0].values.map(v => {
                    const tableName = v[0];
                    const colRes = dbRef.current.exec(`PRAGMA table_info(${tableName});`);
                    return {
                        name: tableName,
                        columns: colRes.length > 0 ? colRes[0].values.map(c => ({ name: c[1], type: c[2] })) : []
                    };
                });
                setSchema(tables);
            }
        } catch (e) {
            console.error('Schema update error:', e);
        }
    };

    const handleRunQuery = () => {
        if (!isSqlReady || !dbRef.current || !query.trim()) return;
        setIsRunning(true);
        setError(null);
        setResults(null);

        // Add to history
        setHistory(prev => [query.trim(), ...prev.slice(0, 9)]);

        setTimeout(() => {
            try {
                const res = dbRef.current.exec(query.trim());
                if (res.length > 0) {
                    setResults({
                        columns: res[0].columns,
                        rows: res[0].values
                    });
                } else {
                    setResults({ columns: [], rows: [] });
                    // If it was a CREATE/INSERT/DROP, update schema
                    if (/CREATE|DROP|ALTER|INSERT|UPDATE|DELETE/i.test(query)) {
                        updateSchema();
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsRunning(false);
            }
        }, 100);
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleRunQuery();
        }
    };

    const clearPlayground = () => {
        if (window.confirm('Clear all tables and reset to default?')) {
            dbRef.current = new SQLObject.current.Database();
            seedDefaultData();
            updateSchema();
            setResults(null);
            setError(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Database className="text-blue-600" /> SQL Playground
                        </h1>
                        <p className="text-sm text-slate-500">Practice your SQL skills in a live SQLite environment.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={clearPlayground} className="text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 size={16} className="mr-2" /> Reset DB
                        </Button>
                        <Button size="sm" onClick={handleRunQuery} disabled={isRunning || !isSqlReady} className="bg-blue-600 hover:bg-blue-700">
                            <Play size={16} className="mr-2" /> Run Query (Ctrl+Enter)
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left Side: Sidebar & Editor */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {/* Editor Section */}
                        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200">
                            <div className="bg-slate-900 px-4 py-2 flex justify-between items-center">
                                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Query Editor</span>
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    className="w-full h-full p-4 font-mono text-sm bg-slate-950 text-emerald-400 focus:outline-none resize-none selection:bg-blue-500/30"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    spellCheck={false}
                                />
                                {!isSqlReady && (
                                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                                            <p className="text-slate-400 animate-pulse">Initializing SQL Engine...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Result Section */}
                        <Card className="h-2/5 flex flex-col overflow-hidden border-slate-200">
                            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
                                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Code size={16} className="text-blue-500" /> Results
                                    {results && <span className="text-xs font-normal text-slate-400 ml-auto">{results.rows.length} rows</span>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-auto flex-1 bg-white">
                                {error && (
                                    <div className="p-4 m-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-700">
                                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                        <div className="text-sm font-mono whitespace-pre-wrap">{error}</div>
                                    </div>
                                )}
                                
                                {results && results.columns.length > 0 ? (
                                    <div className="inline-block min-w-full align-middle">
                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    {results.columns.map((col, i) => (
                                                        <th key={i} className="px-4 py-3 text-left font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider whitespace-nowrap">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-100 font-mono">
                                                {results.rows.map((row, i) => (
                                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                                                                {cell === null ? <span className="text-slate-300 italic">NULL</span> : String(cell)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : results ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                        <CheckCircle size={32} className="text-green-500 mb-2 opacity-20" />
                                        <p className="text-sm">Query executed successfully (no returns).</p>
                                    </div>
                                ) : !error && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Search size={48} className="mb-4 opacity-10" />
                                        <p className="text-sm">Run a query to see results here</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: Explorer & History */}
                    <div className="w-80 flex flex-col gap-4 shrink-0">
                        {/* Schema Explorer */}
                        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200">
                            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
                                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Table size={16} className="text-blue-500" /> Database Tables
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1">
                                <div className="p-3 space-y-3">
                                    {schema.map((table, i) => (
                                        <div key={i} className="group">
                                            <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-blue-600 mb-1 transition-colors">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                    {table.name}
                                                </span>
                                                <Info size={14} className="opacity-0 group-hover:opacity-100" />
                                            </button>
                                            <div className="pl-4 border-l-2 border-slate-100 space-y-1">
                                                {table.columns.map((col, j) => (
                                                    <div key={j} className="flex justify-between text-[11px] font-mono text-slate-500">
                                                        <span>{col.name}</span>
                                                        <span className="text-slate-300">{col.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {schema.length === 0 && (
                                        <p className="text-xs text-slate-400 italic text-center py-4">No tables found</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent History */}
                        <Card className="h-1/3 flex flex-col overflow-hidden border-slate-200">
                            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
                                <CardTitle className="text-sm font-bold text-slate-700">Recent Queries</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1">
                                <div className="divide-y divide-slate-100">
                                    {history.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(q)}
                                            className="w-full text-left p-3 hover:bg-slate-50 transition-colors group"
                                        >
                                            <p className="text-xs font-mono text-slate-500 line-clamp-1 group-hover:text-blue-600">{q}</p>
                                        </button>
                                    ))}
                                    {history.length === 0 && (
                                        <p className="text-xs text-slate-400 italic text-center py-8">No recent history</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
