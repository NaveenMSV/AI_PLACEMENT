import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    DashboardIcon,
    CompanyIcon,
    InterviewIcon,
    LogoutIcon,
    ResumeIcon,
    SqlIcon
} from '../icons';

const studentNavItems = [
    { label: 'Dashboard', icon: DashboardIcon, href: '/dashboard' },
    { label: 'Companies', icon: CompanyIcon, href: '/companies' },
    { label: 'My Resume', icon: ResumeIcon, href: '/resume' },
];

const adminNavItems = [
    { label: 'Admin Dashboard', icon: DashboardIcon, href: '/admin' },
    { label: 'Manage Companies', icon: CompanyIcon, href: '/admin/companies' },
    { label: 'Students', icon: InterviewIcon, href: '/admin/students' },
];

export function Sidebar({ className, isAdmin: isAdminProp }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = isAdminProp || location.pathname.startsWith('/admin');
    const items = isAdmin ? adminNavItems : studentNavItems;

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        if (isAdmin) {
            navigate('/admin-login');
        } else {
            navigate('/login');
        }
    };

    return (
        <aside className={cn("flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white p-4", className)}>
            <div>
                <div className="mb-8 flex items-center gap-2 px-2 font-bold text-xl text-blue-600">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                        <span className="text-sm">AI</span>
                    </div>
                    {isAdmin ? 'Admin Panel' : 'Placement'}
                </div>

                <nav className="flex flex-col gap-1">
                    {items.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.href === '/admin' || item.href === '/dashboard'}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="mt-auto flex flex-col gap-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogoutIcon className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
