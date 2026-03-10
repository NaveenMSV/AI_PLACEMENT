import React from 'react';
import { cn } from '../../lib/utils';

export function Progress({ value, max = 100, className, indicatorClassName, ...props }) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div
            className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            {...props}
        >
            <div
                className={cn("h-full w-full flex-1 bg-blue-600 transition-all duration-500 ease-in-out", indicatorClassName)}
                style={{ transform: `translateX(-${100 - percentage}%)` }}
            />
        </div>
    );
}
