import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, MenuIcon, ArrowDownIcon, LogoutIcon, ProfileIcon } from '../icons';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { SearchContext } from '../../context/SearchContext';

export function Topbar({ onMenuClick }) {
    const navigate = useNavigate();
    const context = React.useContext(SearchContext);
    const searchQuery = context?.searchQuery || '';
    const setSearchQuery = context?.setSearchQuery || (() => { });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Read user data from localStorage
    let user = { name: 'User', college: '', role: 'student' };
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch (e) { /* ignore parse errors */ }

    const displayName = user.name || 'User';
    const subtitle = user.college || (user.role === 'admin' ? 'Administrator' : 'Student');

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        if (user.role === 'admin') {
            navigate('/admin-login');
        } else {
            navigate('/login');
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
            <div className="flex flex-1 items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>
                <div className="hidden w-full max-w-md sm:block">
                    <Input
                        type="text"
                        placeholder="Search companies, topics, or resources..."
                        icon={SearchIcon}
                        className="bg-slate-50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden flex-col items-end sm:flex text-right mr-2">
                    <p className="text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="group flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 hover:bg-slate-50 transition-all"
                    >
                        <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-white">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`}
                                alt="User avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <ArrowDownIcon className={cn("h-4 w-4 text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white p-1 shadow-xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    navigate('/profile');
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                <ProfileIcon className="h-4 w-4" />
                                My Profile
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogoutIcon className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
