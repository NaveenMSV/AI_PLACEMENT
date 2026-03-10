import React from 'react';
import { cn } from '../../lib/utils';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900 focus:ring-slate-500',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </button>
    );
}
