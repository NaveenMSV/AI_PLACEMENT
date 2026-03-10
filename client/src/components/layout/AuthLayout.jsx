import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Left side - branding & image */}
            <div className="hidden w-1/2 flex-col justify-between bg-blue-600 p-12 text-white lg:flex relative overflow-hidden">
                <div className="relative z-10">
                    <NavLink to="/" className="flex items-center gap-2 font-bold text-2xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-md">
                            <span className="text-xl">AI</span>
                        </div>
                        Placement
                    </NavLink>
                </div>

                <div className="relative z-10 max-w-md">
                    <h1 className="mb-4 text-4xl font-bold leading-tight">Master your campus placements.</h1>
                    <p className="text-blue-100 text-lg">Simulate real technical interviews, practice coding rounds, and get AI-driven feedback instantly.</p>
                </div>

                {/* Decorative background vectors */}
                <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/50 blur-3xl"></div>
                <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl"></div>
            </div>

            {/* Right side - auth form */}
            <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24 bg-white relative">
                {/* Mobile Header */}
                <div className="absolute top-8 left-8 lg:hidden">
                    <NavLink to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                            <span className="text-sm">AI</span>
                        </div>
                        Placement
                    </NavLink>
                </div>

                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
                        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
