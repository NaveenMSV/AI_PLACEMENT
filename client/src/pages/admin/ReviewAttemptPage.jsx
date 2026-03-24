import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, CheckCircle, Save, User as UserIcon, BookOpen, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ReviewAttemptPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [scores, setScores] = useState({}); // map of roundAttemptId -> score

    useEffect(() => {
        fetchAttemptDetails();
    }, [attemptId]);

    const fetchAttemptDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/test-attempt/${attemptId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
                // Initialize scores state
                const initialScores = {};
                result.roundAttempts.forEach(ra => {
                    initialScores[ra._id] = ra.score || 0;
                });
                setScores(initialScores);
            }
        } catch (error) {
            console.error('Error fetching attempt details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (raId, value) => {
        setScores({ ...scores, [raId]: Number(value) });
    };

    const handleUpdateScore = async (raId) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/round-attempt/${raId}/score`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ score: scores[raId] })
            });
            if (res.ok) {
                const result = await res.json();
                setData({ ...data, attempt: result.attempt });
                alert('Score updated successfully');
            }
        } catch (error) {
            console.error('Error updating score:', error);
            alert('Failed to update score');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        </DashboardLayout>
    );

    if (!data) return (
        <DashboardLayout>
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-900">Attempt not found</h2>
                <Button className="mt-4" onClick={() => navigate('/admin/students')}>Back to Students</Button>
            </div>
        </DashboardLayout>
    );

    const { attempt, roundAttempts } = data;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                <Button 
                    variant="ghost" 
                    className="mb-6 flex items-center gap-2 text-slate-500"
                    onClick={() => navigate('/admin/students')}
                >
                    <ArrowLeft size={18} /> Back to Student Tracking
                </Button>

                {/* Header Information */}
                <Card className="mb-8 border-slate-200">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                    <UserIcon size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900">{attempt?.studentId?.name}</h1>
                                    <p className="text-slate-500 font-medium">{attempt?.studentId?.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100">
                                            {attempt?.companyId?.name} Assessment
                                        </Badge>
                                        <Badge variant="outline" className="text-slate-500">
                                            {new Date(attempt?.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end justify-center">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Performance</p>
                                    <p className="text-4xl font-black text-blue-600">{attempt?.score || 0}%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Round Analysis */}
                <div className="space-y-8">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-500" /> Round-by-Round Review
                    </h2>

                    {roundAttempts.map((round) => {
                        const isInterview = round.roundType === 'HR_INTERVIEW' || round.roundType === 'TECHNICAL_INTERVIEW';
                        
                        return (
                            <Card key={round._id} className={cn(
                                "border-slate-200 overflow-hidden",
                                isInterview ? "border-l-4 border-l-orange-500" : "border-l-4 border-l-slate-400"
                            )}>
                                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500">
                                            {round.roundNumber}
                                        </div>
                                        <span className="font-black text-slate-900 uppercase text-sm tracking-tight">
                                            {round.roundType.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Score</span>
                                                <input 
                                                    type="number"
                                                    className="w-20 px-2 py-1 border border-slate-200 rounded text-right font-bold focus:outline-none focus:border-blue-500"
                                                    value={scores[round._id]}
                                                    onChange={(e) => handleScoreChange(round._id, e.target.value)}
                                                />
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    className="h-8 px-3"
                                                    onClick={() => handleUpdateScore(round._id)}
                                                    disabled={updating}
                                                >
                                                    <Save size={14} className="mr-1" /> Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 bg-white">
                                    {isInterview ? (
                                        <div className="space-y-6">
                                            {round.questions?.map((q, idx) => {
                                                const studentAns = round.answers?.[q._id] || (typeof round.answers === 'object' ? round.answers.get?.(q._id) : null) || 'No answer submitted';
                                                
                                                return (
                                                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            Question {idx + 1}
                                                        </p>
                                                        <p className="font-bold text-slate-800 mb-6 text-lg tracking-tight">
                                                            {q.question}
                                                        </p>
                                                        
                                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative pt-10">
                                                            <div className="absolute top-0 left-6 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                                                Student Response
                                                            </div>
                                                            <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap italic">
                                                                "{studentAns}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {round.questions?.length === 0 && (
                                                <div className="text-center py-6 text-slate-400 italic">No questions found for this round.</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-8">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Auto-Score</p>
                                                    <p className="text-xl font-black text-slate-700">{round.score} Points</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correct Count</p>
                                                    <p className="text-xl font-black text-slate-700">{round.correctCount} / {round.totalQuestions}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Taken</p>
                                                    <p className="text-xl font-black text-slate-700 flex items-center gap-1.5">
                                                        <Clock size={16} className="text-slate-400" />
                                                        {Math.floor(round.timeTaken / 60)}m {round.timeTaken % 60}s
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1.5 px-3 py-1">
                                                <CheckCircle size={14} /> AUTO-GRADED
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
