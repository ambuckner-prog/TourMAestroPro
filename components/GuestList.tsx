import React, { useState } from 'react';
import { GuestRequest } from '../types';
import { generateText } from '../services/geminiService';
import { Users, CheckCircle, XCircle, MoreHorizontal, MessageSquare, Loader2 } from 'lucide-react';

export const GuestList: React.FC = () => {
    const [requests, setRequests] = useState<GuestRequest[]>([
        { id: '1', name: 'John Doe', affiliation: 'Label Rep', quantity: 2, status: 'Pending', showId: '1' },
        { id: '2', name: 'Sarah Smith', affiliation: 'Radio Contest', quantity: 4, status: 'Approved', showId: '1' },
        { id: '3', name: 'Mike Jones', affiliation: 'Band Family', quantity: 2, status: 'Pending', showId: '1' },
        { id: '4', name: 'Emily Davis', affiliation: 'Press', quantity: 1, status: 'Denied', showId: '1' },
    ]);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const updateStatus = async (id: string, newStatus: 'Approved' | 'Denied') => {
        setProcessingId(id);
        // Simulate API call
        await new Promise(r => setTimeout(r, 600));
        
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        setProcessingId(null);
    };

    const handleEmailDraft = async (req: GuestRequest) => {
        alert(`Simulated: Gemini drafting email to ${req.name} regarding ${req.status} request.`);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Guest List</h1>
                    <p className="text-slate-400">Chicago, IL - United Center (Show ID: 1)</p>
                </div>
                <div className="bg-maestro-800 px-4 py-2 rounded-lg border border-maestro-700 text-sm text-slate-300">
                    <span className="text-slate-500 uppercase text-xs font-bold mr-2">Allocated</span>
                    <span className="text-white font-bold">14 / 50</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((req) => (
                    <div key={req.id} className="bg-maestro-800 p-5 rounded-xl border border-maestro-700 relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                            req.status === 'Approved' ? 'bg-green-500' :
                            req.status === 'Denied' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        
                        <div className="flex justify-between items-start mb-2 pl-2">
                            <div>
                                <h3 className="font-bold text-white text-lg">{req.name}</h3>
                                <p className="text-sm text-slate-400">{req.affiliation}</p>
                            </div>
                            <span className="bg-maestro-900 text-white font-mono px-2 py-1 rounded text-xs border border-maestro-700">
                                +{req.quantity}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pl-2">
                            <div className="flex gap-2">
                                {req.status === 'Pending' ? (
                                    <>
                                        <button 
                                            onClick={() => updateStatus(req.id, 'Approved')}
                                            disabled={!!processingId}
                                            className="p-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500 hover:text-white transition-colors"
                                            title="Approve"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(req.id, 'Denied')}
                                            disabled={!!processingId}
                                            className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
                                            title="Deny"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <span className={`text-sm font-bold ${req.status === 'Approved' ? 'text-green-500' : 'text-red-500'}`}>
                                        {req.status}
                                    </span>
                                )}
                            </div>
                            
                            <button onClick={() => handleEmailDraft(req)} className="text-slate-500 hover:text-maestro-accent">
                                <MessageSquare className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {processingId === req.id && (
                            <div className="absolute inset-0 bg-maestro-900/80 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
