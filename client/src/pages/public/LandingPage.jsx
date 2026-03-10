import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Building2, Code2, Users, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function LandingPage() {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-900 py-20 lg:py-32">
                <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] bg-cover bg-center bg-no-repeat opacity-20 blur-sm"></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl">
                        Crack your campus placements with <span className="text-blue-500">confidence.</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
                        Simulate real company interviews, master coding rounds, and get AI-powered feedback. Join thousands of students getting placed in top product companies.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <NavLink to="/register">
                            <Button size="lg" className="text-lg">Start Practicing Free</Button>
                        </NavLink>
                        <NavLink to="/companies">
                            <Button variant="outline" size="lg" className="border-slate-600 text-white hover:bg-slate-800 hover:text-white">View Companies</Button>
                        </NavLink>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to succeed</h2>
                        <p className="mt-4 text-lg text-slate-600">Comprehensive simulation tools designed to mimic actual interview rounds.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                                    <Code2 size={24} />
                                </div>
                                <CardTitle>Coding Environment</CardTitle>
                                <CardDescription className="mt-2 text-base">Practice data structures and algorithms in our browser-based IDE.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 text-green-600">
                                    <Users size={24} />
                                </div>
                                <CardTitle>AI Mock Interviews</CardTitle>
                                <CardDescription className="mt-2 text-base">Conduct verbal technical interviews with our AI assistant via webcam.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 text-orange-600">
                                    <Building2 size={24} />
                                </div>
                                <CardTitle>Company Specific Tracks</CardTitle>
                                <CardDescription className="mt-2 text-base">Take simulations tailored exactly to the target company's exam pattern.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 text-purple-600">
                                    <Trophy size={24} />
                                </div>
                                <CardTitle>Global Leaderboards</CardTitle>
                                <CardDescription className="mt-2 text-base">Compete with peers across the country and track your readiness percentile.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
