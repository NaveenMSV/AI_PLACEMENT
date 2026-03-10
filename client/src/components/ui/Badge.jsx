import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, variant = "default", className, ...props }) {
    const variants = {
        default: "bg-slate-100 text-slate-900",
        primary: "bg-blue-100 text-blue-700",
        success: "bg-green-50 text-green-600 border border-green-100",
        warning: "bg-orange-50 text-orange-600 border border-orange-100",
        danger: "bg-red-50 text-red-600 border border-red-100",
        outline: "text-slate-950 border border-slate-200"
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
