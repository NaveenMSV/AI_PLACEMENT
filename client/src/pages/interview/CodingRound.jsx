import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Play, Send, ChevronLeft, ChevronRight, CheckCircle, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CodingRound({ questions = [], onFinish, attemptId, roundNumber = 1 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('Java');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [output, setOutput] = useState('');
    const [timeLeft, setTimeLeft] = useState(1800);
    const [answers, setAnswers] = useState({}); // Stores code for each question

    const currentQuestion = questions[currentIndex];

    const boilerplates = {
        'Java': `class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}`,
        'Python': `class Solution:\n    def solve(self):\n        # Write your code here\n        pass`,
        'C++': `class Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};`,
        'JavaScript': `/**\n * @param {any} input\n * @return {any}\n */\nvar solve = function(input) {\n    // Write your code here\n};`
    };

    // Initialize timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Set initial code for current question
    useEffect(() => {
        if (currentQuestion) {
            const savedCode = answers[currentQuestion._id];
            if (savedCode) {
                setCode(savedCode);
            } else {
                setCode(boilerplates[language]);
            }
        }
    }, [currentIndex, language, currentQuestion]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleRunCode = async () => {
        if (!currentQuestion) return;
        setIsRunning(true);
        setOutput('Running test cases...');
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/student/code/run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    language, 
                    code, 
                    testCases: currentQuestion.testCases 
                })
            });
            const data = await res.json();
            setTestResults(data.results);
            setOutput(data.output || (data.results?.every(r => r.status === 'PASSED') ? 'All Test Cases Passed!' : 'Some Test Cases Failed.'));
        } catch (error) {
            setOutput('Error executing code: ' + error.message);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitAll = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        // Finalize current answer
        const finalAnswers = { ...answers, [currentQuestion._id]: code, language };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/test/${attemptId}/round/${roundNumber}/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    answers: finalAnswers,
                    timeTaken: 1800 - timeLeft
                })
            });
            if (res.ok) onFinish();
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentQuestion) return (
        <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
            No questions found for this round.
        </div>
    );

    return (
        <div className="h-screen bg-slate-900 flex flex-col text-slate-300">
            {/* Top Navbar */}
            <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-white">Coding Assessment: Q{currentIndex + 1}/{questions.length}</span>
                    <Badge variant={currentQuestion.difficulty === 'Hard' ? 'danger' : 'warning'}>{currentQuestion.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn("font-mono text-sm", timeLeft < 300 ? "text-red-400 animate-pulse" : "text-orange-400")}>
                        Time Left: {formatTime(timeLeft)}
                    </span>
                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitAll} disabled={isSubmitting}>
                        <Send size={16} className="mr-2" /> {isSubmitting ? 'Submitting...' : 'Submit All Solution'}
                    </Button>
                </div>
            </header>

            {/* Main Split Interface */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem Description */}
                <div className="w-1/3 border-r border-slate-800 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">{currentQuestion.question.split('\n')[0]}</h2>
                        <div className="space-y-4 text-sm leading-relaxed">
                            <pre className="whitespace-pre-wrap font-sans">{currentQuestion.question}</pre>

                            {currentQuestion.testCases?.filter(tc => !tc.isHidden).slice(0, 2).map((tc, i) => (
                                <div key={i} className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono">
                                    <p className="text-slate-400 mb-1 text-xs">Example {i + 1}:</p>
                                    <p className="text-slate-300">Input: <span className="text-white">{tc.input}</span></p>
                                    <p className="text-slate-300">Output: <span className="text-emerald-400">{tc.expectedOutput}</span></p>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                            <button 
                                onClick={() => { setAnswers(prev => ({ ...prev, [currentQuestion._id]: code })); setCurrentIndex(prev => Math.max(0, prev - 1)); }}
                                disabled={currentIndex === 0}
                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-white disabled:opacity-30"
                            >
                                <ChevronLeft size={16} /> Previous Question
                            </button>
                            <button 
                                onClick={() => { setAnswers(prev => ({ ...prev, [currentQuestion._id]: code })); setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1)); }}
                                disabled={currentIndex === questions.length - 1}
                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-white disabled:opacity-30"
                            >
                                Next Question <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor & Output */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-slate-800 text-sm text-white border-none rounded py-1 px-3 outline-none"
                        >
                            <option>Java</option>
                            <option>Python</option>
                            <option>C++</option>
                            <option>JavaScript</option>
                        </select>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={handleRunCode} disabled={isRunning}>
                                <Play size={14} className="mr-2" /> {isRunning ? 'Running...' : 'Run Tests'}
                            </Button>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 bg-[#0a0c10] relative">
                        <textarea
                            className="w-full h-full bg-transparent p-6 font-mono text-sm text-slate-300 focus:outline-none resize-none custom-scrollbar"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck={false}
                        />
                    </div>

                    {/* Output Terminal */}
                    <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col">
                        <div className="flex border-b border-slate-800 bg-slate-950/50">
                            <button className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-blue-400 border-b-2 border-blue-400">Execution Output</button>
                            <button className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300">Test Cases {testResults && `(${testResults.length})`}</button>
                        </div>
                        <div className="p-4 overflow-auto font-mono text-sm custom-scrollbar">
                           <pre className="whitespace-pre-wrap text-slate-400">
                               {output || "Run code to see results here..."}
                           </pre>
                           {testResults && (
                               <div className="mt-4 space-y-2">
                                   {testResults.map((res, i) => (
                                       <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                                            <span className="text-xs text-slate-500">Test Case {i + 1}</span>
                                            <Badge className={res.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                                                {res.status}
                                            </Badge>
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
