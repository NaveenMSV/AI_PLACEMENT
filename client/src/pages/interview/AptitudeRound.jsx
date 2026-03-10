import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Timer, CheckCircle } from 'lucide-react';

export default function AptitudeRound({ questions = [], onFinish, attemptId, roundNumber = 1 }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins default
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentQuestion = questions[currentIdx];

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (option) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: option
        }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/test/${attemptId}/round/${roundNumber}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    answers,
                    timeTaken: 1800 - timeLeft
                })
            });
            if (res.ok) {
                onFinish();
            }
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentQuestion) return null;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            {/* Sidebar navigation */}
            <div className="w-64 border-r border-slate-200 bg-white p-4 hidden md:block overflow-y-auto">
                <h3 className="font-semibold mb-4">Questions</h3>
                <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, i) => (
                        <button
                            key={q._id}
                            onClick={() => setCurrentIdx(i)}
                            className={`h-10 w-10 flex items-center justify-center rounded-lg text-sm font-medium border transition-all
                ${currentIdx === i ? 'bg-blue-600 border-blue-600 text-white shadow-md' :
                                    answers[q._id] ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Top bar header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-800">Aptitude & Technical MCQ</span>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <span className="text-sm text-slate-500">Question {currentIdx + 1} of {questions.length}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 font-mono font-bold px-3 py-1.5 rounded-lg border transition-colors ${timeLeft < 300 ? 'text-red-600 bg-red-50 border-red-100 animate-pulse' : 'text-orange-600 bg-orange-50 border-orange-100'}`}>
                            <Timer size={18} />
                            {formatTime(timeLeft)}
                        </div>
                        <Button variant="danger" size="sm" onClick={handleSubmit}>End Round</Button>
                    </div>
                </header>

                {/* Progress */}
                <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1 rounded-none rounded-r-full" />

                {/* Main question area */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <Card className="border-none shadow-sm ring-1 ring-slate-100">
                            <CardHeader className="pb-4">
                                <CardTitle className="leading-snug text-xl text-slate-900">
                                    {currentQuestion.question}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {currentQuestion.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(option)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center group
                      ${answers[currentQuestion._id] === option
                                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 font-bold text-sm border transition-colors
                                            ${answers[currentQuestion._id] === option ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-blue-200'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="flex-1 font-medium text-slate-700">{option}</span>
                                        {answers[currentQuestion._id] === option && <CheckCircle size={20} className="text-blue-600 ml-2" />}
                                    </button>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex justify-between items-center pt-4">
                            <Button
                                variant="outline"
                                disabled={currentIdx === 0}
                                onClick={() => setCurrentIdx(prev => prev - 1)}
                            >
                                Previous
                            </Button>
                            <div className="space-x-4">
                                {currentIdx === questions.length - 1 ? (
                                    <Button className="bg-green-600 hover:bg-green-700 font-bold px-8" onClick={handleSubmit}>
                                        Submit Test
                                    </Button>
                                ) : (
                                    <Button className="px-8" onClick={() => setCurrentIdx(prev => prev + 1)}>
                                        Save & Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
