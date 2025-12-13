
import React, { useState } from 'react';
import { FinanceItem, UserRole } from '../types';
import { useApp } from '../contexts/AppContext';
import { generateText } from '../services/geminiService';
import { PoundSterling, TrendingUp, AlertTriangle, PieChart, FileText, Lock, Plus, ArrowDown, ArrowUp, Briefcase, Calendar, CreditCard, Trash2 } from 'lucide-react';

export const Finance: React.FC = () => {
    const { currentUser, currentTour, financeItems, addFinanceItem, deleteFinanceItem } = useApp();
    const [viewMode, setViewMode] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // AI Audit State
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState<Partial<Omit<FinanceItem, 'amount'> & { amount: string | number }>>({
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        category: 'Travel',
        paySource: 'Credit Card',
        description: '',
        amount: 0
    });

    // Permission Check
    const hasFinancialAccess = currentUser?.role !== UserRole.CREW;

    if (!currentTour) return null;

    // Filter Items for Current Tour
    const tourItems = financeItems.filter(i => i.tourId === currentTour.id).sort((a,b) => b.date.localeCompare(a.date));
    
    // Calculate Totals
    const totalIncome = tourItems.filter(i => i.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = tourItems.filter(i => i.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;
    const budget = currentTour.budget || 0;
    const budgetRemaining = budget - totalExpense;
    const budgetPercent = Math.min((totalExpense / budget) * 100, 100);

    const filteredItems = viewMode === 'ALL' ? tourItems : tourItems.filter(i => i.type === viewMode);

    const handleAudit = async () => {
        if (!hasFinancialAccess) return;
        setIsAnalyzing(true);
        const dataStr = tourItems.map(e => `${e.date}: [${e.type}] ${e.category} - £${e.amount} (${e.description})`).join('\n');
        const prompt = `Analyze these tour finances:\n${dataStr}\n\nProvide a brief financial health summary. Identify top spending categories, any unusual expenses, and cash flow status.`;
        
        const result = await generateText(prompt, 'gemini-3-pro-preview');
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if(newItem.amount && newItem.description) {
            addFinanceItem({
                id: Math.random().toString(36).substr(2, 9),
                tourId: currentTour.id,
                type: newItem.type as 'INCOME' | 'EXPENSE',
                date: newItem.date!,
                category: newItem.category!,
                paySource: newItem.paySource!,
                description: newItem.description!,
                amount: Number(newItem.amount)
            });
            setIsAddModalOpen(false);
            setNewItem({ type: 'EXPENSE', date: new Date().toISOString().split('T')[0], category: 'Travel', paySource: 'Credit Card', description: '', amount: 0 });
        }
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this transaction?")) {
            deleteFinanceItem(id);
        }
    };

    // --- CHART LOGIC ---
    const categoryColors: Record<string, string> = {
        'Travel': '#3b82f6', // blue
        'Accommodation': '#8b5cf6', // violet
        'Production': '#f59e0b', // amber
        'Catering': '#10b981', // emerald
        'Per Diems': '#ec4899', // pink
        'Guarantee': '#22c55e', // green
        'Merch': '#06b6d4', // cyan
        'Other': '#64748b' // slate
    };

    const expensesOnly = tourItems.filter(i => i.type === 'EXPENSE');
    const categoryBreakdown = expensesOnly.reduce((acc, curr) => {
        acc[curr.category] = (Number(acc[curr.category]) || 0) + Number(curr.amount);
        return acc;
    }, {} as Record<string, number>);

    let cumulativePercent = 0;
    const chartSegments = Object.entries(categoryBreakdown).map(([cat, amountVal]) => {
        const amount = Number(amountVal);
        const percent = amount / (totalExpense || 1); // Avoid div by zero
        const startX = Math.cos(2 * Math.PI * cumulativePercent);
        const startY = Math.sin(2 * Math.PI * cumulativePercent);
        cumulativePercent += percent;
        const endX = Math.cos(2 * Math.PI * cumulativePercent);
        const endY = Math.sin(2 * Math.PI * cumulativePercent);
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        
        return {
            category: cat,
            amount,
            percent,
            pathData: `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
            color: categoryColors[cat] || categoryColors['Other']
        };
    }).sort((a, b) => b.amount - a.amount);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Financials</h1>
                    <p className="text-slate-400">Budget Tracking & Ledger</p>
                </div>
                {hasFinancialAccess && (
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" /> Add Transaction
                    </button>
                )}
            </header>

            {/* ADD TRANSACTION MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-maestro-800 border border-maestro-accent/50 p-6 rounded-xl shadow-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold text-white mb-6">New Transaction</h3>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Type</label>
                                    <div className="flex bg-maestro-900 rounded p-1 border border-maestro-700">
                                        <button 
                                            type="button" 
                                            onClick={() => setNewItem({...newItem, type: 'EXPENSE'})}
                                            className={`flex-1 py-2 rounded text-xs font-bold ${newItem.type === 'EXPENSE' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                                        >
                                            Expense
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setNewItem({...newItem, type: 'INCOME'})}
                                            className={`flex-1 py-2 rounded text-xs font-bold ${newItem.type === 'INCOME' ? 'bg-green-600 text-white' : 'text-slate-400'}`}
                                        >
                                            Income
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={newItem.date}
                                        onChange={e => setNewItem({...newItem, date: e.target.value})}
                                        className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Amount</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        step="0.01"
                                        value={newItem.amount}
                                        onChange={e => setNewItem({...newItem, amount: e.target.value})}
                                        className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Pay Source</label>
                                    <select 
                                        value={newItem.paySource}
                                        onChange={e => setNewItem({...newItem, paySource: e.target.value})}
                                        className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none"
                                    >
                                        <option>Credit Card</option>
                                        <option>Wire Transfer</option>
                                        <option>Petty Cash</option>
                                        <option>Check</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Category</label>
                                <select 
                                    value={newItem.category}
                                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                                    className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none"
                                >
                                    {newItem.type === 'EXPENSE' ? (
                                        <>
                                            <option>Travel</option>
                                            <option>Accommodation</option>
                                            <option>Production</option>
                                            <option>Catering</option>
                                            <option>Per Diems</option>
                                            <option>Marketing</option>
                                            <option>Other</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>Guarantee</option>
                                            <option>Merch</option>
                                            <option>VIP Packages</option>
                                            <option>Overage</option>
                                            <option>Other</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Description</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Details..."
                                    value={newItem.description}
                                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                                    className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none" 
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Cancel</button>
                                <button type="submit" className="bg-maestro-accent hover:bg-violet-600 text-white px-6 py-2 rounded font-bold">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded text-green-400"><ArrowUp className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">Total Income</span>
                    </div>
                    {hasFinancialAccess ? (
                        <div className="text-2xl font-bold text-white">£{totalIncome.toLocaleString()}</div>
                    ) : <div className="text-slate-500"><Lock className="w-4 h-4 inline" /> Hidden</div>}
                </div>
                
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded text-red-400"><ArrowDown className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">Total Expenses</span>
                    </div>
                    {hasFinancialAccess ? (
                        <div className="text-2xl font-bold text-white">£{totalExpense.toLocaleString()}</div>
                    ) : <div className="text-slate-500"><Lock className="w-4 h-4 inline" /> Hidden</div>}
                </div>

                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded text-blue-400"><PoundSterling className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">Net Balance</span>
                    </div>
                    {hasFinancialAccess ? (
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>£{balance.toLocaleString()}</div>
                    ) : <div className="text-slate-500"><Lock className="w-4 h-4 inline" /> Hidden</div>}
                </div>

                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-maestro-gold/10 rounded text-maestro-gold"><PieChart className="w-5 h-5" /></div>
                        <span className="text-slate-400 text-sm font-bold uppercase">Budget Left</span>
                    </div>
                    {hasFinancialAccess ? (
                        <>
                            <div className="text-2xl font-bold text-white">£{budgetRemaining.toLocaleString()}</div>
                            <div className="w-full bg-maestro-900 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className={`h-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                            </div>
                        </>
                    ) : <div className="text-slate-500"><Lock className="w-4 h-4 inline" /> Hidden</div>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction List */}
                <div className="lg:col-span-2 bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-maestro-700 flex justify-between items-center bg-maestro-900">
                        <div className="font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Ledger
                        </div>
                        <div className="flex bg-maestro-800 rounded border border-maestro-700 p-0.5">
                            <button onClick={() => setViewMode('ALL')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>All</button>
                            <button onClick={() => setViewMode('INCOME')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'INCOME' ? 'bg-green-900/50 text-green-400' : 'text-slate-400'}`}>In</button>
                            <button onClick={() => setViewMode('EXPENSE')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'EXPENSE' ? 'bg-red-900/50 text-red-400' : 'text-slate-400'}`}>Out</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-maestro-900/50 text-xs text-slate-500 uppercase font-semibold sticky top-0">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Pay Source</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-right">Amount</th>
                                    {hasFinancialAccess && <th className="p-4 w-10"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-maestro-700 text-sm text-slate-300">
                                {filteredItems.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">No transactions recorded.</td></tr>
                                ) : filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-maestro-700/50 group">
                                        <td className="p-4 font-mono text-xs">{item.date}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                                                item.type === 'INCOME' ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-red-900/20 text-slate-400 border-red-900/30'
                                            }`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-4 flex items-center gap-2 text-xs">
                                            <CreditCard className="w-3 h-3 text-slate-500" /> {item.paySource}
                                        </td>
                                        <td className="p-4 truncate max-w-[200px]" title={item.description}>{item.description}</td>
                                        <td className={`p-4 text-right font-mono font-bold ${item.type === 'INCOME' ? 'text-green-400' : 'text-white'}`}>
                                            {hasFinancialAccess ? (
                                                <>
                                                    {item.type === 'INCOME' ? '+' : '-'}£{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </>
                                            ) : '****'}
                                        </td>
                                        {hasFinancialAccess && (
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(item.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Analysis & Breakdown Panel */}
                <div className="bg-maestro-800 rounded-xl border border-maestro-700 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-maestro-accent" /> Spending Breakdown
                        </h3>
                        {hasFinancialAccess ? (
                            <div className="flex flex-col items-center">
                                {/* SVG Donut Chart */}
                                {totalExpense > 0 ? (
                                    <>
                                        <div className="w-48 h-48 relative mb-6">
                                            <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full overflow-visible">
                                                {chartSegments.map((segment) => (
                                                    <path 
                                                        key={segment.category}
                                                        d={segment.pathData}
                                                        fill={segment.color}
                                                        stroke="#1e293b" 
                                                        strokeWidth="0.05"
                                                    />
                                                ))}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-32 h-32 bg-maestro-800 rounded-full flex flex-col items-center justify-center shadow-inner">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total Out</span>
                                                    <span className="text-white font-bold">£{(totalExpense/1000).toFixed(1)}k</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-2">
                                            {chartSegments.map(seg => (
                                                <div key={seg.category} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }}></div>
                                                        <span className="text-slate-300">{seg.category}</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <span className="text-slate-500 text-xs">£{seg.amount.toLocaleString()}</span>
                                                        <span className="text-white font-mono text-xs w-10 text-right">{(seg.percent * 100).toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-10 text-slate-500 text-xs">No expenses recorded yet.</div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-center text-sm">
                                <Lock className="w-8 h-8 mb-2 opacity-50" />
                                <p>Financial visualization restricted.</p>
                            </div>
                        )}
                    </div>

                    {/* AI Analysis Section */}
                    {hasFinancialAccess && (
                        <div className="border-t border-maestro-700 pt-6">
                            <div 
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={handleAudit}
                            >
                                <h4 className="text-xs font-bold text-maestro-gold uppercase mb-3 flex items-center gap-2 group-hover:text-white transition-colors">
                                    <TrendingUp className="w-4 h-4" /> AI Insights
                                </h4>
                                <span className="text-[10px] text-slate-500 uppercase group-hover:text-maestro-accent">Run Audit</span>
                            </div>
                            {isAnalyzing ? (
                                <div className="text-center py-4 text-xs text-maestro-accent animate-pulse">Analyzing ledger...</div>
                            ) : analysis ? (
                                <div className="prose prose-invert prose-sm">
                                    <p className="whitespace-pre-wrap text-sm text-slate-300 bg-maestro-900/50 p-3 rounded border border-maestro-700">{analysis}</p>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Click to detect anomalies and summarize cash flow.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
