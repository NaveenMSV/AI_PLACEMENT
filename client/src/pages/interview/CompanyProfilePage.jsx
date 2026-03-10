import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building2, Clock, PlayCircle, Trophy, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CompanyProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [attemptStatus, setAttemptStatus] = useState(null); // { status, attemptId }

    useEffect(() => {
        if (id) {
            fetchCompanyData();
        }
    }, [id]);

    const fetchCompanyData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [companyRes, roundsRes, userRes, statusRes] = await Promise.all([
                fetch(`/api/public/companies/${id}`, { headers }),
                fetch(`/api/public/companies/${id}/interview-preview`, { headers }),
                fetch(`/api/auth/profile`, { headers }),
                fetch(`/api/student/test/status/${id}`, { headers })
            ]);

            const companyData = await companyRes.json();
            const roundsData = await roundsRes.json();
            const userData = await userRes.json();
            const statusData = await statusRes.json();

            if (companyRes.ok) setCompany(companyData);
            if (roundsRes.ok) setRounds(roundsData);
            if (statusRes.ok) setAttemptStatus(statusData);

            if (userRes.ok && userData.enrolledCompanies) {
                setIsEnrolled(userData.enrolledCompanies.includes(id));
            }
        } catch (error) {
            console.error('Error fetching company profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/enroll/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setIsEnrolled(true);
            }
        } catch (error) {
            console.error('Enrollment error:', error);
        }
    };

    const handleStartTest = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/test/start/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data._id) {
                // Request full screen for proctoring
                try {
                    await document.documentElement.requestFullscreen();
                } catch (fsErr) {
                    console.warn('Fullscreen request failed:', fsErr);
                }
                // Navigate to the first round/simulation page
                navigate(`/interview/session/${data._id}`);
            } else {
                alert(data.message || 'Unable to start simulation at this time.');
            }
        } catch (error) {
            console.error('Start test error:', error);
            alert('A network error occurred. Please try again.');
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

    if (!company) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-slate-900">Company not found</h2>
                    <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-8 flex items-start gap-6">
                <div className="h-24 w-24 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <Building2 size={40} className="text-blue-500" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{company.name}</h1>
                            <p className="text-slate-600 mb-4 max-w-3xl">
                                {company.description}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {!isEnrolled ? (
                                <Button size="lg" className="w-48 shadow-md" onClick={handleEnroll}>Enroll Now</Button>
                            ) : attemptStatus?.status === 'MALPRACTICE' ? (
                                <Button size="lg" className="w-48 shadow-md border-red-100 bg-red-50 text-red-600 hover:bg-red-50 cursor-not-allowed" disabled>
                                    Blocked (Malpractice)
                                </Button>
                            ) : attemptStatus?.status === 'COMPLETED' || attemptStatus?.status === 'DISQUALIFIED' ? (
                                <Button size="lg" className="w-48 shadow-md bg-green-600 hover:bg-green-700" onClick={() => navigate(`/results/${attemptStatus.attemptId}`)}>
                                    View Results
                                </Button>
                            ) : attemptStatus?.status === 'IN_PROGRESS' && attemptStatus?.currentRound ? (
                                <Button size="lg" className="w-48 shadow-md bg-orange-600 hover:bg-orange-700" onClick={() => navigate(`/interview/session/${attemptStatus.attemptId}?round=${attemptStatus.currentRound}`)}>
                                    {attemptStatus.totalRounds === 1
                                        ? 'Continue Simulation'
                                        : `Continue Round ${attemptStatus.currentRound}`}
                                </Button>
                            ) : (
                                <Button size="lg" className="w-48 shadow-md" onClick={handleStartTest}>Start Simulation</Button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Clock size={16} /> {company.estimatedDuration} mins Total
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Trophy size={16} /> {company.numberOfRounds} Rounds
                        </div>
                        <Badge variant={company.difficultyLevel === 'Hard' ? 'danger' : company.difficultyLevel === 'Medium' ? 'warning' : 'success'}>
                            {company.difficultyLevel} Difficulty
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900">Simulation Rounds Timeline</h2>
                    <div className="space-y-4">
                        {rounds.map((round, index) => {
                            const roundNum = round.roundNumber;
                            const isCompleted = attemptStatus?.completedRounds?.includes(roundNum);
                            const isCurrent = attemptStatus?.currentRound === roundNum && attemptStatus?.status === 'IN_PROGRESS';
                            const isLocked = !isCompleted && !isCurrent;

                            return (
                                <Card key={index} className={cn(
                                    "overflow-hidden transition-all hover:shadow-md",
                                    isCompleted && "border-green-200 bg-green-50/30",
                                    isCurrent && "border-blue-300 bg-blue-50/30 ring-1 ring-blue-200",
                                    isLocked && "opacity-60"
                                )}>
                                    <div className="flex p-6">
                                        <div className="flex flex-col items-center mr-6">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md",
                                                isCompleted ? "bg-green-600 text-white" :
                                                    isCurrent ? "bg-blue-600 text-white" :
                                                        "bg-slate-300 text-white"
                                            )}>
                                                {isCompleted ? '✓' : roundNum}
                                            </div>
                                            {index < rounds.length - 1 && (
                                                <div className={cn(
                                                    "w-px h-full my-2",
                                                    isCompleted ? "bg-green-300" : "bg-slate-200"
                                                )}></div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">{round.roundType}</h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1"><Clock size={14} /> {round.duration} mins</span>
                                                    <span>•</span>
                                                    <span>Weight: {round.weight}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Badge variant={
                                                    isCompleted ? "success" : isCurrent ? "primary" : "secondary"
                                                }>
                                                    {isCompleted ? '✅ Completed' : isCurrent ? '▶ Current' : '🔒 Locked'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {rounds.length === 0 && (
                            <p className="text-slate-500 italic">No rounds configured for this company yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="bg-red-50/50 border-b border-red-100">
                            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                                <PlayCircle size={18} /> Anti-Cheat Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-sm text-slate-600">
                            <p>To simulate a real proctored environment, this simulation employs strict anti-cheat measures:</p>
                            <ul className="list-disc list-inside space-y-2 font-medium">
                                <li>Webcam recording is mandatory.</li>
                                <li>Tab switching is tracked.</li>
                                <li>Right-click and copy-paste are disabled.</li>
                            </ul>
                            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-bold mt-4 text-center">
                                Warning: 3 violations will result in auto-submission!
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
