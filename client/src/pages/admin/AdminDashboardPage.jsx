import React, { useState, useEffect, useContext } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, Building2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchContext } from '../../context/SearchContext';

export default function AdminDashboardPage() {
    const { searchQuery } = useContext(SearchContext);
    const [stats, setStats] = useState({ totalStudents: 0, totalCompanies: 0, activeTests: 0 });
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, companiesRes] = await Promise.all([
                fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/companies', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (companiesRes.ok) setCompanies(await companiesRes.json());
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.difficultyLevel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        </DashboardLayout>
    );

    // Get user name from localStorage
    let userName = 'Admin';
    try {
        const stored = localStorage.getItem('user');
        if (stored) userName = JSON.parse(stored).name || 'Admin';
    } catch (e) { /* ignore */ }

    return (
        <DashboardLayout>
            <div className="mb-8 items-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome, {userName}!</h1>
                <p className="text-slate-500">Manage companies, students, and simulator blueprints.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card className="border-l-4 border-l-blue-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Companies</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCompanies}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Building2 size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Students</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalStudents}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                                <Users size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Simulations</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeTests}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <ExternalLink size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader className="bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl">Company Blueprints</CardTitle>
                            <CardDescription>Manage interview processes and simulation tracks</CardDescription>
                        </div>
                        <Button onClick={() => navigate('/admin/companies')} size="sm">
                            Manage Companies
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30">
                                <TableHead className="w-[300px]">Company</TableHead>
                                <TableHead>Difficulty</TableHead>
                                <TableHead>Rounds</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompanies.length > 0 ? filteredCompanies.map((company) => (
                                <TableRow key={company._id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {company.name[0].toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-900">{company.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                company.difficultyLevel === 'Hard' ? 'danger' :
                                                    company.difficultyLevel === 'Medium' ? 'warning' : 'success'
                                            }
                                        >
                                            {company.difficultyLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-600">{company.numberOfRounds} Rounds</TableCell>
                                    <TableCell className="text-slate-500">{company.estimatedDuration} mins</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => navigate(`/admin/company/${company._id}/edit`)}
                                        >
                                            Edit Blueprint
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">
                                        {searchQuery ? `No companies matching "${searchQuery}"` : "No companies found. Add your first company to start."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout >
    );
}
