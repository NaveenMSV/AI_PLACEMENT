import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UploadIcon, SqlIcon, ArrowLeftIcon, SuccessIcon, ErrorIcon, PlusIcon } from '../../components/icons';
import { Sparkles, Database, FileText, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';


const ROUND_TYPES = ['CODING', 'SQL', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'APTITUDE'];
const QUESTION_TYPES = ['CODING', 'SQL', 'MCQ', 'SHORT_ANSWER'];


export default function ManageQuestionsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const companyId = searchParams.get('companyId');
    const [company, setCompany] = useState(null);

    // Per-round state: array of { file, isUploading, uploadStatus, roundType }
    const [roundUploads, setRoundUploads] = useState([]);
    const [existingQuestions, setExistingQuestions] = useState([]);
    const [activeChallengeIds, setActiveChallengeIds] = useState({ CODING: null, SQL: null });

    // Manual Entry State (for Coding Practice)
    const [isManualMode, setIsManualMode] = useState(searchParams.get('mode') === 'manual');
    const [setAsTodayChallenge, setSetAsTodayChallenge] = useState(false);
    const [manualQuestion, setManualQuestion] = useState({
        questionType: 'CODING',
        difficulty: 'Easy',
        title: '',
        question: '',
        roundType: 'CODING',
        testCases: [{ input: '', expectedOutput: '', isHidden: false }],
        sqlTables: [{ tableName: '', schema: '', data: '' }], // Added for SQL
        boilerplates: {
            'JavaScript': '',
            'Python': '',
            'Java': '',
            'C++': ''
        }
    });

    useEffect(() => {
        if (companyId) {
            fetchCompanyDetails();
            fetchExistingQuestions();
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
            if (found && roundUploads.length === 0) {
                const numRounds = found.numberOfRounds || 1;
                
                // Fetch blueprint to get correct round types
                let blueprints = [];
                try {
                    const blueprintRes = await fetch(`/api/admin/company/${companyId}/interview-blueprint`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (blueprintRes.ok) {
                        const bData = await blueprintRes.json();
                        blueprints = bData.rounds || [];
                    }
                } catch (e) {
                    console.error('Error fetching blueprint:', e);
                }

                const uploads = [];
                for (let i = 0; i < numRounds; i++) {
                    const blueprintRound = blueprints.find(r => r.roundNumber === i + 1);
                    const rType = blueprintRound ? blueprintRound.roundType : 'CODING';
                    
                    uploads.push({
                        file: null,
                        isUploading: false,
                        uploadStatus: null,
                        setAsDailyChallenge: false,
                        roundType: rType,
                        tableFile: null,
                        questionsFile: null
                    });
                }
                setRoundUploads(uploads);
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const fetchExistingQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/company/${companyId}/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setExistingQuestions(data);

            // Also fetch current daily challenges to show "ACTIVE" badge
            const token2 = localStorage.getItem('token');
            const codingRes = await fetch('/api/challenge/today?type=CODING', { headers: { 'Authorization': `Bearer ${token2}` } });
            const sqlRes = await fetch('/api/challenge/today?type=SQL', { headers: { 'Authorization': `Bearer ${token2}` } });
            
            const active = { CODING: null, SQL: null };
            if (codingRes.ok) {
                const cData = await codingRes.json();
                active.CODING = cData.questionId?._id || cData.questionId;
            }
            if (sqlRes.ok) {
                const sData = await sqlRes.json();
                active.SQL = sData.questionId?._id || sData.questionId;
            }
            setActiveChallengeIds(active);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const handleRoundTypeChange = (roundIndex, value) => {
        const newUploads = [...roundUploads];
        newUploads[roundIndex] = {
            ...newUploads[roundIndex],
            roundType: value,
            file: null,
            tablesFiles: [null],
            questionsFile: null,
            uploadStatus: null
        };
        setRoundUploads(newUploads);
    };

    const handleFileChange = (roundIndex, e, type = 'file') => {
        const file = e.target.files[0];
        if (!file) return;

        const newUploads = [...roundUploads];
        if (type === 'tableFile') {
            newUploads[roundIndex].tableFile = file;
        } else if (type === 'questionsFile') {
            newUploads[roundIndex].questionsFile = file;
        } else {
            newUploads[roundIndex].file = file;
        }
        setRoundUploads(newUploads);
    };

    const handleSplitUpload = async (roundIndex) => {
        const round = roundUploads[roundIndex];
        if (!round.tableFile || !round.questionsFile || !companyId) return;

        const newUploads = [...roundUploads];
        newUploads[roundIndex] = { ...newUploads[roundIndex], isUploading: true };
        setRoundUploads(newUploads);

        const formData = new FormData();
        formData.append('tables', round.tableFile); // Backend still takes 'tables' array (single element here)
        formData.append('questions', round.questionsFile);
        formData.append('companyId', companyId);
        formData.append('roundNumber', roundIndex + 1);
        if (round.setAsDailyChallenge) {
            formData.append('setAsDailyChallenge', 'true');
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/questions/upload-split-sql', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            const updated = [...roundUploads];
            if (res.ok) {
                updated[roundIndex] = {
                    ...updated[roundIndex],
                    isUploading: false,
                    uploadStatus: { success: true, message: data.message },
                    tableFile: null,
                    questionsFile: null
                };
                fetchExistingQuestions();
            } else {
                updated[roundIndex] = {
                    ...updated[roundIndex],
                    isUploading: false,
                    uploadStatus: { success: false, message: data.message || 'Upload failed' }
                };
            }
            setRoundUploads(updated);
        } catch (error) {
            console.error('Split upload error:', error);
            const updated = [...roundUploads];
            updated[roundIndex] = { ...updated[roundIndex], isUploading: false, uploadStatus: { success: false, message: 'Network error' } };
            setRoundUploads(updated);
        }
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
        if (round.setAsDailyChallenge) {
            formData.append('setAsDailyChallenge', 'true');
        }

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
                    uploadStatus: { success: true, message: data?.message || `Successfully seeded questions` },
                    file: null
                };
                fetchExistingQuestions();
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
                uploadStatus: { success: false, message: 'Network error' }
            };
            setRoundUploads(updated);
        }
    };

    const downloadTemplate = () => {
        const token = localStorage.getItem('token');
        window.open(`/api/admin/questions/template?token=${token}`, '_blank');
    };

    const handleManualChange = (e) => {
        const { name, value } = e.target;
        setManualQuestion(prev => ({ ...prev, [name]: value }));
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...manualQuestion.testCases];
        newTestCases[index][field] = value;
        setManualQuestion(prev => ({ ...prev, testCases: newTestCases }));
    };

    const addTestCase = () => {
        setManualQuestion(prev => ({
            ...prev,
            testCases: [...prev.testCases, { input: '', expectedOutput: '', isHidden: false }]
        }));
    };

    const removeTestCase = (index) => {
        const newTestCases = manualQuestion.testCases.filter((_, i) => i !== index);
        setManualQuestion(prev => ({ ...prev, testCases: newTestCases }));
    };

    const addSqlTable = () => {
        setManualQuestion(prev => ({
            ...prev,
            sqlTables: [...prev.sqlTables, { tableName: '', schema: '', data: '' }]
        }));
    };

    const removeSqlTable = (index) => {
        const newTables = manualQuestion.sqlTables.filter((_, i) => i !== index);
        setManualQuestion(prev => ({ ...prev, sqlTables: newTables }));
    };

    const handleSqlTableChange = (index, field, value) => {
        const newTables = [...manualQuestion.sqlTables];
        newTables[index][field] = value;
        setManualQuestion(prev => ({ ...prev, sqlTables: newTables }));
    };

    const saveManualQuestion = async () => {
        if (!manualQuestion.question.trim()) return alert('Please enter a question');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found. Please log in again.');

            const isSql = manualQuestion.questionType === 'SQL';
            let finalTestCases = manualQuestion.testCases;

            if (isSql) {
                const combinedSchema = manualQuestion.sqlTables
                    .map(t => `-- Table: ${t.tableName}\n${t.schema}\n${t.data}`.trim())
                    .filter(Boolean)
                    .join('\n\n');
                
                finalTestCases = [{
                    input: combinedSchema,
                    expectedOutput: manualQuestion.correctAnswer || '',
                    isHidden: false
                }];
            }

            const res = await fetch('/api/admin/question/create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    ...manualQuestion, 
                    question: `${manualQuestion.title}\n\n${manualQuestion.question}`.trim(),
                    roundType: manualQuestion.questionType,
                    companyId,
                    testCases: finalTestCases
                })
            });

            if (res.ok) {
                const savedData = await res.json();
                
                // If set as today's challenge is checked
                if (setAsTodayChallenge && savedData?._id) {
                    await handleSetDailyChallenge(savedData._id, manualQuestion.questionType);
                }

                alert('Question saved successfully!');
                setManualQuestion({
                    questionType: 'CODING',
                    difficulty: 'Easy',
                    title: '',
                    question: '',
                    roundType: 'CODING',
                    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
                    sqlTables: [{ tableName: '', schema: '', data: '' }], 
                    boilerplates: {
                        'JavaScript': '',
                        'Python': '',
                        'Java': '',
                        'C++': ''
                    }
                });
                setSetAsTodayChallenge(false);
                fetchExistingQuestions();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to save question');
            }
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Error saving question');
        }
    };

    const handleSetDailyChallenge = async (qId, forceType = null) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/challenge/admin/set', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    questionId: qId,
                    type: forceType || (company?.name?.toUpperCase().includes('SQL') ? 'SQL' : 'CODING')
                })
            });
            if (res.ok) {
                alert('Success: This question is now set as the active daily challenge for all students!');
                fetchExistingQuestions(); // Refresh to show "ACTIVE" badge
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to set daily challenge');
            }
        } catch (error) {
            alert('Error setting daily challenge');
        }
    };

    const deleteExistingQuestion = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/question/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchExistingQuestions();
            }
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };


    if (!companyId) {
        return (
            <DashboardLayout title="Error">
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
        <DashboardLayout title="Bulk Question Upload">
            <div className="mb-8 p-6">
                <button
                    onClick={() => navigate('/admin/companies')}
                    className="flex items-center text-sm text-slate-600 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeftIcon size={16} className="mr-1" /> Back to Companies
                </button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                        Bulk Question Upload
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Uploading questions for <span className="font-semibold text-slate-700">{company?.name || 'google'}</span> ({company?.numberOfRounds || 1} Round)
                    </p>
                </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-12 px-6 pb-20">
                <div className="lg:col-span-8 space-y-12">
                    {/* Toggle for Coding Practice */}
                    {company?.name?.toLowerCase() === 'coding practice' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            <button 
                                onClick={() => setIsManualMode(false)}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                    !isManualMode ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Bulk Upload
                            </button>
                            <button 
                                onClick={() => setIsManualMode(true)}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                    isManualMode ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Manual Entry
                            </button>
                        </div>
                    )}

                    {!isManualMode ? (
                        roundUploads.map((round, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 mt-1">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">. Round {idx + 1}</h2>
                                            <p className="text-slate-400 text-sm mt-1">Upload CSV for this round</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select 
                                            value={round.roundType}
                                            onChange={(e) => handleRoundTypeChange(idx, e.target.value)}
                                            className="bg-transparent border-none text-slate-800 text-sm font-bold focus:ring-0 focus:outline-none cursor-pointer uppercase tracking-wider"
                                        >
                                            {ROUND_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {round.roundType === 'SQL' ? (
                                    <div className="space-y-6 mb-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Table CSV Slot */}
                                            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:border-blue-200 transition-colors group relative">
                                                <input
                                                    type="file"
                                                    id={`tables-upload-${idx}`}
                                                    className="hidden"
                                                    accept=".csv"
                                                    onChange={(e) => handleFileChange(idx, e, 'tableFile')}
                                                />
                                                <label htmlFor={`tables-upload-${idx}`} className="cursor-pointer">
                                                    <div className="flex flex-col items-center">
                                                        <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3">
                                                            <Database size={18} />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                                                            {round.tableFile ? round.tableFile.name : "Select Table CSV"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">File name will be table name</p>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Questions CSV Slot */}
                                            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:border-green-200 transition-colors group relative">
                                                <input
                                                    type="file"
                                                    id={`questions-upload-${idx}`}
                                                    className="hidden"
                                                    accept=".csv"
                                                    onChange={(e) => handleFileChange(idx, e, 'questionsFile')}
                                                />
                                                <label htmlFor={`questions-upload-${idx}`} className="cursor-pointer">
                                                    <div className="flex flex-col items-center">
                                                        <div className="h-10 w-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-3">
                                                            <FileText size={18} />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                                                            {round.questionsFile ? round.questionsFile.name : "Select Questions CSV"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">Contains queries & results</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-100 rounded-2xl p-20 text-center hover:border-blue-200 transition-colors group mb-10">
                                        <input
                                            type="file"
                                            id={`csv-upload-${idx}`}
                                            className="hidden"
                                            accept=".csv"
                                            onChange={(e) => handleFileChange(idx, e)}
                                        />
                                        <label htmlFor={`csv-upload-${idx}`} className="cursor-pointer">
                                            <div className="flex flex-col items-center">
                                                <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                                                    <UploadIcon size={28} />
                                                </div>
                                                <p className="text-lg font-bold text-slate-700 mb-1">
                                                    {round.file ? round.file.name : "Click to select CSV file"}
                                                </p>
                                                <p className="text-slate-400 text-xs">Max 5MB • CSV format</p>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <div className="min-h-[24px]">
                                        {round.uploadStatus && round.uploadStatus.success && (
                                            <div className="flex items-center gap-2 text-[#2c7a7b] font-semibold text-sm">
                                                <SuccessIcon size={18} className="text-[#38b2ac]" />
                                                {round.uploadStatus.message}
                                            </div>
                                        )}
                                        {round.uploadStatus && !round.uploadStatus.success && (
                                            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                                                <ErrorIcon size={18} />
                                                {round.uploadStatus.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-4 bg-white/50 p-3 rounded-xl border border-slate-100 w-fit">
                                        <input 
                                            type="checkbox" 
                                            id={`set-daily-${idx}`}
                                            checked={round.setAsDailyChallenge || false}
                                            onChange={(e) => {
                                                const updated = [...roundUploads];
                                                updated[idx] = { ...updated[idx], setAsDailyChallenge: e.target.checked };
                                                setRoundUploads(updated);
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`set-daily-${idx}`} className="text-xs font-bold text-slate-600 cursor-pointer">
                                            Set first question as Today's {round.roundType === 'SQL' ? 'SQL' : 'Coding'} Challenge
                                        </label>
                                    </div>
                                    <Button 
                                        onClick={() => round.roundType === 'SQL' ? handleSplitUpload(idx) : handleUpload(idx)}
                                        disabled={round.roundType === 'SQL' ? (!round.tableFile || !round.questionsFile || round.isUploading) : (!round.file || round.isUploading)}
                                        isLoading={round.isUploading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-xl font-bold text-sm shadow-md uppercase tracking-wide"
                                    >
                                        Upload {round.roundType === 'SQL' ? 'SQL Set' : `Round ${idx + 1}`}
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                                <PlusIcon size={24} className="text-blue-600" /> Manual Question Entry
                            </h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Question Title</label>
                                        <input 
                                            name="title"
                                            value={manualQuestion.title}
                                            onChange={handleManualChange}
                                            placeholder="e.g. Two Sum"
                                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Difficulty</label>
                                        <select 
                                            name="difficulty"
                                            value={manualQuestion.difficulty}
                                            onChange={handleManualChange}
                                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 font-bold text-slate-800"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Question Type</label>
                                    <select 
                                        name="questionType"
                                        value={manualQuestion.questionType}
                                        onChange={handleManualChange}
                                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 font-bold text-slate-800"
                                    >
                                        {QUESTION_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Question Description</label>
                                    <textarea 
                                        name="question"
                                        value={manualQuestion.question}
                                        onChange={handleManualChange}
                                        placeholder="Enter the problem statement here..."
                                        rows={6}
                                        className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-100 resize-none"
                                    />
                                </div>

                                {manualQuestion.questionType !== 'SHORT_ANSWER' && (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                {manualQuestion.questionType === 'SQL' ? 'Database Tables' : 'Test Cases'}
                                            </label>
                                            <button 
                                                onClick={manualQuestion.questionType === 'SQL' ? addSqlTable : addTestCase} 
                                                className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"
                                            >
                                                <PlusIcon size={14} /> Add {manualQuestion.questionType === 'SQL' ? 'Table' : 'Test Case'}
                                            </button>
                                        </div>

                                        {manualQuestion.questionType === 'SQL' ? (
                                            <div className="space-y-6">
                                                {manualQuestion.sqlTables.map((table, i) => (
                                                    <div key={i} className="p-6 bg-slate-50 rounded-2xl relative border border-slate-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h5 className="text-[10px] font-bold text-slate-400 uppercase">Table #{i+1}</h5>
                                                            {manualQuestion.sqlTables.length > 1 && (
                                                                <button onClick={() => removeSqlTable(i)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase transition-colors">
                                                                    Remove Table
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Table Name</label>
                                                                <input 
                                                                    placeholder="e.g. Users"
                                                                    value={table.tableName}
                                                                    onChange={(e) => handleSqlTableChange(i, 'tableName', e.target.value)}
                                                                    className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-blue-100"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Schema (CREATE TABLE)</label>
                                                                    <textarea 
                                                                        placeholder="CREATE TABLE Users (id INT, name TEXT);"
                                                                        value={table.schema}
                                                                        onChange={(e) => handleSqlTableChange(i, 'schema', e.target.value)}
                                                                        className="w-full bg-white border-none rounded-xl p-3 text-[10px] font-mono focus:ring-1 focus:ring-blue-100 h-24"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sample Data (INSERT INTO)</label>
                                                                    <textarea 
                                                                        placeholder="INSERT INTO Users VALUES (1, 'John');"
                                                                        value={table.data}
                                                                        onChange={(e) => handleSqlTableChange(i, 'data', e.target.value)}
                                                                        className="w-full bg-white border-none rounded-xl p-3 text-[10px] font-mono focus:ring-1 focus:ring-blue-100 h-24"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                                    <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                                                        <strong>Pro Tip:</strong> All tables defined above will be automatically created in a temporary SQLite database during evaluation. The query results will be compared against your <strong>Correct Query</strong> results.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {manualQuestion.testCases.map((tc, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-xl relative group">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Input</label>
                                                                <input 
                                                                    value={tc.input}
                                                                    onChange={(e) => handleTestCaseChange(i, 'input', e.target.value)}
                                                                    className="w-full bg-white border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-100"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Output</label>
                                                                <input 
                                                                    value={tc.expectedOutput}
                                                                    onChange={(e) => handleTestCaseChange(i, 'expectedOutput', e.target.value)}
                                                                    className="w-full bg-white border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-100"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-between">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={tc.isHidden}
                                                                    onChange={(e) => handleTestCaseChange(i, 'isHidden', e.target.checked)}
                                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Hidden Test Case</span>
                                                            </label>
                                                            {manualQuestion.testCases.length > 1 && (
                                                                <button onClick={() => removeTestCase(i)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase">
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Code Boilerplates (LeetCode Style)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {['JavaScript', 'Python', 'Java', 'C++'].map(lang => (
                                                    <div key={lang}>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">{lang} Template</label>
                                                        <textarea 
                                                            value={manualQuestion.boilerplates[lang] || ''}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setManualQuestion(prev => ({
                                                                    ...prev,
                                                                    boilerplates: {
                                                                        ...prev.boilerplates,
                                                                        [lang]: newVal
                                                                    }
                                                                }));
                                                            }}
                                                            placeholder={`Enter ${lang} starter code...`}
                                                            rows={5}
                                                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-[11px] font-mono focus:ring-1 focus:ring-blue-100 resize-none h-40"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            id="setDaily"
                                            checked={setAsTodayChallenge}
                                            onChange={(e) => setSetAsTodayChallenge(e.target.checked)}
                                            className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <label htmlFor="setDaily" className="block text-sm font-bold text-slate-700 cursor-pointer">
                                                Set as Today's {manualQuestion.questionType === 'SQL' ? 'SQL' : 'Daily Coding'} Challenge
                                            </label>
                                            <p className="text-[10px] text-slate-400 font-medium">Student's {manualQuestion.questionType === 'SQL' ? 'SQL' : 'coding'} practice track will be updated immediately</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={saveManualQuestion}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-xl font-bold text-sm shadow-md"
                                    >
                                        Save Manual Question
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="mt-20">
                        <h3 className="text-2xl font-bold text-slate-800 mb-8 border-b pb-4">Uploaded Questions</h3>
                        {existingQuestions.length > 0 ? (
                            <div className="grid gap-6">
                                {existingQuestions.map((q, i) => (
                                    <div key={q._id || i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                {q.questionType === 'SQL' ? <SqlIcon size={20} /> : <div className="text-xs font-bold">Q{i+1}</div>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700 leading-tight mb-1 truncate max-w-sm">{q.question}</h4>
                                                <div className="flex gap-2 items-center">
                                                    <Badge className="bg-slate-100 text-slate-500 text-[9px] px-2 py-0">{q.difficulty}</Badge>
                                                    <Badge className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0">{q.roundType}</Badge>
                                                    {(activeChallengeIds.CODING === q._id || activeChallengeIds.SQL === q._id) && (
                                                        <Badge className="bg-green-100 text-green-600 border-green-200 text-[9px] px-2 py-0 font-bold animate-pulse">
                                                            CURRENT CHALLENGE
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {(company?.name?.toLowerCase().includes('practice')) && (
                                                <Button 
                                                    onClick={() => handleSetDailyChallenge(q._id, q.questionType)}
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold h-8 px-4"
                                                >
                                                    Set as Today's Challenge
                                                </Button>
                                            )}
                                            <Button 
                                                variant="outline"
                                                onClick={() => deleteExistingQuestion(q._id)}
                                                className="border-slate-100 text-red-400 hover:bg-red-50 hover:text-red-600 font-bold text-[10px] h-8"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl p-10 text-center border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">No questions uploaded for this company yet.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-20">
                        <h3 className="text-2xl font-bold text-slate-800 mb-8">Format Guidelines</h3>
                        <div className="grid md:grid-cols-2 gap-12 text-sm text-slate-500 leading-relaxed">
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 uppercase tracking-wider text-xs">MCQ Question Format</h4>
                                <p>Ensure columns for difficulty, question, options, and correctAnswer match the provided template precisely.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 uppercase tracking-wider text-xs">Coding/SQL Format</h4>
                                <p>Include sample test cases and hidden test cases. For SQL, provide schema creation statements in the input column.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="bg-[#1e4ed8] text-white border-none shadow-2xl rounded-3xl overflow-hidden p-8">
                        <h3 className="text-lg font-bold mb-6">Supported Rounds</h3>
                        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                            {['Aptitude', 'Technical', 'HR Interview', 'Coding', 'SQL', 'AI Video'].map(r => (
                                <span key={r} className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    {r}
                                </span>
                            ))}
                        </div>
                        <p className="text-blue-100/70 text-[11px] mt-8 leading-relaxed font-medium">
                            Upload one CSV per round. Each upload corresponds to a specific round configured for the company.
                        </p>
                    </Card>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
                        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Upload Progress</h3>
                        <div className="space-y-6">
                            {roundUploads.map((r, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Round {i + 1}</span>
                                    {r.uploadStatus?.success ? (
                                        <Badge className="bg-[#e6fffa] text-[#2c7a7b] border-none font-bold text-[10px] px-3">
                                            <SuccessIcon size={12} className="mr-1 inline" /> Uploaded
                                        </Badge>
                                    ) : (
                                        <span className="h-2 w-2 rounded-full bg-slate-100"></span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );

}

