import React, { useState, useEffect, useContext } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { Search, User, Calendar, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { SearchContext } from '../../context/SearchContext';

export default function StudentsPage() {
    const { searchQuery } = useContext(SearchContext);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedStudentId, setExpandedStudentId] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/students/tracking', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedStudentId(expandedStudentId === id ? null : id);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
            case 'IN_PROGRESS': return <Badge variant="warning">In Progress</Badge>;
            case 'MALPRACTICE': return <Badge variant="danger">MALPRACTICE</Badge>;
            case 'DISQUALIFIED': return <Badge variant="danger">Disqualified</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Tracking</h1>
                <p className="text-slate-500">Monitor student progress and assessment history.</p>
            </div>

            <div className="space-y-4">
                {filteredStudents.map((student) => (
                    <Card key={student._id} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader
                            className="bg-white hover:bg-slate-50 cursor-pointer py-4 transition-colors"
                            onClick={() => toggleExpand(student._id)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{student.name}</CardTitle>
                                        <p className="text-xs text-slate-500">{student.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Joined On</p>
                                    <p className="text-sm font-medium text-slate-700">{new Date(student.joinedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardHeader>

                        {expandedStudentId === student._id && (
                            <CardContent className="p-0 border-t border-slate-100">
                                <div className="grid md:grid-cols-4 gap-0 divide-x divide-slate-100">
                                    <div className="p-6 md:col-span-1 bg-slate-50/30">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Enrolled Tracks</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {student.enrolledCompanies.length > 0 ? student.enrolledCompanies.map(c => (
                                                <Badge key={c._id} variant="secondary" className="bg-slate-100 text-slate-600">
                                                    {c.name}
                                                </Badge>
                                            )) : <span className="text-sm text-slate-400 italic">No enrollments</span>}
                                        </div>
                                    </div>
                                    <div className="p-0 md:col-span-3">
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            <Table>
                                                <TableHeader className="bg-slate-50/30 sticky top-0 z-10">
                                                    <TableRow>
                                                        <TableHead className="text-[10px] uppercase font-bold h-10">Company</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-bold h-10">Date</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-bold h-10">Status</TableHead>
                                                        <TableHead className="text-[10px] uppercase font-bold h-10 text-right">Score</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {student.testHistory.length > 0 ? student.testHistory.map((test, i) => (
                                                        <TableRow key={i} className="hover:bg-slate-50/50 border-b last:border-0 border-slate-50">
                                                            <TableCell className="font-semibold text-slate-700 py-3">{test.company || 'N/A'}</TableCell>
                                                            <TableCell className="text-xs text-slate-500 py-3">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(test.date).toLocaleDateString()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                <div className="flex items-center gap-3">
                                                                    {getStatusBadge(test.status)}
                                                                    {test.status === 'COMPLETED' && (
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                            onClick={() => navigate(`/admin/review-attempt/${test.id}`)}
                                                                        >
                                                                            Review Assessment
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-3">
                                                                <span className={cn(
                                                                    "font-bold text-sm",
                                                                    test.score >= 70 ? "text-green-600" :
                                                                        test.score >= 40 ? "text-orange-600" : "text-slate-900"
                                                                )}>
                                                                    {test.score}%
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center py-6 text-slate-400 italic text-sm">
                                                                No test history available
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}

                {filteredStudents.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <Search size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No students found</h3>
                        <p className="text-slate-400 text-sm">Try adjusting your search criteria</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

