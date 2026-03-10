import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UploadIcon, SqlIcon, ArrowLeftIcon, SuccessIcon, ErrorIcon } from '../../components/icons';

const ROUND_TYPES = ['APTITUDE', 'CODING', 'SQL', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'AI_INTERVIEW'];

export default function ManageQuestionsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const companyId = searchParams.get('companyId');
    const [company, setCompany] = useState(null);

    // Per-round state: array of { file, isUploading, uploadStatus, roundType }
    const [roundUploads, setRoundUploads] = useState([]);

    useEffect(() => {
        if (companyId) {
            fetchCompanyDetails();
        }
    }, [companyId]);

    const fetchCompanyDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/companies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const found = data.find(c => c._id === companyId);
            setCompany(found);

            // Initialize per-round upload state
            if (found) {
                const numRounds = found.numberOfRounds || 1;
                const uploads = [];
                for (let i = 0; i < numRounds; i++) {
                    uploads.push({
                        file: null,
                        isUploading: false,
                        uploadStatus: null,
                        roundType: ROUND_TYPES[i % ROUND_TYPES.length] // Default suggestion
                    });
                }
                setRoundUploads(uploads);
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const handleFileChange = (roundIndex, e) => {
        const newUploads = [...roundUploads];
        newUploads[roundIndex] = { ...newUploads[roundIndex], file: e.target.files[0], uploadStatus: null };
        setRoundUploads(newUploads);
    };

    const handleRoundTypeChange = (roundIndex, value) => {
        const newUploads = [...roundUploads];
        newUploads[roundIndex] = { ...newUploads[roundIndex], roundType: value };
        setRoundUploads(newUploads);
    };

    const handleUpload = async (roundIndex) => {
        const round = roundUploads[roundIndex];
        if (!round.file || !companyId) return;

        const newUploads = [...roundUploads];
        newUploads[roundIndex] = { ...newUploads[roundIndex], isUploading: true };
        setRoundUploads(newUploads);

        const formData = new FormData();
        formData.append('file', round.file);
        formData.append('companyId', companyId);
        formData.append('roundNumber', roundIndex + 1);
        formData.append('roundType', round.roundType);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/questions/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            }

            const updated = [...roundUploads];
            if (res.ok) {
                updated[roundIndex] = {
                    ...updated[roundIndex],
                    isUploading: false,
                    uploadStatus: { success: true, message: data?.message || `Round ${roundIndex + 1} seeded successfully!` },
                    file: null
                };
            } else {
                updated[roundIndex] = {
                    ...updated[roundIndex],
                    isUploading: false,
                    uploadStatus: { success: false, message: data?.message || `Upload failed: ${res.statusText}` }
                };
            }
            setRoundUploads(updated);
        } catch (error) {
            console.error('Upload catch error:', error);
            const updated = [...roundUploads];
            updated[roundIndex] = {
                ...updated[roundIndex],
                isUploading: false,
                uploadStatus: { success: false, message: 'Network error or invalid server response' }
            };
            setRoundUploads(updated);
        }
    };

    const downloadTemplate = () => {
        const token = localStorage.getItem('token');
        window.open(`/api/admin/questions/template?token=${token}`, '_blank');
    };

    if (!companyId) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <p className="text-slate-500 mb-4">No company selected. Please select a company from the Manage Companies page.</p>
                    <Button onClick={() => navigate('/admin/companies')}>
                        Go to Companies
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors"
                >
                    <ArrowLeftIcon size={16} className="mr-1" /> Back to Companies
                </button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Bulk Question Upload
                        </h1>
                        <p className="text-slate-500">
                            Uploading questions for <span className="font-semibold text-slate-900">{company?.name || 'Loading...'}</span>
                            {company && <span className="ml-2 text-blue-600 font-medium">({company.numberOfRounds} {company.numberOfRounds === 1 ? 'Round' : 'Rounds'})</span>}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Per-round upload cards */}
                    {roundUploads.map((round, index) => (
                        <Card key={index} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Round {index + 1}</CardTitle>
                                            <CardDescription className="text-xs">Upload CSV for this round</CardDescription>
                                        </div>
                                    </div>
                                    <select
                                        value={round.roundType}
                                        onChange={(e) => handleRoundTypeChange(index, e.target.value)}
                                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {ROUND_TYPES.map(type => (
                                            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                                    <input
                                        type="file"
                                        id={`csv-upload-${index}`}
                                        className="hidden"
                                        accept=".csv"
                                        onChange={(e) => handleFileChange(index, e)}
                                    />
                                    <label htmlFor={`csv-upload-${index}`} className="cursor-pointer">
                                        <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <UploadIcon size={20} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">
                                            {round.file ? round.file.name : "Click to select CSV file"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">Max 5MB • CSV format</p>
                                    </label>
                                </div>

                                {round.uploadStatus && (
                                    <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${round.uploadStatus.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                        {round.uploadStatus.success ? <SuccessIcon size={18} className="mt-0.5 flex-shrink-0" /> : <ErrorIcon size={18} className="mt-0.5 flex-shrink-0" />}
                                        <p>{round.uploadStatus.message}</p>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <Button
                                        size="sm"
                                        disabled={!round.file || round.isUploading}
                                        isLoading={round.isUploading}
                                        onClick={() => handleUpload(index)}
                                    >
                                        <SqlIcon size={16} className="mr-1.5" />
                                        Upload Round {index + 1}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Format Guidelines */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Format Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate text-sm max-w-none">
                                <p>Ensure your CSV follows these column requirements:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>roundType:</strong> APTITUDE, CODING, SQL, TECHNICAL_INTERVIEW, HR_INTERVIEW, AI_INTERVIEW</li>
                                    <li><strong>questionType:</strong> MCQ, CODING, SQL</li>
                                    <li><strong>question:</strong> The text content of the question</li>
                                    <li><strong>options:</strong> Pipe separated for MCQ (e.g. Option A|Option B|Option C)</li>
                                    <li><strong>correctAnswer:</strong> Correct option or solution string</li>
                                    <li><strong>difficulty:</strong> Easy, Medium, Hard</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-blue-600 text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-white">Supported Rounds</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2 flex-wrap">
                                <Badge className="bg-blue-500 text-white border-blue-400">Aptitude</Badge>
                                <Badge className="bg-blue-500 text-white border-blue-400">Technical</Badge>
                                <Badge className="bg-blue-500 text-white border-blue-400">HR Interview</Badge>
                                <Badge className="bg-blue-500 text-white border-blue-400">Coding</Badge>
                                <Badge className="bg-blue-500 text-white border-blue-400">SQL</Badge>
                                <Badge className="bg-blue-500 text-white border-blue-400">AI Video</Badge>
                            </div>
                            <p className="text-xs text-blue-100 mt-4 leading-relaxed">
                                Upload one CSV per round. Each upload area corresponds to a specific round configured for this company.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Upload Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {roundUploads.map((round, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Round {index + 1}</span>
                                    <Badge variant={round.uploadStatus?.success ? "success" : "secondary"} className="text-xs">
                                        {round.uploadStatus?.success ? '✅ Uploaded' : '⏳ Pending'}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
