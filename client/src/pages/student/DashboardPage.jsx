import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArrowRight, RefreshCw, Trophy, Target, CheckCircle, Clock, Flame, Database } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchContext } from '../../context/SearchContext';

export default function DashboardPage() {
    const navigate = useNavigate();
    const context = React.useContext(SearchContext);
    const searchQuery = context?.searchQuery || '';
    const [stats, setStats] = useState({
        rank: '--',
        interviewsGiven: 0,
        readiness: '0%',
        hoursPracticed: '0h',
        streak: 0
    });
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dailyChallenge, setDailyChallenge] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        fetchDailyChallenge();
    }, []);

    const fetchDailyChallenge = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/challenge/today?type=CODING`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDailyChallenge({ ...data.questionId, challengeType: 'CODING' });
            } else {
                // Try SQL if no coding challenge
                const sqlRes = await fetch(`/api/challenge/today?type=SQL`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (sqlRes.ok) {
                    const sqlData = await sqlRes.json();
                    setDailyChallenge({ ...sqlData.questionId, challengeType: 'SQL' });
                } else {
                    setDailyChallenge(false);
                }
            }
        } catch (e) {
            console.error('Error fetching daily challenge:', e);
            setDailyChallenge(false);
        }
    };


    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, tracksRes] = await Promise.all([
                fetch(`/api/student/dashboard/stats?t=${Date.now()}`, { headers }),
                fetch(`/api/student/dashboard/tracks?t=${Date.now()}`, { headers })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(prev => ({ ...prev, ...statsData }));
            }
            if (tracksRes.ok) {
                const tracksData = await tracksRes.json();
                setTracks(tracksData);
            }
            
            const streakRes = await fetch('/api/challenge/streak', { headers });
            if (streakRes.ok) {
                const streakData = await streakRes.json();
                setStats(prev => ({ ...prev, streak: streakData.currentStreak }));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get user name from localStorage
    let userName = 'Student';
    try {
        const stored = localStorage.getItem('user');
        if (stored) userName = JSON.parse(stored).name || 'Student';
    } catch (e) { /* ignore */ }

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            // Trigger recalculation on backend
            const res = await fetch('/api/student/dashboard/refresh', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn('Backend refresh returned non-ok status:', res.status);
            }

            // Fetch updated data (cache-busting is handled in fetchDashboardData)
            await fetchDashboardData();
        } catch (error) {
            console.error('Error refreshing results:', error);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {userName}!</h1>
                    <p className="text-slate-500">Here's your placement preparation overview for today.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-sm",
                        refreshing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    Refresh Results
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Platform Rank</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.rank}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Trophy size={24} />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-green-600 font-medium">↑ Performance based on score</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Interviews Given</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.interviewsGiven}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <Target size={24} />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-500">Completed simulations</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Overall Readiness</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.readiness}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                        <Progress value={parseInt(stats.readiness)} className="mt-4" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Hours Practiced</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.hoursPracticed}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Clock size={24} />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-500">Total time spent</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-none text-white shadow-lg shadow-orange-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-100 uppercase tracking-wider">Current Streak</p>
                                <p className="text-4xl font-black mt-1 flex items-baseline gap-1">
                                    {stats.streak} <span className="text-lg font-bold">Days</span>
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Flame size={28} className="fill-white" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-bold text-orange-100 uppercase">Keep it up! 🔥</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main feed / Upcoming */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Active Tracks</CardTitle>
                                <CardDescription>Recommended simulations for you</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tracks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((track) => (
                                        <TableRow key={track._id} className={track.status === 'MALPRACTICE' ? 'bg-red-50/30' : ''}>
                                            <TableCell className="font-semibold text-slate-700">{track.name}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        track.status === 'COMPLETED' ? "success" :
                                                            track.status === 'MALPRACTICE' ? "danger" :
                                                                track.status === 'DISQUALIFIED' ? "danger" :
                                                                    track.status === 'IN_PROGRESS' ? "warning" : "secondary"
                                                    }>
                                                    {track.status === 'COMPLETED' ? "Completed" :
                                                        track.status === 'MALPRACTICE' ? "MALPRACTICE DETECTED" :
                                                            track.status === 'DISQUALIFIED' ? "Disqualified" :
                                                                track.status === 'IN_PROGRESS' ? "In Progress" : "Not Started"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {track.status === 'MALPRACTICE' ? (
                                                    <Button size="sm" variant="ghost" disabled className="text-red-400 bg-red-50/50 cursor-not-allowed font-bold">
                                                        Blocked
                                                    </Button>
                                                ) : track.status === 'COMPLETED' || track.status === 'DISQUALIFIED' ? (
                                                    <Button size="sm" variant="outline" onClick={() => navigate(`/interviews/${track._id}`)}>
                                                        View Results
                                                    </Button>
                                                ) : track.status === 'IN_PROGRESS' ? (
                                                    <Button size="sm" onClick={() => navigate(`/interviews/${track._id}`)}>
                                                        Continue
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => navigate(`/interviews/${track._id}`)}>
                                                        Prepare
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tracks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8">
                                                <p className="text-slate-500 mb-4">No enrolled companies yet.</p>
                                                <Button size="sm" onClick={() => navigate('/companies')} className="font-bold">
                                                    Browse Companies <ArrowRight size={14} className="ml-2" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar widgets */}
                <div className="space-y-8">
                    <Card className="bg-slate-900 border-none text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/30 transition-all"></div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Target size={18} className="text-blue-400" /> {dailyChallenge?.challengeType === 'SQL' ? 'Daily SQL Challenge' : 'Daily Coding Challenge'}
                                </CardTitle>
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    +50 XP
                                </Badge>
                            </div>
                            <CardDescription className="text-slate-400">
                                {dailyChallenge?.challengeType === 'SQL' ? "Solve today's database query" : "Solve today's coding puzzle"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 min-h-[80px] flex items-center">
                                <p className="text-sm font-bold text-slate-300 line-clamp-3 italic">
                                    {dailyChallenge === null ? "Loading your daily coding puzzle..." : 
                                     dailyChallenge === false ? "No challenge available for today. Please check back later!" :
                                     `"${dailyChallenge.question.substring(0, 150)}${dailyChallenge.question.length > 150 ? '...' : ''}"`}
                                </p>
                            </div>
                             <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold py-6 rounded-2xl" 
                                onClick={() => navigate(dailyChallenge?.challengeType === 'SQL' ? '/practice/sql' : '/practice/coding')}
                            >
                                Solve Now <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </CardContent>

                    </Card>

                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Company Tracks</CardTitle>
                                <CardDescription>Your enrolled career tracks</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {tracks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((track) => (
                                <div key={track._id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn("text-xs font-bold", track.status === 'MALPRACTICE' ? "text-red-600" : "text-slate-900")}>{track.name}</span>
                                        <span className={cn("text-[10px] font-black tracking-tight",
                                            track.status === 'MALPRACTICE' ? "text-red-500/80" :
                                                (track.status === 'COMPLETED' || track.status === 'DISQUALIFIED') ? "text-green-600" : "text-slate-400"
                                        )}>
                                            {track.status === 'MALPRACTICE'
                                                ? "MALPRACTICE"
                                                : (track.status === 'COMPLETED' || track.status === 'DISQUALIFIED')
                                                    ? "Completed"
                                                    : `${track.roundsDone}/${track.totalRounds} Rounds`}
                                        </span>
                                    </div>
                                    <Progress
                                        value={track.status === 'MALPRACTICE' ? 100 : track.progress}
                                        className="h-1 rounded-full bg-slate-100"
                                        indicatorClassName={track.status === 'MALPRACTICE' ? "bg-red-400" : (track.status === 'COMPLETED' || track.status === 'DISQUALIFIED') ? "bg-green-500" : "bg-blue-500"}
                                    />
                                </div>
                            ))}
                            {tracks.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-xs text-slate-500 italic">Start your journey by enrolling in a company track.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout >
    );
}
