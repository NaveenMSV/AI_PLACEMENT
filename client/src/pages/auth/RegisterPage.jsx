import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LockIcon, ProfileIcon } from '../../components/icons';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Registration successful! Please login.');
                navigate('/login');
            } else {
                setError(data.message || 'Registration failed');
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
            title="Create an account"
            subtitle="Start your placement preparation journey today."
        >
            {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
            <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                        <Input
                            type="text"
                            placeholder="Naveen"
                            icon={ProfileIcon}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                        <Input
                            type="email"
                            placeholder="naveen@example.com"
                            icon={ProfileIcon}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                        <Input
                            type="password"
                            placeholder="Create a strong password"
                            icon={LockIcon}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                    Create Account
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <NavLink to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                    Sign in
                </NavLink>
            </p>
        </AuthLayout>
    );
}
