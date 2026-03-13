import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LockIcon } from '../../components/icons';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/auth/resetpassword/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Reset failed. Token may be expired.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout 
                title="Password Reset Successful" 
                subtitle="Your password has been updated. Redirecting to login..."
            >
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <Button onClick={() => navigate('/login')} className="w-full">
                        Back to Login
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            title="Create New Password" 
            subtitle="Please enter your new password below."
        >
            {error && (
                <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg animate-shake">
                    {error}
                </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">New Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            icon={LockIcon}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            icon={LockIcon}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-bold" isLoading={isLoading}>
                    Reset Password
                </Button>
            </form>
        </AuthLayout>
    );
}
