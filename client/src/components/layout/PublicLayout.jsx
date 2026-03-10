import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '../ui/Button';

export function PublicLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <NavLink to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                            <span className="text-sm">AI</span>
                        </div>
                        Placement
                    </NavLink>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
                        <a href="#companies" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Companies</a>
                        <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Testimonials</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <NavLink to="/login">
                            <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
                        </NavLink>
                        <NavLink to="/register">
                            <Button>Get Started</Button>
                        </NavLink>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children || <Outlet />}
            </main>

            <footer className="border-t border-slate-100 bg-slate-50 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 font-bold text-xl text-blue-600 mb-4 justify-center sm:justify-start">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                                    <span className="text-sm">AI</span>
                                </div>
                                Placement
                            </div>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto sm:mx-0">
                                The ultimate campus placement simulator platform helping students crack their dream companies.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-4">Platform</h3>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Aptitude Tests</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Coding Challenges</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">AI Mock Interviews</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-400 text-center">
                        &copy; {new Date().getFullYear()} AI Placement Simulator. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
