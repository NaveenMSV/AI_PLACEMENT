import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Building2, Clock, Trophy } from 'lucide-react';

export default function CompaniesPage() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/public/companies', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCompanies(data);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c => {
        // Hide system-level practice tracks from the main discovery list
        const isPracticeTrack = ['Coding Practice', 'SQL Practice'].includes(c.name);
        if (isPracticeTrack) return false;

        return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               c.description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Discover Companies</h1>
                    <p className="text-slate-500">Find and enroll in company-specific placement simulations.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCompanies.map((company) => (
                        <Card key={company._id} className="group hover:shadow-lg transition-all border-slate-200 overflow-hidden flex flex-col">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Building2 size={24} />
                                    </div>
                                    <Badge variant={company.difficultyLevel === 'Hard' ? 'danger' : company.difficultyLevel === 'Medium' ? 'warning' : 'success'}>
                                        {company.difficultyLevel}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4">{company.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{company.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mb-6">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {company.estimatedDuration}m</span>
                                    <span className="flex items-center gap-1"><Trophy size={14} /> {company.numberOfRounds} Rounds</span>
                                </div>
                                <div className="mt-auto">
                                    <Button
                                        className="w-full font-bold"
                                        onClick={() => navigate(`/company/${company._id}`)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredCompanies.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Building2 size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">No companies found matching your search.</p>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
