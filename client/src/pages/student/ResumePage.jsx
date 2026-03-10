import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Upload, FileText, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ResumePage() {
    const [isUploaded, setIsUploaded] = useState(false);
    const [fileName, setFileName] = useState('');
    const [atsScore, setAtsScore] = useState(0);
    const [resumeUrl, setResumeUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchResumeData();
    }, []);

    const fetchResumeData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/resume/data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.resumePath) {
                setIsUploaded(true);
                setFileName(data.resumePath.split('/').pop());
                setAtsScore(data.atsScore || 0);
                setResumeUrl(data.resumePath);
            }
        } catch (error) {
            console.error('Error fetching resume data:', error);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }

        setError('');
        setIsUploading(true);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/resume/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setFileName(file.name);
                setIsUploaded(true);
                setAtsScore(data.atsScore);
                setResumeUrl(data.resumePath);
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError('Something went wrong during upload.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewResume = () => {
        if (resumeUrl) {
            window.open(resumeUrl, '_blank');
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">My Resume</h1>
                <p className="text-slate-500">Upload and manage your professional resume for simulations.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="p-12 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Upload New Resume</h3>
                        <p className="text-slate-500 mb-8 max-w-xs">
                            Upload your resume in PDF format (Max 5MB). This will be used during AI Interview simulations.
                        </p>
                        <input
                            type="file"
                            id="resume-upload"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="resume-upload"
                            className={cn(
                                "inline-flex items-center justify-center font-medium transition-colors rounded-lg h-10 px-4 py-2 text-sm cursor-pointer",
                                "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                isUploading && "opacity-50 pointer-events-none"
                            )}
                        >
                            {isUploading ? (
                                <>
                                    <span className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                    Uploading...
                                </>
                            ) : 'Select PDF File'}
                        </label>
                    </CardContent>
                </Card>

                {isUploaded ? (
                    <Card className="border-green-200 bg-green-50/30">
                        <CardHeader className="border-b border-green-100 flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-base truncate max-w-[150px]">{fileName}</CardTitle>
                                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={12} /> Active Resume
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white border-green-200 text-green-700 hover:bg-green-100"
                                onClick={handleViewResume}
                            >
                                <Eye size={16} className="mr-2" /> View
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm font-medium">ATS Match Score</span>
                                    <span className={`text-2xl font-black ${atsScore > 70 ? 'text-green-600' : atsScore > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                                        {atsScore}%
                                    </span>
                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-1000 ${atsScore > 70 ? 'bg-green-500' : atsScore > 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                        style={{ width: `${atsScore}%` }}
                                    />
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-green-100 text-xs text-slate-600 leading-relaxed">
                                    {atsScore > 70
                                        ? "Excellent! Your resume has a strong match with industry-standard keywords. You're well-prepared for AI screening."
                                        : atsScore > 40
                                            ? "Good start. Consider adding more specific technical skills and industry keywords to improve your score."
                                            : "Your score is low. Try to include more relevant project keywords and technical skills from our tracks."}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">
                        No resume uploaded yet. Your profile will be incomplete for interviews.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

