import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LockIcon, ProfileIcon, CloseIcon } from '../../components/icons';

export default function LoginPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdminPath = location.pathname === '/admin-login';

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [role, setRole] = useState(isAdminPath ? 'admin' : 'student');
    const [showForgotModal, setShowForgotModal] = useState(false);

    // Sync role with path
    useEffect(() => {
        setRole(isAdminPath ? 'admin' : 'student');
    }, [isAdminPath]);

    const handleRoleSwitch = (newRole) => {
        setRole(newRole);
        if (newRole === 'admin') {
            navigate('/admin-login');
        } else {
            navigate('/login');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const apiEndpoint = role === 'admin' ? '/api/auth/admin-login' : '/api/auth/login';
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));

                if (data.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={role === 'admin' ? "Admin Portal" : "Welcome back"}
            subtitle={role === 'admin' ? "Enter administrator credentials to manage the platform." : "Enter your credentials to access your account."}
        >
            <div className="mb-6 flex p-1 bg-slate-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => handleRoleSwitch('student')}
                    className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${role === 'student'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    STUDENT
                </button>
                <button
                    type="button"
                    onClick={() => handleRoleSwitch('admin')}
                    className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${role === 'admin'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    ADMIN
                </button>
            </div>

            {error && <div className="p-4 mb-4 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg animate-shake">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
                        <Input
                            type="email"
                            placeholder={role === 'admin' ? "admin@simulator.com" : "alex@university.edu"}
                            icon={ProfileIcon}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-500"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            icon={LockIcon}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-bold" isLoading={isLoading}>
                    Sign in to Portal
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <NavLink to="/register" className="font-bold text-blue-600 hover:text-blue-500 underline decoration-2 underline-offset-4">
                    Register now
                </NavLink>
            </p>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
                            <button onClick={() => setShowForgotModal(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <CloseIcon className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 text-sm">
                                Enter your registered email address and we'll send you instructions to reset your password.
                            </p>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    icon={ProfileIcon}
                                />
                            </div>
                            <Button className="w-full h-11" onClick={() => {
                                alert("Password reset link has been sent to your email!");
                                setShowForgotModal(false);
                            }}>
                                Send Reset Link
                            </Button>
                            <button
                                onClick={() => setShowForgotModal(false)}
                                className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 py-2"
                            >
                                Nevermind, I remembered!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthLayout>
    );
}
