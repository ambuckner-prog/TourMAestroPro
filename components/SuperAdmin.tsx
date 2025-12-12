
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Shield, Users, Globe, Settings, AlertTriangle, CheckCircle, XCircle, LogIn, Mail, Server, Eye, Search, Lock } from 'lucide-react';
import { UserRole } from '../types';

export const SuperAdmin: React.FC = () => {
  const { users, tours, getAllSystemStats, updateUserRole, currentUser, approveUser, rejectUser, impersonateUser } = useApp();
  const stats = getAllSystemStats();
  
  const [activeTab, setActiveTab] = useState<'USERS' | 'TOURS' | 'SYSTEM'>('USERS');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // STRICT ACCESS CONTROL
  if (currentUser?.email !== 'ambuckner@gmail.com') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-maestro-900 text-center p-8">
              <div className="bg-red-900/20 p-6 rounded-full mb-6 border-2 border-red-600">
                  <Lock className="w-16 h-16 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Restricted Access</h1>
              <p className="text-slate-400 max-w-md">
                  This area is the <strong>Back Office Society System</strong> and is exclusively restricted to the Master Account (AM Buckner).
              </p>
          </div>
      );
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const filteredUsers = users.filter(u => 
      u.status === 'APPROVED' && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole(userId, newRole as UserRole);
    setEditingUserId(null);
  };

  const handleApprove = (userId: string, userName: string) => {
      if(window.confirm(`Approve access for ${userName}? This will trigger the automated Welcome Email.`)) {
        approveUser(userId);
      }
  };

  const handleImpersonate = (user: any) => {
      if(window.confirm(`Are you sure you want to login as ${user.name}? You will see exactly what they see to assist them.`)) {
          impersonateUser(user.id);
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col p-6 overflow-y-auto">
        <header className="flex justify-between items-center bg-maestro-800 p-6 rounded-xl border border-maestro-700">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="text-red-500 w-8 h-8" /> Back Office Society System
                </h1>
                <p className="text-slate-400">Master Level Control & Role Assignment</p>
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
                 <div className="px-4 py-2 bg-yellow-900/20 rounded-lg border border-yellow-900/50">
                     <span className="block text-xs text-yellow-500 uppercase font-bold">Pending</span>
                     <span className="text-xl font-bold text-yellow-400">{stats.pendingUsers}</span>
                 </div>
            </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-maestro-700 pb-1">
            <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'USERS' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500 hover:text-white'}`}>
                <Users className="w-4 h-4" /> Role Assignment
            </button>
            <button onClick={() => setActiveTab('TOURS')} className={`px-4 py-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'TOURS' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500 hover:text-white'}`}>
                <Globe className="w-4 h-4" /> Global Oversight
            </button>
            <button onClick={() => setActiveTab('SYSTEM')} className={`px-4 py-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'SYSTEM' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500 hover:text-white'}`}>
                <Settings className="w-4 h-4" /> Infrastructure
            </button>
        </div>

        {/* === USERS TAB === */}
        {activeTab === 'USERS' && (
            <div className="space-y-8 animate-fadeIn">
                {/* Pending Approvals */}
                {pendingUsers.length > 0 && (
                    <div className="bg-maestro-800 rounded-xl border border-yellow-600/50 overflow-hidden shadow-lg shadow-yellow-900/20">
                        <div className="p-4 bg-yellow-900/20 border-b border-yellow-600/30 flex items-center justify-between font-bold text-yellow-400">
                            <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Pending Registrations</div>
                            <span className="text-xs uppercase bg-yellow-900 px-2 py-1 rounded">Action Required</span>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-500 uppercase bg-maestro-900/50">
                                <tr>
                                    <th className="p-4">Applicant</th>
                                    <th className="p-4">Contact Info</th>
                                    <th className="p-4">Requested Role</th>
                                    <th className="p-4 text-right">Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-maestro-700 text-slate-300">
                                {pendingUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-maestro-700/50">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.jobTitle || 'No Title'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div>{u.email}</div>
                                            <div className="text-xs text-slate-500">{u.phone || 'No Phone'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs uppercase font-bold">{u.role}</span>
                                        </td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button onClick={() => rejectUser(u.id)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Decline
                                            </button>
                                            <button onClick={() => handleApprove(u.id, u.name)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-lg shadow-green-900/50">
                                                <CheckCircle className="w-3 h-3" /> Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Approved Users List */}
                <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                    <div className="p-4 bg-maestro-900 border-b border-maestro-700 flex items-center justify-between">
                         <div className="font-bold text-white flex items-center gap-2"><Users className="w-4 h-4" /> Society Member Database</div>
                         <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search users..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-maestro-800 border border-maestro-700 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:border-maestro-accent outline-none w-64"
                            />
                         </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-500 uppercase bg-maestro-900/50">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Assigned Level</th>
                                    <th className="p-4">Assigned Tours</th>
                                    <th className="p-4 text-right">Master Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-maestro-700 text-slate-300">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-maestro-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                            {u.phone && <div className="text-[10px] text-slate-600">{u.phone}</div>}
                                        </td>
                                        <td className="p-4">
                                             {editingUserId === u.id ? (
                                                <select 
                                                    autoFocus
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    onBlur={() => setEditingUserId(null)}
                                                    className="bg-maestro-900 text-white text-xs p-1 rounded border border-maestro-600 outline-none"
                                                >
                                                    {Object.values(UserRole).map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                                    u.role === UserRole.MASTER_ADMIN ? 'bg-red-900/50 text-red-200 border-red-500/30' :
                                                    u.role === UserRole.SUPPORT_STAFF ? 'bg-blue-900/50 text-blue-200 border-blue-500/30' :
                                                    u.role === UserRole.TOUR_MANAGER ? 'bg-maestro-accent/20 text-maestro-accent border-maestro-accent/30' :
                                                    'bg-slate-700 text-slate-300 border-slate-600'
                                                }`}>
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {u.assignedTourIds.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {u.assignedTourIds.map(tid => {
                                                        const tour = tours.find(t => t.id === tid);
                                                        return tour ? (
                                                            <span key={tid} className="text-[10px] bg-maestro-900 border border-maestro-700 px-2 py-1 rounded text-slate-400">
                                                                {tour.name}
                                                            </span>
                                                        ) : null
                                                    })}
                                                </div>
                                            ) : <span className="text-slate-600 text-xs italic">No tours assigned</span>}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            {u.id !== currentUser?.id && (
                                                <button 
                                                    onClick={() => handleImpersonate(u)}
                                                    className="p-2 bg-maestro-700 hover:bg-maestro-600 text-white rounded text-xs font-bold flex items-center gap-2"
                                                    title="Login as this user to assist"
                                                >
                                                    <LogIn className="w-3 h-3" /> Login As
                                                </button>
                                            )}
                                            {u.id !== currentUser?.id && (
                                                <button 
                                                    onClick={() => setEditingUserId(u.id)}
                                                    className="p-2 text-slate-500 hover:text-white"
                                                    title="Assign Level"
                                                >
                                                    <Settings className="w-3 h-3" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* === TOURS TAB === */}
        {activeTab === 'TOURS' && (
            <div className="bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden animate-fadeIn">
                <div className="p-4 bg-maestro-900 border-b border-maestro-700 flex items-center gap-2 font-bold text-white">
                    <Globe className="w-4 h-4" /> Global Tour Oversight
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-slate-500 uppercase bg-maestro-900/50">
                        <tr>
                            <th className="p-4">Tour Name</th>
                            <th className="p-4">Artist</th>
                            <th className="p-4">Manager</th>
                            <th className="p-4">Crew Count</th>
                            <th className="p-4">Storage</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-maestro-700 text-slate-300">
                        {tours.map(t => {
                            const manager = users.find(u => u.id === t.managerId);
                            const usage = (t.storageUsed / (1024*1024*1024)).toFixed(2);
                            return (
                                <tr key={t.id} className="hover:bg-maestro-700/50">
                                    <td className="p-4 font-bold text-white">{t.name}</td>
                                    <td className="p-4">{t.artist}</td>
                                    <td className="p-4 text-xs">
                                        {manager ? (
                                            <div>
                                                <div className="font-bold text-slate-200">{manager.name}</div>
                                                <div className="text-slate-500">{manager.email}</div>
                                            </div>
                                        ) : 'Unassigned'}
                                    </td>
                                    <td className="p-4 text-center">{t.crewIds.length + 1}</td>
                                    <td className="p-4">
                                        <div className="w-24 bg-maestro-900 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: `${(t.storageUsed / t.storageLimit)*100}%` }}></div>
                                        </div>
                                        <div className="text-[10px] mt-1 text-slate-500">{usage} GB used</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-xs border border-maestro-600 px-3 py-1 rounded hover:bg-white/5 flex items-center gap-2 ml-auto">
                                            <Eye className="w-3 h-3" /> Inspect
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}

        {/* === SYSTEM CONFIG TAB === */}
        {activeTab === 'SYSTEM' && (
             <div className="space-y-6 animate-fadeIn">
                 <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-maestro-gold" /> Email Infrastructure Setup
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        To enable live emails from a personalized address (e.g., <code>welcome@tourmaestro.com</code>), 
                        configure your SMTP provider below. Currently running in <strong>Simulation Mode</strong>.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">SMTP Host</label>
                            <div className="relative mt-1">
                                <Server className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input type="text" disabled placeholder="smtp.sendgrid.net" className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-slate-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">SMTP Port</label>
                             <input type="text" disabled placeholder="587" className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 mt-1 text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Username / API Key</label>
                             <input type="password" disabled value="*****************" className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 mt-1 text-slate-500 cursor-not-allowed" />
                        </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Sender Identity</label>
                             <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input type="text" disabled placeholder="welcome@tourmaestro.com" className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 pl-10 text-slate-500 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
        )}
    </div>
  );
};
