import React from 'react';
import { cn } from '../../lib/utils';
import { Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function Alert({ variant = "info", title, description, className, ...props }) {
    const variants = {
        info: {
            wrapper: "bg-blue-50 border-blue-200 text-blue-800",
            icon: <Info className="h-5 w-5 text-blue-500 mt-0.5" />
        },
        success: {
            wrapper: "bg-green-50 border-green-200 text-green-800",
            icon: <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        },
        warning: {
            wrapper: "bg-orange-50 border-orange-200 text-orange-800",
            icon: <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
        },
        danger: {
            wrapper: "bg-red-50 border-red-200 text-red-800",
            icon: <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
        }
    };

    const selectedVariant = variants[variant];

    return (
        <div
            className={cn("relative w-full rounded-lg border p-4 flex gap-3", selectedVariant.wrapper, className)}
            {...props}
        >
            <div className="flex-shrink-0">{selectedVariant.icon}</div>
            <div className="flex-1">
                {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
                {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
        </div>
    );
}
