import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Upload, Trash2 } from 'lucide-react';

export default function EditCompanyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [company, setCompany] = useState({
        name: '',
        description: '',
        difficultyLevel: 'Medium',
        estimatedDuration: 120,
        numberOfRounds: 3
    });

    useEffect(() => {
        fetchCompany();
    }, [id]);

    const fetchCompany = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/company/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCompany(data);
            } else {
                alert('Failed to fetch company details');
                navigate('/admin/companies');
            }
        } catch (error) {
            console.error('Error fetching company:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${company.name}? This will also delete all associated interview blueprints and questions. This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/company/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                navigate('/admin/dashboard');
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to delete company');
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            alert('An unexpected error occurred');
        } finally {
            setDeleting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', company.name);
            formData.append('description', company.description);
            formData.append('difficultyLevel', company.difficultyLevel);
            formData.append('estimatedDuration', company.estimatedDuration);
            formData.append('numberOfRounds', company.numberOfRounds);

            const res = await fetch(`/api/admin/company/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                navigate('/admin/dashboard');
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to update company');
            }
        } catch (error) {
            console.error('Error updating company:', error);
            alert('An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Company Blueprint</h1>
                    <p className="text-slate-500">Modify {company.name}'s parameters and assessment structure.</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-6">
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Company Name</label>
                                    <Input
                                        required
                                        value={company.name}
                                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                        placeholder="Enter company name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Description</label>
                                    <textarea
                                        className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                                        value={company.description}
                                        onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                        placeholder="Describe the company and its hiring process"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold mb-1 block">Difficulty Level</label>
                                        <select
                                            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={company.difficultyLevel}
                                            onChange={(e) => setCompany({ ...company, difficultyLevel: e.target.value })}
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold mb-1 block">Number of Rounds</label>
                                        <Input
                                            type="number"
                                            value={company.numberOfRounds}
                                            onChange={(e) => setCompany({ ...company, numberOfRounds: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold mb-1 block">Estimated Duration (mins)</label>
                                        <Input
                                            type="number"
                                            value={company.estimatedDuration}
                                            onChange={(e) => setCompany({ ...company, estimatedDuration: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="w-full md:w-80 space-y-6">
                            <Card className="bg-blue-50 border-blue-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-blue-900 text-sm">Action Center</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button type="submit" className="w-full h-11 text-sm font-bold shadow-lg shadow-blue-200" isLoading={saving}>
                                        <Save className="mr-2" size={18} /> Save Changes
                                    </Button>

                                    <div className="pt-2">
                                        <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-widest text-center">Danger Zone</p>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            className="w-full h-10 text-xs font-bold border-2 border-red-50 bg-white text-red-600 hover:bg-red-50"
                                            onClick={handleDelete}
                                            isLoading={deleting}
                                        >
                                            <Trash2 className="mr-2" size={14} /> Delete Company
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
