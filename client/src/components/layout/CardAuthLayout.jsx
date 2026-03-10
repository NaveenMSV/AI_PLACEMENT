import React from 'react';
import '../../pages/auth/Login.css';

export function CardAuthLayout({ children }) {
    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-box">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <div className="logo-text">EDUPREDICT<span>.AI</span></div>
                </div>

                <div className="login-header">
                    <h1>Welcome to Portal</h1>
                    <p>Secure institutional access for authorized personnel.</p>
                </div>

                {children}
            </div>
        </div>
    );
}
