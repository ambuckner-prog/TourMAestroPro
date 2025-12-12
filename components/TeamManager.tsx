
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';
import { Users, UserPlus, Mail, ShieldCheck } from 'lucide-react';

export const TeamManager: React.FC = () => {
  const { currentTour, users, addCrewToTour, currentUser } = useApp();
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!currentTour) return <div className="p-10 text-center text-slate-500">Please select or create a tour first.</div>;

  // Security check - Read Only for Crew
  const isReadOnly = currentUser?.role === UserRole.CREW;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(isReadOnly) return;
    const result = addCrewToTour(newEmail);
    if(result.success) {
        setMsg({ type: 'success', text: result.message });
        setNewEmail('');
    } else {
        setMsg({ type: 'error', text: result.message });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const tourCrew = users.filter(u => currentTour.crewIds.includes(u.id));
  const manager = users.find(u => u.id === currentTour.managerId);

  return (
    <div className="space-y-6">
        <header>
            <h1 className="text-3xl font-bold text-white">Team Management</h1>
            <p className="text-slate-400">Staffing for: <span className="text-white font-bold">{currentTour.name}</span></p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Staff Form - Only for Managers */}
            {!isReadOnly && (
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 h-fit">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-maestro-accent" /> Add Staff
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">Enter the email address of a registered user to add them to this tour's crew list.</p>
                    
                    <form onSubmit={handleAdd} className="space-y-4">
                        <input 
                            type="email" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="user@email.com"
                            className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded-lg text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                        />
                        <button type="submit" className="w-full bg-maestro-accent hover:bg-violet-600 text-white font-bold py-2 rounded-lg transition-colors">
                            Assign to Tour
                        </button>
                    </form>
                    {msg && (
                        <div className={`mt-4 p-3 rounded text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {msg.text}
                        </div>
                    )}
                </div>
            )}

            {/* Crew List */}
            <div className="lg:col-span-2 bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                <div className="p-4 bg-maestro-900 border-b border-maestro-700 flex items-center gap-2 font-bold text-white">
                    <Users className="w-4 h-4" /> Active Roster
                </div>
                <div className="divide-y divide-maestro-700">
                    {/* Manager Row */}
                    {manager && (
                        <div className="p-4 flex items-center justify-between bg-maestro-900/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-maestro-accent flex items-center justify-center text-white font-bold">
                                    {manager.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{manager.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {manager.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-maestro-gold" />
                                <span className="text-xs font-bold text-maestro-gold uppercase">Tour Manager</span>
                            </div>
                        </div>
                    )}

                    {/* Crew Rows */}
                    {tourCrew.length > 0 ? tourCrew.map(crew => (
                        <div key={crew.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                                    {crew.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{crew.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {crew.email}
                                    </div>
                                </div>
                            </div>
                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs uppercase font-bold">
                                Crew / Staff
                            </span>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-500 italic">
                            No crew members assigned yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
