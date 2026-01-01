
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Shield, Users, Globe, Settings, AlertTriangle, CheckCircle, XCircle, LogIn, Mail, Server, Eye, Search, Lock, Play, Activity, ToggleLeft, ToggleRight, RefreshCw, ClipboardList, Plus, Trash2, User, FileText, Download, Ban, MessageSquare, UserPlus, ChevronDown, Database, FileJson, Key, Fingerprint, Radar, Scan, Layout, KeyRound, AlertCircle, X } from 'lucide-react';
import { UserRole, Note, User as UserType, EmailSystemStatus } from '../types';

export const SuperAdmin: React.FC = () => {
  const { users, tours, getAllSystemStats, updateUserRole, updateUserStatus, createUser, currentUser, approveUser, rejectUser, deleteUser, impersonateUser, forceUserPasswordReset, emailLogs, loginLogs, emailSystemStatus, setEmailSystemStatus, sendTestEmail, notes, addNote, deleteNote, exportDatabase, hotels, tourDates, masterSongs, securityLogs, triggerSecurityScan, isScanning, advanceTemplates } = useApp();
  const stats = getAllSystemStats();
  
  const [activeTab, setActiveTab] = useState<'USERS' | 'SECURITY' | 'DATABASE' | 'COMMUNICATION' | 'AUDIT'>('USERS');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // User Detail Modal State
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'BLOCKED'>('ALL');
  const [temporaryResetPassword, setTemporaryResetPassword] = useState<string | null>(null);

  // Manual User Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ 
    name: '', 
    email: '', 
    role: UserRole.TOUR_MANAGER, 
    jobTitle: '', 
    phone: '', 
    password: 'password123' 
  });

  // STRICT ACCESS CONTROL
  if (currentUser?.email !== 'ambuckner@gmail.com') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-maestro-900 text-center p-8">
              <div className="bg-red-900/20 p-6 rounded-full mb-6 border-2 border-red-600">
                  <Lock className="w-16 h-16 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Restricted Access</h1>
              <p className="text-slate-400 max-w-md">
                  This area is the <strong>Back Office Society System</strong> and is exclusively restricted to the Master Account.
              </p>
          </div>
      );
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  
  const filteredUsers = users.filter(u => {
      const matchesSearch = (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = userStatusFilter === 'ALL' || u.status === userStatusFilter;
      return matchesSearch && matchesFilter;
  });

  const handleForceReset = async (userId: string) => {
      if (window.confirm("FORCE RESET: This will instantly change this user's password and bypass email recovery. Proceed?")) {
          const newPwd = await forceUserPasswordReset(userId);
          setTemporaryResetPassword(newPwd);
      }
  };

  const handleApprove = (userId: string) => {
      approveUser(userId);
      alert("Account Approved.");
  };
  
  const handleReject = (userId: string, userName: string) => {
      if(window.confirm(`Decline access for ${userName}? They will receive a rejection email.`)) {
        rejectUser(userId);
      }
  };

  const handleImpersonate = (user: any) => {
      if(window.confirm(`Security Alert: You are about to login as ${user.name}.\n\nYou will see their specific dashboard and tours.\n\nProceed?`)) {
          impersonateUser(user.id);
      }
  };

  const handleManualCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newUserForm.email || !newUserForm.name) {
          alert("Name and Email are required.");
          return;
      }
      createUser(newUserForm);
      setIsCreateModalOpen(false);
      setNewUserForm({ name: '', email: '', role: UserRole.TOUR_MANAGER, jobTitle: '', phone: '', password: 'password123' });
      alert("User account created and auto-approved.");
  };

  const handleDownloadDatabase = () => {
      const json = exportDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tm_database_dump_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col p-6 overflow-y-auto relative">
        <header className="flex justify-between items-center bg-maestro-800 p-6 rounded-xl border border-maestro-700 shadow-xl">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="text-red-500 w-8 h-8" /> Master Dashboard
                </h1>
                <p className="text-slate-400">Back Office Society Control Suite</p>
            </div>
            <div className="flex gap-4 text-sm text-right">
                 <div className="px-4 py-2 bg-maestro-900 rounded-lg border border-maestro-700">
                     <span className="block text-xs text-slate-500 uppercase font-bold">Total Accounts</span>
                     <span className="text-xl font-bold text-white">{stats.totalUsers}</span>
                 </div>
                 <div className="px-4 py-2 bg-maestro-900 rounded-lg border border-maestro-700">
                     <span className="block text-xs text-slate-500 uppercase font-bold">Active Tours</span>
                     <span className="text-xl font-bold text-white">{stats.totalTours}</span>
                 </div>
                 <div className={`px-4 py-2 rounded-lg border ${stats.pendingUsers > 0 ? 'bg-yellow-900/20 border-yellow-900/50 animate-pulse' : 'bg-maestro-900 border-maestro-700'}`}>
                     <span className={`block text-xs uppercase font-bold ${stats.pendingUsers > 0 ? 'text-yellow-500' : 'text-slate-500'}`}>Pending</span>
                     <span className={`text-xl font-bold ${stats.pendingUsers > 0 ? 'text-yellow-400' : 'text-white'}`}>{stats.pendingUsers}</span>
                 </div>
            </div>
        </header>

        {/* Create Member Modal Overlay */}
        {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="bg-maestro-800 border border-maestro-accent/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                    <div className="p-6 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-maestro-accent" /> Create New Society Member
                        </h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
                    </div>
                    <form onSubmit={handleManualCreate} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                                <input required type="text" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none focus:border-maestro-accent" placeholder="John Doe" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                                <input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none focus:border-maestro-accent" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">System Role</label>
                                <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none">
                                    <option value={UserRole.TOUR_MANAGER}>Tour Manager</option>
                                    <option value={UserRole.CREW}>Crew / Staff</option>
                                    <option value={UserRole.SUPPORT_STAFF}>Support Staff</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Job Title</label>
                                <input type="text" value={newUserForm.jobTitle} onChange={e => setNewUserForm({...newUserForm, jobTitle: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white outline-none" placeholder="Production Lead" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Temporary Password</label>
                            <input type="text" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white font-mono outline-none" />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-3 text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 bg-maestro-accent hover:bg-violet-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/40">
                                Create Account
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <div className="flex gap-4 border-b border-maestro-700 pb-1 overflow-x-auto">
            <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 font-bold text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'USERS' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500 hover:text-white'}`}>
                <Users className="w-4 h-4" /> Role Assignment
            </button>
            <button onClick={() => setActiveTab('DATABASE')} className={`px-4 py-2 font-bold text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'DATABASE' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500 hover:text-white'}`}>
                <Database className="w-4 h-4" /> Database
            </button>
        </div>

        {activeTab === 'USERS' && (
            <div className="space-y-8 animate-fadeIn">
                {/* Pending Approvals Table */}
                {pendingUsers.length > 0 && (
                    <div className="bg-maestro-800 rounded-xl border border-yellow-600/50 overflow-hidden shadow-lg shadow-yellow-900/20">
                        <div className="p-4 bg-yellow-600/10 border-b border-yellow-600/30 flex items-center justify-between">
                            <h3 className="font-bold text-yellow-500 flex items-center gap-2 uppercase tracking-wider text-xs">
                                <AlertCircle className="w-4 h-4" /> Priority Approval Queue
                            </h3>
                            <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingUsers.length} Pending</span>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-maestro-900 text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-maestro-700 text-slate-300">
                                {pendingUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-maestro-700/50">
                                        <td className="p-4"><div className="font-bold text-white">{u.name}</div></td>
                                        <td className="p-4"><div>{u.email}</div></td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button onClick={() => handleReject(u.id, u.name)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded text-xs font-bold transition-colors">Decline</button>
                                            <button onClick={() => handleApprove(u.id)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-lg shadow-green-900/20">Approve</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Main Member Table */}
                <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden shadow-2xl">
                    <div className="p-4 bg-maestro-900 border-b border-maestro-700 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="font-bold text-white flex items-center gap-2">
                             <Users className="w-4 h-4 text-maestro-accent" /> Society Member Database
                             <button onClick={() => setIsCreateModalOpen(true)} className="ml-4 bg-maestro-700 hover:bg-maestro-accent text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-maestro-600 transition-all">
                                <Plus className="w-3 h-3" /> Add Member
                             </button>
                         </div>
                         <div className="flex gap-4 items-center">
                            <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value as any)} className="bg-maestro-800 border border-maestro-700 text-xs text-slate-300 p-2 rounded-lg outline-none">
                                <option value="ALL">All Status</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PENDING">Pending</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-maestro-800 border border-maestro-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-maestro-accent outline-none"
                                />
                            </div>
                         </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-maestro-900/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-4">User Details</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">System Role</th>
                                    <th className="p-4">Assignments</th>
                                    <th className="p-4 text-right">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-maestro-700 text-slate-300">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-maestro-700/50 transition-colors">
                                        <td className="p-4"><div className="font-bold text-white">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                                                u.status === 'APPROVED' ? 'bg-green-900/20 text-green-400 border-green-900/30' : 
                                                u.status === 'PENDING' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="p-4"><span className="text-xs font-mono">{u.role.replace('_', ' ')}</span></td>
                                        <td className="p-4 text-xs">{u.assignedTourIds.length} Tours</td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleForceReset(u.id)}
                                                className="bg-orange-900/20 hover:bg-orange-900/40 text-orange-400 p-2 rounded-lg transition-colors"
                                                title="Emergency Password Reset"
                                            >
                                                <KeyRound className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleImpersonate(u)}
                                                className="bg-maestro-900 hover:bg-maestro-700 text-maestro-accent p-2 rounded-lg transition-colors border border-maestro-700"
                                                title="Impersonate User"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => { if(window.confirm('PERMANENTLY delete user?')) deleteUser(u.id); }}
                                                className="bg-red-900/10 hover:bg-red-900/30 text-red-500 p-2 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Force Reset UI Display */}
                {temporaryResetPassword && (
                    <div className="bg-orange-900/30 border border-orange-500/50 p-6 rounded-xl animate-bounce shadow-2xl">
                        <div className="flex items-center gap-3 text-orange-400 mb-2">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="font-bold text-lg uppercase tracking-wider">Emergency Reset Applied</h3>
                        </div>
                        <p className="text-slate-300 text-sm mb-4">Account password has been synchronized. Provide this one-time credential to the user:</p>
                        <div className="bg-maestro-900 p-4 rounded-xl border border-orange-500/30 flex items-center justify-between">
                            <span className="font-mono text-3xl text-white font-bold tracking-[0.2em]">{temporaryResetPassword}</span>
                            <button onClick={() => setTemporaryResetPassword(null)} className="text-slate-500 hover:text-white bg-maestro-800 px-3 py-1 rounded-lg text-sm transition-colors">Dismiss</button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* DATABASE TAB */}
        {activeTab === 'DATABASE' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                            <Database className="w-6 h-6 text-maestro-accent" /> Data Management Center
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Inspect persistent state. Use export for offline backups or system migration.
                        </p>
                    </div>
                    <button 
                        onClick={handleDownloadDatabase}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-green-900/20 transform hover:scale-105 transition-all"
                    >
                        <Download className="w-5 h-5" /> Export DB Snapshot (JSON)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-maestro-800 p-4 rounded-xl border border-maestro-700">
                        <div className="flex justify-between items-center mb-4 border-b border-maestro-700 pb-2">
                            <h4 className="font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" /> Tours</h4>
                            <span className="bg-maestro-900 text-[10px] text-slate-500 px-2 py-0.5 rounded-full uppercase font-bold">{tours.length} Records</span>
                        </div>
                        <div className="h-48 overflow-y-auto custom-scrollbar bg-maestro-900/50 p-3 rounded-lg text-[10px] font-mono text-slate-400 border border-maestro-700">
                            <pre>{JSON.stringify(tours, null, 2)}</pre>
                        </div>
                    </div>
                    
                    <div className="bg-maestro-800 p-4 rounded-xl border border-maestro-700">
                        <div className="flex justify-between items-center mb-4 border-b border-maestro-700 pb-2">
                            <h4 className="font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> User Entities</h4>
                            <span className="bg-maestro-900 text-[10px] text-slate-500 px-2 py-0.5 rounded-full uppercase font-bold">{users.length} Records</span>
                        </div>
                        <div className="h-48 overflow-y-auto custom-scrollbar bg-maestro-900/50 p-3 rounded-lg text-[10px] font-mono text-slate-400 border border-maestro-700">
                            <pre>{JSON.stringify(users.map(u => ({...u, password: 'HIDDEN'})), null, 2)}</pre>
                        </div>
                    </div>

                    <div className="bg-maestro-800 p-4 rounded-xl border border-maestro-700">
                        <div className="flex justify-between items-center mb-4 border-b border-maestro-700 pb-2">
                            <h4 className="font-bold text-white flex items-center gap-2"><Layout className="w-4 h-4 text-slate-400" /> Templates</h4>
                            <span className="bg-maestro-900 text-[10px] text-slate-500 px-2 py-0.5 rounded-full uppercase font-bold">{advanceTemplates.length} Records</span>
                        </div>
                        <div className="h-48 overflow-y-auto custom-scrollbar bg-maestro-900/50 p-3 rounded-lg text-[10px] font-mono text-slate-400 border border-maestro-700">
                            <pre>{JSON.stringify(advanceTemplates, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
