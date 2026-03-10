import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Trophy, CheckCircle, Clock, BarChart2, ArrowLeft } from 'lucide-react';

export default function ResultsPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, [attemptId]);

    const fetchResult = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/results/${attemptId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
            }
        } catch (error) {
            console.error('Error fetching result:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!result) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-slate-900">Result not found</h2>
                    <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
            </DashboardLayout>
        );
    }

    const { attempt, rank } = result;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 flex items-center gap-2 text-slate-500"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </Button>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 text-center bg-gradient-to-b from-blue-50 to-white">
                    <div className="h-20 w-20 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 border-4 border-white">
                        <Trophy size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Performance Summary</h1>
                    <p className="text-slate-500 mb-8 font-medium">Simulation for {attempt?.companyId?.name || 'Company'}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Final Score</p>
                            <p className="text-3xl font-black text-blue-600">{attempt?.score || 0}%</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                            <Badge variant={attempt?.status === 'COMPLETED' ? 'success' : 'danger'} className="text-sm py-1">
                                {attempt?.status || 'UNKNOWN'}
                            </Badge>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Global Rank</p>
                            <p className="text-3xl font-black text-slate-900">{rank ? `#${rank}` : '--'}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Warnings</p>
                            <p className={`text-3xl font-black ${attempt?.warningsCount > 0 ? 'text-orange-500' : 'text-slate-900'}`}>{attempt?.warningsCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart2 size={20} className="text-blue-500" /> Round Analysis
                        </h2>
                        {attempt?.status !== 'COMPLETED' && (
                            <Button variant="outline" size="sm" onClick={fetchResult} className="gap-2">
                                <Clock size={16} /> Refresh Results
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {result?.roundAttempts && result.roundAttempts.length > 0 ? (
                            result.roundAttempts.map((round) => (
                                <Card key={round?._id || Math.random()} className="border-slate-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                {round?.roundNumber || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 uppercase text-sm tracking-tight">{round?.roundType?.replace('_', ' ') || 'Round'}</h3>
                                                <p className="text-xs text-slate-500 font-medium">{round?.timeTaken || 0} seconds taken</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-900">{round?.score || 0}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Points Earned</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card className="border-slate-200 bg-slate-50 border-dashed">
                                <CardContent className="p-10 text-center">
                                    <p className="text-slate-400 font-medium">No detailed round data recorded for this attempt.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="flex justify-center gap-4 pt-6">
                        <Button variant="outline" size="lg" className="w-48 font-bold border-slate-200" onClick={() => navigate('/companies')}>
                            Try Another Simulation
                        </Button>
                        <Button size="lg" className="w-48 font-bold" onClick={() => navigate('/dashboard')}>
                            Return Home
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
