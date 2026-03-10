import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Play, Send, ChevronLeft } from 'lucide-react';

export default function CodingRound() {
    return (
        <div className="h-screen bg-slate-900 flex flex-col text-slate-300">
            {/* Top Navbar */}
            <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-semibold text-white">Coding Assessment: Reverse Linked List</span>
                    <Badge variant="warning">Medium</Badge>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-red-400">Time Left: 29:55</span>
                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Send size={16} className="mr-2" /> Submit Code
                    </Button>
                </div>
            </header>

            {/* Main Split Interface */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Problem Description */}
                <div className="w-1/3 border-r border-slate-800 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Reverse Linked List</h2>
                        <div className="space-y-4 text-sm leading-relaxed">
                            <p>Given the <code>head</code> of a singly linked list, reverse the list, and return the reversed list.</p>

                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono">
                                <p className="text-slate-400 mb-1">Example 1:</p>
                                <p>Input: head = [1,2,3,4,5]</p>
                                <p>Output: [5,4,3,2,1]</p>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono">
                                <p className="text-slate-400 mb-1">Constraints:</p>
                                <ul className="list-disc list-inside">
                                    <li>The number of nodes in the list is the range [0, 5000].</li>
                                    <li>-5000 &lt;= Node.val &lt;= 5000</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor & Output */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Editor Header */}
                    <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                        <select className="bg-slate-800 text-sm text-white border-none rounded py-1 px-3 outline-none">
                            <option>Java</option>
                            <option>Python 3</option>
                            <option>C++</option>
                            <option>JavaScript</option>
                        </select>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                                <Play size={14} className="mr-2" /> Run Tests
                            </Button>
                        </div>
                    </div>

                    {/* Editor Area (Placeholder for Monaco / CodeMirror) */}
                    <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm overflow-auto">
                        <pre className="text-emerald-400"><span className="text-blue-400">class</span> <span className="text-yellow-300">Solution</span> {'{'}</pre>
                        <pre className="pl-4 text-emerald-400">    <span className="text-blue-400">public</span> ListNode <span className="text-yellow-300">reverseList</span>(ListNode head) {'{'}</pre>
                        <pre className="pl-8 text-slate-500">        <span className="italic">// Write your code here</span></pre>
                        <pre className="pl-8 text-white"><span className="animate-pulse">|</span></pre>
                        <pre className="pl-4 text-emerald-400">    {'}'}</pre>
                        <pre className="text-emerald-400">{'}'}</pre>
                    </div>

                    {/* Test Cases / Terminal Output */}
                    <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col">
                        <div className="flex border-b border-slate-800">
                            <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-white">Test Cases</button>
                            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-300">Test Result</button>
                        </div>
                        <div className="p-4 overflow-auto">
                            <div className="bg-slate-900 rounded p-4 font-mono text-sm">
                                <p className="text-slate-500 mb-2">Case 1</p>
                                <div className="mb-2">
                                    <span className="text-slate-500 mr-2">head =</span>
                                    <span className="text-white">[1,2,3,4,5]</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
