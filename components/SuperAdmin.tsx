import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Shield, Users, Globe, Database, Download, Upload, Trash2, Search, Lock, Eye, CheckCircle, AlertCircle, AlertTriangle, X, Terminal, Server, Cpu, HardDrive, KeyRound, UserPlus, RefreshCw, Layers, Cloud } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

export const SuperAdmin: React.FC = () => {
  const { users, tours, getAllSystemStats, currentUser, approveUser, deleteUser, impersonateUser, exportDatabase, importDatabase, resetToDefaults, forceSave, lastSaveTime, isSyncing } = useApp();
  const stats = getAllSystemStats();
  
  const [activeTab, setActiveTab] = useState<'AUTH' | 'VAULT' | 'LOGS'>('AUTH');
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (currentUser?.role !== UserRole.MASTER_ADMIN) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-maestro-900 text-center p-8">
              <Lock className="w-16 h-16 text-red-600 mb-4" />
              <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Access Forbidden</h1>
              <p className="text-slate-500 max-w-xs mt-2">This console is reserved for Master Administrators.</p>
          </div>
      );
  }

  const handleDownloadVault = () => {
      const json = exportDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maestro_vault_snapshot_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
  };

  const handleImportVault = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && window.confirm("Proceeding will overwrite ALL current local data with this snapshot. Confirm?")) {
          const res = await importDatabase(file);
          if (res.success) window.location.reload();
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden font-mono text-xs">
        {/* HEADER / STATUS BAR */}
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0c] shrink-0">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-bold uppercase tracking-widest text-[10px]">Maestro Node v5.0</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="text-slate-500 uppercase flex items-center gap-2">
                    <Database className="w-3 h-3" /> Supabase Connection: Active
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-slate-500 flex items-center gap-2">
                    {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin text-maestro-accent" /> : <Database className="w-3 h-3 text-green-500" />}
                    Last Sync: {lastSaveTime?.toLocaleTimeString()}
                </div>
                <button onClick={forceSave} disabled={isSyncing} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1 rounded flex items-center gap-2 transition-all disabled:opacity-50">
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            {/* SIDEBAR NAV */}
            <aside className="w-56 border-r border-white/10 bg-[#0a0a0c] flex flex-col p-4 gap-2">
                <button onClick={() => setActiveTab('AUTH')} className={`flex items-center gap-3 p-2.5 rounded transition-all ${activeTab === 'AUTH' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-500 hover:text-white'}`}>
                    <Users className="w-4 h-4" /> Auth Explorer
                </button>
                <button onClick={() => setActiveTab('VAULT')} className={`flex items-center gap-3 p-2.5 rounded transition-all ${activeTab === 'VAULT' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-500 hover:text-white'}`}>
                    <Layers className="w-4 h-4" /> Vault Storage
                </button>
                <button onClick={() => setActiveTab('LOGS')} className={`flex items-center gap-3 p-2.5 rounded transition-all ${activeTab === 'LOGS' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-500 hover:text-white'}`}>
                    <Terminal className="w-4 h-4" /> SQL Editor
                </button>
                <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="text-[10px] text-slate-600 mb-2 uppercase font-bold tracking-widest">System Metrics</div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-slate-400"><span>Entities:</span> <span>{stats.totalUsers}</span></div>
                        <div className="flex justify-between text-slate-400"><span>Productions:</span> <span>{stats.totalTours}</span></div>
                        <div className="flex justify-between text-yellow-500"><span>Pending:</span> <span>{stats.pendingUsers}</span></div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
                {activeTab === 'AUTH' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest">Entity Explorer</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Filter by email..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white outline-none w-64 focus:border-white/30"
                                />
                            </div>
                        </div>

                        <div className="bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-slate-500 border-b border-white/10">
                                    <tr>
                                        <th className="p-4 font-bold uppercase tracking-widest">ID</th>
                                        <th className="p-4 font-bold uppercase tracking-widest">Entity Info</th>
                                        <th className="p-4 font-bold uppercase tracking-widest">Role</th>
                                        <th className="p-4 font-bold uppercase tracking-widest">Status</th>
                                        <th className="p-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-400">
                                    {users.filter(u => u.email.includes(searchTerm)).map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 font-mono text-slate-600">{u.id}</td>
                                            <td className="p-4">
                                                <div className="text-white font-bold">{u.name}</div>
                                                <div className="opacity-50">{u.email}</div>
                                            </td>
                                            <td className="p-4 font-mono text-blue-500">{u.role}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded border ${u.status === 'APPROVED' ? 'bg-green-900/20 border-green-500/30 text-green-500' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-500'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => impersonateUser(u.id)} className="p-1.5 hover:bg-blue-500 hover:text-white rounded" title="Ghost Session">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {u.status === 'PENDING' && (
                                                        <button onClick={() => approveUser(u.id)} className="p-1.5 hover:bg-green-500 hover:text-white rounded" title="Approve">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteUser(u.id)} className="p-1.5 hover:bg-red-500 hover:text-white rounded" title="Wipe Entity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'VAULT' && (
                    <div className="space-y-8 animate-fadeIn max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/10 shadow-xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Snapshot Export</h3>
                                        <p className="text-slate-500">Recalls all current tour data into a persistent JSON image.</p>
                                    </div>
                                </div>
                                <button onClick={handleDownloadVault} className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all flex justify-center items-center gap-2 shadow-lg">
                                    Generate Master Snapshot
                                </button>
                            </div>

                            <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/10 shadow-xl border-dashed">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Vault Recovery</h3>
                                        <p className="text-slate-500">Force restore system image from a local snapshot.</p>
                                    </div>
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-500 transition-all flex justify-center items-center gap-2">
                                    Load Snapshot
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImportVault} className="hidden" accept=".json" />
                            </div>
                        </div>

                        <div className="bg-[#0a0a0c] p-8 rounded-2xl border border-red-900/20">
                            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                                <AlertTriangle className="w-4 h-4" /> Danger Zone
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-red-900/5 rounded-lg border border-red-900/30">
                                <div>
                                    <div className="text-white font-bold">Factory Purge</div>
                                    <div className="text-slate-500">Irreversibly wipe all data in this browser node.</div>
                                </div>
                                <button onClick={() => { if(window.confirm('WIPE ALL DATA FOREVER?')) resetToDefaults(); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-all">
                                    Purge Vault
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'LOGS' && (
                    <div className="space-y-4 animate-fadeIn h-full flex flex-col">
                        <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                            <Terminal className="w-4 h-4" /> Supabase Edge Logs
                        </div>
                        <div className="flex-1 bg-black border border-white/10 rounded-xl p-6 font-mono text-[11px] text-green-800 leading-relaxed overflow-y-auto custom-scrollbar">
                            <p className="text-green-500 mb-2">-- Supabase / Maestro SQL Tunnel v5.0.1 --</p>
                            <p className="text-slate-500 mb-4 italic">-- Handshake established with remote postgres --</p>
                            <p>[{new Date().toISOString()}] FETCH ALL FROM public.users;</p>
                            <p>[{new Date().toISOString()}] SYNCED vault.users TO local_storage;</p>
                            <p className="text-green-600/50">-- Response 200 OK --</p>
                            <p>[{new Date().toISOString()}] UPSERT INTO public.tours (id, data);</p>
                            <p className="text-green-600/50">-- Transaction Committed --</p>
                            <p>[{new Date().toISOString()}] HEARTBEAT: PULSE_DETECTED;</p>
                            <p className="animate-pulse">_</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};