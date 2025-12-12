
import React, { useState } from 'react';
import { Expense, UserRole } from '../types';
import { useApp } from '../contexts/AppContext';
import { generateText } from '../services/geminiService';
import { DollarSign, TrendingUp, AlertTriangle, PieChart, FileText, Lock } from 'lucide-react';

export const Finance: React.FC = () => {
    const { currentUser } = useApp();
    const [expenses] = useState<Expense[]>([
        { id: '1', category: 'Travel', description: 'Flight: LAX -> ORD', amount: 4500.00, date: '2025-10-14' },
        { id: '2', category: 'Accommodation', description: 'Chicago Hotel Block', amount: 8200.50, date: '2025-10-15' },
        { id: '3', category: 'Production', description: 'Backline Rental', amount: 2100.00, date: '2025-10-15' },
        { id: '4', category: 'Catering', description: 'Green Room Setup', amount: 850.75, date: '2025-10-15' },
        { id: '5', category: 'Per Diems', description: 'Crew PDs (12 pax)', amount: 600.00, date: '2025-10-15' },
    ]);

    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Permission Check
    const hasFinancialAccess = currentUser?.role !== UserRole.CREW;

    const handleAudit = async () => {
        if (!hasFinancialAccess) return;
        setIsAnalyzing(true);
        const dataStr = expenses.map(e => `${e.date}: ${e.category} - $${e.amount} (${e.description})`).join('\n');
        const prompt = `Analyze these tour expenses:\n${dataStr}\n\nIdentify the top spending category, any potential outliers, and provide a brief summary of daily burn rate.`;
        
        const result = await generateText(prompt, 'gemini-3-pro-preview');
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const totalSpend = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white">Financials</h1>
                <p className="text-slate-400">Budget Tracking & Audit</p>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded text-green-400"><DollarSign className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">Total Spend</span>
                    </div>
                    {hasFinancialAccess ? (
                        <div className="text-2xl font-bold text-white">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-500 mt-2">
                            <Lock className="w-4 h-4" /> <span className="text-sm font-mono">HIDDEN</span>
                        </div>
                    )}
                </div>
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded text-blue-400"><TrendingUp className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">Budget Usage</span>
                    </div>
                    {hasFinancialAccess ? (
                        <>
                            <div className="text-2xl font-bold text-white">42%</div>
                            <div className="w-full bg-maestro-900 h-2 rounded-full mt-2 overflow-hidden">
                                <div className="bg-blue-500 h-full w-[42%]"></div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-500 mt-2">
                            <Lock className="w-4 h-4" /> <span className="text-sm font-mono">HIDDEN</span>
                        </div>
                    )}
                </div>
                <div 
                    className={`bg-maestro-800 p-6 rounded-xl border border-maestro-700 transition-colors ${hasFinancialAccess ? 'hover:border-maestro-accent cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} 
                    onClick={handleAudit}
                >
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-maestro-gold/10 rounded text-maestro-gold"><AlertTriangle className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">AI Audit</span>
                    </div>
                    <div className="text-sm text-slate-300">
                        {hasFinancialAccess ? (isAnalyzing ? 'Analyzing...' : 'Click to run anomaly detection') : 'Restricted Access'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Expense List */}
                <div className="lg:col-span-2 bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                    <div className="p-4 border-b border-maestro-700 font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Recent Expenses
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-maestro-900 text-xs text-slate-500 uppercase font-semibold">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-maestro-700 text-sm text-slate-300">
                            {expenses.map(e => (
                                <tr key={e.id} className="hover:bg-maestro-700/50">
                                    <td className="p-4 font-mono">{e.date}</td>
                                    <td className="p-4"><span className="bg-maestro-900 px-2 py-1 rounded text-xs">{e.category}</span></td>
                                    <td className="p-4">{e.description}</td>
                                    <td className="p-4 text-right font-mono text-white">
                                        {hasFinancialAccess ? `$${e.amount.toFixed(2)}` : '****'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Analysis Panel */}
                <div className="bg-maestro-800 rounded-xl border border-maestro-700 p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-maestro-accent" /> AI Analysis
                    </h3>
                    {hasFinancialAccess ? (
                        analysis ? (
                            <div className="prose prose-invert prose-sm">
                                <p className="whitespace-pre-wrap">{analysis}</p>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic">Run an audit to see spending breakdown and insights...</p>
                        )
                    ) : (
                         <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-center text-sm">
                            <Lock className="w-8 h-8 mb-2 opacity-50" />
                            <p>You do not have permission to run AI financial audits.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
