import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Send, Award, Clock, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

export default function CodingPracticePage() {
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('console');
    const [output, setOutput] = useState('');
    const [testResults, setTestResults] = useState(null);

    const defaultBoilerplates = {
        'Java': `import java.util.*;\n\nclass Solution {\n    public void solve(String input) {\n        // Your code here\n    }\n}`,
        'Python': `import math\nimport collections\n\nclass Solution:\n    def solve(self, input):\n        pass`,
        'C++': `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve(string input) {\n        // Your code here\n    }\n};`,
        'JavaScript': `/**\n * @param {any} input\n */\nvar solve = function(input) {\n    // Your code here\n};`,
        'SQL': `-- Write your SQL query here\nSELECT * FROM employees;`
    };

    const getBoilerplate = (lang, challengeData) => {
        if (challengeData?.boilerplates && challengeData.boilerplates[lang]) {
            return challengeData.boilerplates[lang];
        }
        return defaultBoilerplates[lang] || '';
    };

    useEffect(() => {
        fetchChallenge();
    }, []);

    const fetchChallenge = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/challenge/today', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const questionData = data.questionId || data;
                setChallenge(questionData);
                
                // If it's a SQL question, force SQL language
                if (questionData.questionType === 'SQL') {
                    setLanguage('SQL');
                    setCode(getBoilerplate('SQL', questionData));
                } else {
                    setCode(getBoilerplate(language, questionData));
                }
            }
        } catch (e) {
            console.error('Fetch challenge error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang) => {
        const currentGenericDefault = getBoilerplate(language, challenge);
        const isDefault = code === currentGenericDefault || code === '';
        
        if (isDefault || window.confirm('Changing language will reset your current code. Continue?')) {
            setLanguage(lang);
            setCode(getBoilerplate(lang, challenge));
            setTestResults(null);
            setOutput('');
        }
    };

    const handleRunCode = async () => {
        if (!challenge) return;
        setIsRunning(true);
        setActiveTab('console');
        setOutput('Executing code...');
        setTestResults(null);
        
        try {
            const token = localStorage.getItem('token');
            const isSql = language === 'SQL' || challenge.questionType === 'SQL';
            const endpoint = isSql ? '/api/student/sql/run' : '/api/student/code/run';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    language, 
                    code, 
                    query: code, // for SQL endpoint
                    testCases: challenge.testCases 
                })
            });


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to run code');
            }

            const data = await response.json();
            
            setIsRunning(false);
            setTestResults(data.results);
            
            if (data.error) {
                setOutput(`Error: ${data.error}`);
            } else if (data.results && data.results.some(r => r.status === 'ERROR')) {
                const firstError = data.results.find(r => r.status === 'ERROR');
                setOutput(`Error:\n${firstError.error || 'Execution failed. Check Test Explorer.'}`);
            } else {
                setOutput(data.output || (data.results?.every(r => r.status === 'PASSED') ? 'All Test Cases Passed!' : 'Execution completed with mismatches.'));
            }

        } catch (error) {
            console.error('Run Code Error:', error);
            setIsRunning(false);
            setOutput(`Error: ${error.message}`);
        }
    };

    const handleSubmit = async () => {
        if (!challenge) return;
        setIsSubmitting(true);
        
        try {
            const token = localStorage.getItem('token');
            // Check if all test cases passed locally first (optional but good UI)
            const allPassed = testResults && testResults.every(r => r.status === 'PASSED');
            
            const res = await fetch('/api/challenge/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    questionId: challenge._id,
                    passed: allPassed,
                    code: code,
                    language: language
                })
            });
            const data = await res.json();
            alert(data.message || 'Submitted successfully!');
            if (allPassed) navigate('/dashboard');
        } catch (e) {
            console.error('Submission error:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newCode = code.substring(0, start) + "    " + code.substring(end);
            setCode(newCode);
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            }, 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const lines = code.substring(0, start).split('\n');
            const currentLine = lines[lines.length - 1];
            const indentation = currentLine.match(/^\s*/)[0];
            let extraIndent = "";
            const trimmedLine = currentLine.trim();
            if (trimmedLine.endsWith('{') || trimmedLine.endsWith(':')) extraIndent = "    ";
            const newText = "\n" + indentation + extraIndent;
            const newCode = code.substring(0, start) + newText + code.substring(end);
            setCode(newCode);
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + newText.length;
            }, 0);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!challenge) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
            <h2 className="text-xl mb-4">No challenge available for today.</h2>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
    );

    return (
        <div className="h-screen bg-[#0f172a] flex flex-col text-slate-300 font-sans">
            {/* Practice Navbar */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-bold text-white leading-none">Coding Practice: {challenge.question.split('\n')[0]}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                            <Shield size={10} className="text-blue-500" /> Secure Environment
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <Clock size={16} className="text-blue-400" />
                        <span className="text-sm font-mono font-bold text-blue-100">Practice Mode</span>
                    </div>
                    <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-lg shadow-blue-500/20" onClick={handleSubmit} disabled={isSubmitting}>
                        <Send size={16} className="mr-2" /> {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem Statement */}
                <div className="w-1/3 border-r border-slate-800/50 bg-[#0f172a] flex flex-col">
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className={cn(
                                "uppercase text-[10px] font-black tracking-widest px-2 py-0.5 border",
                                challenge.difficulty === 'Hard' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                                {challenge.difficulty}
                            </Badge>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-6 tracking-tight">
                            {challenge.question.split('\n')[0]}
                        </h2>
                        
                        <div className="prose prose-invert prose-sm max-w-none space-y-6">
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {challenge.question}
                            </p>

                            {challenge.testCases?.filter(tc => !tc.isHidden).slice(0, 2).map((tc, k) => (
                                <div key={k} className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Example {k + 1}</h4>
                                    <div className="space-y-2 font-mono text-sm">
                                        <p className="flex gap-2"><span className="text-slate-500">Input:</span> <span className="text-white">{tc.input}</span></p>
                                        <p className="flex gap-2"><span className="text-slate-500">Output:</span> <span className="text-emerald-400 font-bold">{tc.expectedOutput}</span></p>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-blue-500/5 rounded-2xl p-6 border border-blue-500/10">
                                <h4 className="text-xs font-black text-blue-400/80 uppercase tracking-widest mb-4">Constraints</h4>
                                <p className="text-slate-400 text-xs italic">Follow the instructions in the problem description carefully.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Code Editor & Results */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0f1e]">
                    {/* Editor Control Bar */}
                    <div className="h-12 bg-slate-900/30 border-b border-slate-800/50 flex items-center justify-between px-4 shrink-0">
                        <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                            {['Java', 'Python', 'C++', 'JavaScript', 'SQL'].map((lang) => (
                                // Only show SQL if it's a SQL question, or show others if not
                                (challenge.questionType === 'SQL' ? lang === 'SQL' : lang !== 'SQL') && (
                                    <button
                                        key={lang}
                                        onClick={() => handleLanguageChange(lang)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                            language === lang ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {lang}
                                    </button>
                                )
                            ))}
                        </div>

                        <button 
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all disabled:opacity-50"
                        >
                            <Play size={14} className="fill-emerald-500" /> {isRunning ? 'Executing...' : 'Run Code'}
                        </button>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 relative group">
                        <textarea
                            className="w-full h-full bg-[#0a0f1e] text-slate-300 p-8 font-mono text-sm resize-none focus:outline-none focus:ring-0 custom-scrollbar"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                        />
                        <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className="bg-slate-800 text-slate-500 border-slate-700">Line: 1, Col: 1</Badge>
                        </div>
                    </div>

                    {/* Console / Output Section */}
                    <div className="h-2/5 bg-[#0a0f1e] border-t border-slate-800/80 flex flex-col shadow-2xl">
                        <div className="flex border-b border-slate-800/50 bg-slate-950/20 px-4">
                            <button 
                                onClick={() => setActiveTab('console')}
                                className={cn(
                                    "px-6 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                    activeTab === 'console' ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Console Output
                            </button>
                            <button 
                                onClick={() => setActiveTab('explorer')}
                                className={cn(
                                    "px-6 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                    activeTab === 'explorer' ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Test Explorer {testResults && <span className="ml-2 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{testResults.length}</span>}
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                            {activeTab === 'console' ? (
                                <div className="font-mono text-xs text-slate-400 leading-relaxed">
                                    {output ? (
                                        <div className="space-y-4">
                                            <pre className="whitespace-pre-wrap">{output}</pre>
                                            {language === 'SQL' && testResults && testResults.length > 0 && testResults[0].columns && (
                                                <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden">
                                                    <table className="w-full text-left text-[10px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-900 border-b border-slate-800">
                                                                {testResults[0].columns.map(col => (
                                                                    <th key={col} className="px-3 py-2 font-bold text-slate-500 uppercase">{col}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {JSON.parse(testResults[0].actual).slice(0, 50).map((row, i) => (
                                                                <tr key={i} className="border-b border-slate-900/50 group hover:bg-slate-900/30">
                                                                    {row.map((cell, j) => (
                                                                        <td key={j} className="px-3 py-2 text-slate-400">{cell === null ? 'NULL' : String(cell)}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ) : (

                                        <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
                                            <AlertCircle size={32} className="mb-2" />
                                            <p>Click 'Run Code' to see console results</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {testResults ? (
                                        testResults.map((test) => (
                                            <div key={test.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                                                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
                                                    <span className="text-[10px] font-black uppercase text-slate-500">Test Case {test.id}</span>
                                                    <Badge className={cn(
                                                        "text-[10px] font-black uppercase px-2 py-0.5 border-none",
                                                        test.status === 'PASSED' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {test.status}
                                                    </Badge>
                                                </div>
                                                <div className="p-4 grid grid-cols-3 gap-4 font-mono text-xs">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-slate-600 block uppercase font-bold">Input</span>
                                                        <div className="text-slate-400 truncate">{test.input}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-slate-600 block uppercase font-bold">Expected</span>
                                                        <div className="text-slate-300">{test.expected}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-slate-600 block uppercase font-bold">Actual</span>
                                                        <div className={cn(test.status === 'PASSED' ? "text-emerald-400" : "text-red-400")}>{test.actual}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-12 opacity-30 italic text-slate-400">
                                            <Play size={48} className="mb-4" />
                                            <p>Run your code to populate test Explorer</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
