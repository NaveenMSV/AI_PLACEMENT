import { Camera, Mic, PlayCircle, Bot, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AiRound({ questions = [], onFinish, attemptId, roundType, roundNumber }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState({});

    const currentQuestion = questions[currentIndex] || { 
        question: "Could you tell me about yourself and your background?",
        _id: 'default'
    };

    const isHrRound = roundType === 'HR_INTERVIEW';

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setTimer(0);
        } else {
            handleSubmitAll();
        }
    };

    const handleSubmitAll = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/student/test/${attemptId}/round/${roundNumber}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    answers,
                    timeTaken: 300 // Simulating 5 mins for now
                })
            });
            if (res.ok) onFinish();
        } catch (error) {
            console.error('AI Round submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // Get user name from localStorage
    let userName = 'Student';
    try {
        const stored = localStorage.getItem('user');
        if (stored) userName = JSON.parse(stored).name || 'Student';
    } catch (e) { /* ignore */ }

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto h-full flex flex-col">

                <header className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] mb-2">
                            <Sparkles size={12} /> AI Interview Engine v2.0
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter italic uppercase">{isHrRound ? 'HR Behavioral Interview' : 'Technical Core Interview'}</h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                            <Shield size={14} className="text-emerald-500" /> Proctored Environment Active
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Progress</span>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1.5">
                                {questions.map((_, i) => (
                                    <div key={i} className={cn("w-8 h-1.5 rounded-full transition-all duration-500", i === currentIndex ? "bg-blue-500 w-12" : i < currentIndex ? "bg-emerald-500" : "bg-slate-800")} />
                                ))}
                                {questions.length === 0 && <div className="w-12 h-1.5 rounded-full bg-blue-500" />}
                            </div>
                            <span className="text-sm font-black italic">{currentIndex + 1} OF {questions.length || 1}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: AI Question & Context */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="bg-slate-900/50 border-slate-800 text-white h-auto overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
                                        <Bot size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-black italic uppercase tracking-tighter text-lg">AI Evaluator</h3>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Online & Analyzing</p>
                                    </div>
                                </div>
                                <div className="animate-pulse flex items-center gap-1.5 text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md border border-blue-400/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> LISTENING
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="bg-slate-800/40 p-6 rounded-3xl rounded-tl-none font-bold text-lg leading-relaxed text-slate-200 border border-slate-800">
                                    "{currentIndex === 0 ? `Hello ${userName}. ` : ''}{currentQuestion.question}"
                                </div>
                            </div>
                            <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-center">
                                <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 font-bold uppercase text-[10px] tracking-widest">
                                    <PlayCircle size={16} className="mr-2" /> Replay Question Audio
                                </Button>
                            </div>
                        </Card>

                        <Card className="bg-emerald-500/5 border-emerald-500/10 p-6">
                            <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-4">Round Instructions</h4>
                            <ul className="space-y-3">
                                {[
                                    'Maintain eye contact with the camera',
                                    'Speak clearly and maintain a steady pace',
                                    'Structure your answer using specific examples',
                                    'The system is analyzing sentiment and keywords'
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-400 leading-tight">
                                        <span className="text-emerald-500 mt-0.5">•</span> {step}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Right: Camera & Recording */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border-4 border-slate-800/50 shadow-2xl flex items-center justify-center group">
                            {/* Webcam Placeholder (Actual feed is in SimulationEnginePage, this is for UI focus) */}
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                    <Camera size={80} className="text-slate-800 relative z-10" />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-xl font-bold text-slate-600 uppercase tracking-widest italic group-hover:text-slate-400 transition-colors">Camera Stream 01</p>
                                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> HD FEED SECURED
                                    </div>
                                </div>
                            </div>

                            {/* Recording indicator */}
                            <div className={cn(
                                "absolute top-8 right-8 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 transition-all duration-500",
                                isRecording ? "scale-110 border-red-500/30" : "opacity-30"
                            )}>
                                <div className={cn("w-3 h-3 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-600")}></div>
                                <span className="text-sm font-mono font-black tabular-nums">{formatTime(timer)}</span>
                            </div>

                            {/* Live transcript overlay placeholder */}
                            <div className="absolute bottom-10 left-10 right-10 flex justify-center">
                                <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 text-center text-lg md:text-xl font-bold text-white max-w-3xl shadow-2xl">
                                    <span className="opacity-50 text-blue-400 mr-2 uppercase tracking-widest text-xs font-black block mb-2">Live Analysis</span>
                                    "I would break this down into three key architectural components: the shortener service, the persistent storage, and the redirect service..."
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 flex justify-between items-center shadow-lg">
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setIsRecording(!isRecording)}
                                    className={cn(
                                        "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-xl border-4",
                                        isRecording 
                                            ? "bg-red-600 border-red-500 shadow-red-500/20 hover:scale-95" 
                                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-white"
                                    )}
                                >
                                    <Mic size={28} className={isRecording ? "text-white" : ""} />
                                </button>
                                <button className="w-16 h-16 rounded-3xl bg-slate-800 border-4 border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-750 hover:text-white transition-all shadow-xl">
                                    <Camera size={28} />
                                </button>
                            </div>

                            <Button 
                                size="lg" 
                                className="bg-blue-600 hover:bg-blue-700 font-black italic uppercase text-lg px-12 py-8 rounded-[1.5rem] shadow-2xl shadow-blue-500/20 group relative overflow-hidden transition-all active:scale-95"
                                onClick={handleNext}
                                disabled={isSubmitting}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isSubmitting ? 'Finalizing...' : (currentIndex < questions.length - 1 ? 'Save & Continue' : 'Finish Interview')}
                                <Send size={22} className="ml-4 -rotate-12 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
}
