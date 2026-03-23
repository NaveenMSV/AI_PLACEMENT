import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SearchIcon, PlusIcon, CompanyIcon, UploadIcon, SettingsIcon } from '../../components/icons';
import { Badge } from '../../components/ui/Badge';
import { SearchContext } from '../../context/SearchContext';

export default function ManageCompaniesPage() {
    const navigate = useNavigate();
    const { searchQuery } = useContext(SearchContext);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Company Form State
    const [newCompany, setNewCompany] = useState({
        name: '',
        description: '',
        difficultyLevel: 'Medium',
        estimatedDuration: 120,
        numberOfRounds: 3
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('token'); // Assuming JWT is stored here
            const res = await fetch('/api/admin/companies', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const filteredCompanies = companies.filter(company => {
        // Hide system-level practice tracks from the main management list
        const isPracticeTrack = ['Coding Practice', 'SQL Practice'].includes(company.name);
        if (isPracticeTrack) return false;

        return company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               company.description.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleAddCompany = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', newCompany.name);
            formData.append('description', newCompany.description);
            formData.append('difficultyLevel', newCompany.difficultyLevel);
            formData.append('estimatedDuration', newCompany.estimatedDuration);
            formData.append('numberOfRounds', newCompany.numberOfRounds);
            // If we had a file input for logo, we'd append it here: formData.append('logo', logoFile);

            const res = await fetch('/api/admin/company/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do not set Content-Type, browser will set it with boundary for FormData
                },
                body: formData
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                fetchCompanies();
                setNewCompany({
                    name: '',
                    description: '',
                    difficultyLevel: 'Medium',
                    estimatedDuration: 120,
                    numberOfRounds: 3
                });
            } else {
                const errorData = await res.json();
                console.error('Error response:', errorData);
                alert(errorData.message || 'Failed to add company');
            }
        } catch (error) {
            console.error('Error adding company:', error);
            alert('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Companies</h1>
                    <p className="text-slate-500">Search, add, and configure company simulation parameters.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon size={18} className="mr-2" /> Add New Company
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map((company) => (
                    <Card key={company._id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                {company.name[0].toUpperCase()}
                            </div>
                            <div>
                                <CardTitle className="text-lg">{company.name}</CardTitle>
                                <Badge variant={company.difficultyLevel === 'Hard' ? 'danger' : company.difficultyLevel === 'Medium' ? 'warning' : 'success'}>
                                    {company.difficultyLevel}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                                {company.description}
                            </p>
                            <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                                <span>{company.numberOfRounds} Rounds</span>
                                <span>~{company.estimatedDuration} mins</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 text-xs py-1 h-auto" onClick={() => navigate(`/admin/questions?companyId=${company._id}`)}>
                                    <UploadIcon size={14} className="mr-1.5" /> Questions
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-slate-500 hover:text-blue-600 px-3"
                                    onClick={() => navigate(`/admin/company/${company._id}/edit`)}
                                >
                                    <SettingsIcon size={16} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Company Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Company">
                <form onSubmit={handleAddCompany} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Company Name</label>
                        <Input
                            required
                            placeholder="e.g. Google"
                            value={newCompany.name}
                            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            className="w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Briefly describe the company..."
                            value={newCompany.description}
                            onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Difficulty</label>
                            <select
                                className="w-full rounded-md border border-slate-200 p-2 text-sm"
                                value={newCompany.difficultyLevel}
                                onChange={(e) => setNewCompany({ ...newCompany, difficultyLevel: e.target.value })}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">No. of Rounds</label>
                            <Input
                                type="number"
                                value={newCompany.numberOfRounds}
                                onChange={(e) => setNewCompany({ ...newCompany, numberOfRounds: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Save Company
                    </Button>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
