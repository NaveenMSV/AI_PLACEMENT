import React from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Camera, Mic, PlayCircle, Bot, ChevronLeft } from 'lucide-react';

export default function AiRound() {
    // Get user name from localStorage
    let userName = 'Student';
    try {
        const stored = localStorage.getItem('user');
        if (stored) userName = JSON.parse(stored).name || 'Student';
    } catch (e) { /* ignore */ }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-6xl mx-auto h-full flex flex-col">

                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">AI Technical Interview</h1>
                        <p className="text-slate-400 text-sm">Amazon System Design Round</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Progress value={20} className="w-32 h-2 bg-slate-800" indicatorClassName="bg-blue-500" />
                        <span className="text-sm font-medium">Question 1 of 5</span>
                    </div>
                </header>

                <main className="flex-1 grid grid-cols-3 gap-8">

                    {/* Left: AI Question & Context */}
                    <div className="col-span-1 space-y-6">
                        <Card className="bg-slate-800 border-none text-white h-full flex flex-col">
                            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <Bot size={24} />
                                </div>
                                <h3 className="font-semibold">AI Interviewer</h3>
                            </div>
                            <div className="p-6 flex-1">
                                <div className="bg-slate-700/50 p-4 rounded-xl rounded-tl-none font-medium leading-relaxed">
                                    "Hello {userName}. For our first system design question, how would you approach designing a URL shortening service like Bitly? What are the key components and scale estimations we need to consider?"
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-700 flex justify-center">
                                <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-slate-700">
                                    <PlayCircle size={20} className="mr-2" /> Replay Audio
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Camera & Recording */}
                    <div className="col-span-2 flex flex-col gap-6">
                        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center">
                            {/* Webcam Placeholder */}
                            <div className="text-slate-600 flex flex-col items-center">
                                <Camera size={48} className="mb-4 opacity-50" />
                                <p>Camera feed active</p>
                            </div>

                            {/* Recording indicator */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-xs font-medium">01:24</span>
                            </div>

                            {/* Live transcript overlay placeholder */}
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-3/4">
                                <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg text-center text-sm text-slate-200">
                                    "So, for a URL shortener, the first thing I would consider is the read-to-write ratio, which is usually heavily skewed towards reads..."
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-slate-800 p-6 rounded-2xl flex justify-between items-center">
                            <div className="flex gap-4">
                                <button className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition">
                                    <Mic size={20} /> {/* Assuming unmuted */}
                                </button>
                                <button className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition">
                                    <Camera size={20} />
                                </button>
                            </div>

                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
                                Submit Answer & Next <ChevronLeft size={18} className="ml-2 rotate-180" />
                            </Button>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
}
