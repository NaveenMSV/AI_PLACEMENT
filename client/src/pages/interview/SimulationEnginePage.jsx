import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AptitudeRound from './AptitudeRound';
import CodingRound from './CodingRound';
import SqlRound from './SqlRound';
import AiRound from './AiRound';
import { AlertCircle, Camera, ShieldAlert, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SimulationEnginePage() {
    const { attemptId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [roundData, setRoundData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const initialRound = parseInt(searchParams.get('round')) || 1;
    const [currentRoundNumber, setCurrentRoundNumber] = useState(initialRound);

    // Proctoring State
    const [isMalpractice, setIsMalpractice] = useState(false);
    const [malpracticeType, setMalpracticeType] = useState(''); // Tracking terminal violation type
    const [malpracticeCountdown, setMalpracticeCountdown] = useState(5);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningType, setWarningType] = useState('');
    const [isBlurred, setIsBlurred] = useState(false);
    const videoRef = useRef(null);
    const proctorCleanup = useRef(null);
    const violationTypeCounts = useRef({}); // Track counts per type (BACK_BUTTON, SCREENSHOT, etc.)
    const hasTriggeredMalpractice = useRef(false);

    // ─── LIFECYCLE ──────────────────────────────────────────
    useEffect(() => {
        fetchRoundInfo();
        startWebcam();
        enterFullScreen();
        setupProctoring();

        return () => { cleanupProctoring(); };
    }, [attemptId, currentRoundNumber]);

    // ─── FULLSCREEN ─────────────────────────────────────────
    const enterFullScreen = () => {
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
        } catch (e) { console.warn('Fullscreen request failed:', e); }
    };

    // ─── PROCTORING SETUP ───────────────────────────────────
    const setupProctoring = () => {
        cleanupProctoring();

        // 1. FULLSCREEN EXIT → IMMEDIATE MALPRACTICE (ONE CHANCE)
        const handleFSChange = () => {
            if (!document.fullscreenElement && !hasTriggeredMalpractice.current) {
                triggerViolation('FULLSCREEN_EXIT', true);
            }
        };

        // 2. TAB SWITCH / VISIBILITY
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden' && !hasTriggeredMalpractice.current) {
                setIsBlurred(true);
                triggerViolation('TAB_SWITCH');
            }
        };

        // 3. SCREENSHOT KEY & SHORTCUTS
        const handleKeyDown = (e) => {
            if (hasTriggeredMalpractice.current) return;

            // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+Shift+C (DevTools)
            const isDevTools = e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()));

            // PrintScreen (Keydown/Keyup)
            if (e.key === 'PrintScreen' || isDevTools) {
                e.preventDefault();
                setIsBlurred(true);
                triggerViolation(isDevTools ? 'DEVTOOLS_ACCESS' : 'SCREENSHOT');
            }

            // Shortcuts: 
            // Mac: Cmd+Shift+3/4 (Meta+Shift+3/4)
            // Windows: Win+Shift+S (Meta+Shift+S)
            const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4');
            const isWinScreenshot = e.metaKey && e.shiftKey && e.key.toLowerCase() === 's';

            if (isMacScreenshot || isWinScreenshot) {
                e.preventDefault();
                setIsBlurred(true);
                triggerViolation('SCREENSHOT_SHORTCUT');
            }

            // Block common shortcuts
            if (
                (e.ctrlKey && ['c', 'v', 't', 'r'].includes(e.key.toLowerCase())) ||
                (e.altKey && e.key === 'Tab')
            ) {
                e.preventDefault();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                setIsBlurred(true);
                // Screenshots have only 1 warning (2nd time is malpractice)
                triggerViolation('SCREENSHOT');
            }
        };

        // 4. BACK BUTTON BLOCK & VIOLATION
        window.history.pushState(null, null, window.location.href);
        const handlePopState = (e) => {
            console.log('Popstate detected, trapping user and logging violation...');
            window.history.pushState(null, null, window.location.href);
            // Give 3 chances for back button (4th time is malpractice)
            triggerViolation('BACK_BUTTON');
        };

        // 5. BEFOREUNLOAD
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'You are in a proctored test. Leaving will disqualify you.';
            return e.returnValue;
        };

        // 6. Context menu / copy-paste
        const preventContextMenu = (e) => e.preventDefault();
        const preventCopyPaste = (e) => {
            if (['copy', 'cut', 'paste'].includes(e.type)) e.preventDefault();
        };

        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('copy', preventCopyPaste);
        document.addEventListener('cut', preventCopyPaste);
        document.addEventListener('paste', preventCopyPaste);

        proctorCleanup.current = () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('cut', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
        };
    };

    const cleanupProctoring = () => {
        if (proctorCleanup.current) {
            proctorCleanup.current();
            proctorCleanup.current = null;
        }
    };

    // ─── WEBCAM ─────────────────────────────────────────────
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { console.error('Webcam failed:', err); }
    };

    // ─── VIOLATION HIERARCHY ───────────────────────────────
    const triggerViolation = async (type, forceCritical = false) => {
        if (hasTriggeredMalpractice.current) return;

        // Update local per-type count
        violationTypeCounts.current[type] = (violationTypeCounts.current[type] || 0) + 1;
        const currentTypeCount = violationTypeCounts.current[type];

        // GLOBAL TERMINAL RULE: 2nd violation (any type) is terminal
        // (Except Fullscreen Exit which is always terminal)
        let isCritical = forceCritical;

        if (['SCREENSHOT', 'SCREENSHOT_SHORTCUT', 'DEVTOOLS_ACCESS', 'TAB_SWITCH', 'BACK_BUTTON'].includes(type)) {
            if (violationCount >= 1) isCritical = true; // 1st is warning, 2nd is terminal
        }

        console.log(`Violation[${type}] count: ${currentTypeCount}, isCritical: ${isCritical}`);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/simulation/increment-violation', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ attemptId, type, isCritical }) // Notify backend if we hit threshold
            });
            const data = await res.json();

            if (res.ok) {
                setViolationCount(data.violationCount);
                if (data.malpractice || isCritical) {
                    triggerMalpractice(type);
                } else {
                    setWarningType(type);
                    setShowWarning(true);
                }
            }
        } catch (e) {
            console.error('Violation log error:', e);
            // Fallback for network issues
            const newCount = violationCount + 1;
            setViolationCount(newCount);
            if (isCritical || newCount >= 3) triggerMalpractice(type);
            else { setWarningType(type); setShowWarning(true); }
        }
    };

    // ─── MALPRACTICE TRIGGER ────────────────────────────────
    const triggerMalpractice = async (type) => {
        if (hasTriggeredMalpractice.current) return;
        hasTriggeredMalpractice.current = true;
        setMalpracticeType(type);
        setIsMalpractice(true);
        setIsBlurred(false); // Remove blur to show malpractice screen clearly
        cleanupProctoring();

        try {
            const token = localStorage.getItem('token');
            await fetch('/api/student/security/malpractice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ attemptId, type })
            });
        } catch (e) { console.error('Malpractice log error:', e); }

        // Start countdown
        let count = 5;
        setMalpracticeCountdown(count);
        const timer = setInterval(() => {
            count--;
            setMalpracticeCountdown(count);
            if (count <= 0) {
                clearInterval(timer);
                navigate('/dashboard');
                // Exit fullscreen ONLY after navigation/redirect has started/completed
                setTimeout(() => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => { });
                    }
                }, 100);
            }
        }, 1000);
    };

    // ─── ROUND DATA FETCH ───────────────────────────────────
    const fetchRoundInfo = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/test/${attemptId}/round/${currentRoundNumber}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                if (data.completed) {
                    const nextRound = currentRoundNumber + 1;
                    const nextRes = await fetch(`/api/student/test/${attemptId}/round/${nextRound}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (nextRes.ok) {
                        setCurrentRoundNumber(nextRound);
                        return;
                    } else {
                        await fetch(`/api/student/test/${attemptId}/finish`, {
                            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                        });
                        exitAndNavigate(`/results/${attemptId}`);
                        return;
                    }
                }
                setRoundData(data.roundAttempt);
                setQuestions(data.questions || []);
            } else if (res.status === 400 && data.status) {
                exitAndNavigate(`/results/${attemptId}`);
                return;
            } else if (res.status === 404) {
                await fetch(`/api/student/test/${attemptId}/finish`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                });
                exitAndNavigate(`/results/${attemptId}`);
                return;
            } else {
                exitAndNavigate('/dashboard');
            }
        } catch (error) {
            console.error('Error fetching round info:', error);
        } finally {
            setLoading(false);
        }
    };

    const exitAndNavigate = (path) => {
        cleanupProctoring();
        if (document.fullscreenElement) {
            document.exitFullscreen().then(() => navigate(path)).catch(() => navigate(path));
        } else {
            navigate(path);
        }
    };

    // ─── END TEST / FINISH ROUND ────────────────────────────
    const handleEndTestConfirm = () => setShowEndConfirm(true);

    const handleEndTestYes = async () => {
        setShowEndConfirm(false);
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await fetch(`/api/student/test/${attemptId}/finish`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            exitAndNavigate(`/results/${attemptId}`);
        } catch (error) {
            exitAndNavigate('/dashboard');
        }
    };

    const handleFinishRound = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const nextRound = currentRoundNumber + 1;
            const res = await fetch(`/api/student/test/${attemptId}/round/${nextRound}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCurrentRoundNumber(nextRound);
            } else {
                await fetch(`/api/student/test/${attemptId}/finish`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                });
                exitAndNavigate(`/results/${attemptId}`);
            }
        } catch (error) {
            exitAndNavigate('/dashboard');
        }
    };

    // ─── RENDERERS ────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-slate-400">Loading Assessment Environment...</span>
        </div>
    );

    if (isMalpractice) {
        return (
            <div className="fixed inset-0 z-[10000] bg-red-950 flex flex-col items-center justify-center text-white p-6 text-center">
                <ShieldAlert size={120} className="mb-8 text-red-500 animate-pulse" />
                <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic">Malpractice Detected</h1>
                <p className="text-2xl font-bold mb-2 max-w-2xl text-red-100/80 uppercase">
                    Terminal Violation: {malpracticeType.replace(/_/g, ' ')}
                </p>
                <p className="text-xl font-medium mb-12 opacity-70">
                    Violation Count: 2/2
                </p>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-50">Redirecting in</span>
                    <div className="h-24 w-24 rounded-full border-4 border-white/20 flex items-center justify-center relative">
                        <span className="text-4xl font-black">{malpracticeCountdown}</span>
                        <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    // ─── MAIN RENDER ────────────────────────────────────────
    return (
        <div className="relative min-h-screen bg-slate-100 overflow-x-hidden">
            {/* Main Content (Blurred during violations) */}
            <div className={cn(
                "min-h-screen bg-white transition-all duration-500 flex flex-col",
                isBlurred && "blur-3xl scale-110 pointer-events-none select-none overflow-hidden"
            )}>
                {/* Proctoring Status Bar */}
                <div className="p-2 bg-slate-900 text-slate-400 flex items-center justify-between px-6 text-sm font-bold shadow-md shrink-0">
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={16} className="text-green-400" />
                        <span className="text-green-400">PROCTORED MODE ACTIVE</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-red-400 text-xs">VIOLATIONS: {violationCount}</span>
                    </div>
                    <button
                        onClick={handleEndTestConfirm}
                        className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors text-white"
                    >
                        End Test
                    </button>
                </div>

                {/* Round Content */}
                <div className="flex-1 overflow-auto">
                    {roundData && (
                        <>
                            {roundData.roundType === 'APTITUDE' || roundData.roundType === 'MCQ' ? (
                                <AptitudeRound questions={questions} onFinish={handleFinishRound} attemptId={attemptId} roundNumber={currentRoundNumber} />
                            ) : roundData.roundType === 'CODING' ? (
                                <CodingRound questions={questions} onFinish={handleFinishRound} attemptId={attemptId} roundNumber={currentRoundNumber} />
                            ) : roundData.roundType === 'SQL' ? (
                                <SqlRound questions={questions} onFinish={handleFinishRound} attemptId={attemptId} roundNumber={currentRoundNumber} />
                            ) : (
                                <AiRound questions={questions} onFinish={handleFinishRound} attemptId={attemptId} roundType={roundData.roundType} roundNumber={currentRoundNumber} />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Warning Modal (Outside blurred area) */}
            {showWarning && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-4 border-red-500 animate-in zoom-in-95 duration-200">
                        <div className="h-20 w-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Security Warning!</h3>

                        <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 font-semibold shadow-inner border border-red-100 text-sm">
                            {warningType === 'TAB_SWITCH' && "Tab window changed. Return to the test window immediately."}
                            {warningType === 'SCREENSHOT' && "Screenshot attempt detected. This is strictly prohibited."}
                            {warningType === 'SCREENSHOT_SHORTCUT' && "Screenshot shortcut detected. This is strictly prohibited."}
                            {warningType === 'BACK_BUTTON' && "Back button navigation attempt detected. Use the on-screen controls only."}
                            {warningType === 'DEVTOOLS_ACCESS' && "Developer Tools detected. This is strictly prohibited."}
                        </div>

                        <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                            This is your security violation <strong>{violationCount}/2</strong>.
                            <br />
                            Reaching 2 attempts will end your test immediately.
                        </p>

                        <button
                            onClick={() => {
                                setShowWarning(false);
                                setIsBlurred(false);
                                enterFullScreen();
                            }}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                        >
                            I Understand, Continue
                        </button>
                    </div>
                </div>
            )}

            {/* End Test Confirmation Modal */}
            {showEndConfirm && (
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-orange-400 font-sans">
                        <div className="h-20 w-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">End Test?</h3>
                        <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                            Are you sure you want to end the test? You cannot return to this simulation once submitted.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowEndConfirm(false)} className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={handleEndTestYes} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg">Yes, End Test</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Webcam View */}
            <div className="fixed bottom-6 right-6 z-[999] w-48 h-36 bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-200 shadow-2xl group">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                </div>
                <div className="absolute bottom-2 right-2 text-white/50 group-hover:text-white transition-colors">
                    <Camera size={14} />
                </div>
            </div>
        </div>
    );
}
