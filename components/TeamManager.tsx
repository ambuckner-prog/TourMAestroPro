
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole, User, UserDocument } from '../types';
import { Users, UserPlus, Mail, ShieldCheck, User as UserIcon, FileText, X, Save, AlertCircle, Plane, Briefcase, Plus, Trash2, Calendar, MapPin, Flag, Utensils, Shirt } from 'lucide-react';

export const TeamManager: React.FC = () => {
  const { currentTour, users, addCrewToTour, currentUser, updateUserProfile, addUserDocument, removeUserDocument } = useApp();
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Profile Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'TRAVEL' | 'DOCS'>('GENERAL');
  
  // Edit Form State (Mirrors selected user for editing)
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  
  // Document Upload State
  const [newDocType, setNewDocType] = useState<UserDocument['type']>('Passport');

  if (!currentTour) return <div className="p-10 text-center text-slate-500">Please select or create a tour first.</div>;

  // Security check - Read Only for Crew (unless viewing own profile)
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

  const openProfile = (user: User) => {
      // Permission check: Crew can only open their own profile
      if (currentUser?.role === UserRole.CREW && currentUser.id !== user.id) {
          alert("Access Restricted: Crew members can only view their own profile.");
          return;
      }
      setSelectedUser(user);
      setProfileForm({ ...user });
      setActiveTab('GENERAL');
  };

  const handleSaveProfile = () => {
      if (selectedUser) {
          updateUserProfile(selectedUser.id, profileForm);
          // Update local selected user to reflect changes immediately in UI
          setSelectedUser({ ...selectedUser, ...profileForm });
          // Optional: Close modal
          // setSelectedUser(null);
      }
  };

  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && selectedUser) {
          const file = e.target.files[0];
          
          // Use FileReader to create a persistent Base64 string instead of a temporary blob URL
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              
              const newDoc: UserDocument = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: file.name,
                  type: newDocType,
                  url: base64, // Persistent Storage
                  uploadedAt: new Date().toISOString()
              };
              
              addUserDocument(selectedUser.id, newDoc);
              // Update local state to show new doc immediately
              setSelectedUser(prev => prev ? ({ ...prev, documents: [...(prev.documents || []), newDoc] }) : null);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteDocument = (docId: string) => {
      if (selectedUser) {
          if(window.confirm("Remove this document?")) {
              removeUserDocument(selectedUser.id, docId);
              // Update local state
              setSelectedUser(prev => prev ? ({ ...prev, documents: (prev.documents || []).filter(d => d.id !== docId) }) : null);
          }
      }
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
                        <div 
                            onClick={() => openProfile(manager)}
                            className="p-4 flex items-center justify-between bg-maestro-900/30 hover:bg-maestro-700/50 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-maestro-accent flex items-center justify-center text-white font-bold">
                                    {manager.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover:text-maestro-accent transition-colors">{manager.name}</div>
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
                        <div 
                            key={crew.id} 
                            onClick={() => openProfile(crew)}
                            className="p-4 flex items-center justify-between hover:bg-maestro-700/50 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                                    {crew.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover:text-maestro-accent transition-colors">{crew.name}</div>
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

        {/* CREW PROFILE MODAL */}
        {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                <div className="bg-maestro-800 border border-maestro-accent/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-6 bg-maestro-900 border-b border-maestro-700 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                                <p className="text-sm text-slate-400">{selectedUser.jobTitle || 'Crew Member'} • {selectedUser.email}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex border-b border-maestro-700 bg-maestro-800 shrink-0">
                        <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'GENERAL' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                            <UserIcon className="w-4 h-4" /> General Info
                        </button>
                        <button onClick={() => setActiveTab('TRAVEL')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'TRAVEL' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                            <Plane className="w-4 h-4" /> Travel & Personal
                        </button>
                        <button onClick={() => setActiveTab('DOCS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'DOCS' ? 'text-white border-b-2 border-maestro-accent bg-white/5' : 'text-slate-400 hover:text-white'}`}>
                            <FileText className="w-4 h-4" /> Documents
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-maestro-800">
                        
                        {/* GENERAL TAB */}
                        {activeTab === 'GENERAL' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Full Name</label>
                                        <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Job Title</label>
                                        <input type="text" value={profileForm.jobTitle || ''} onChange={e => setProfileForm({...profileForm, jobTitle: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone</label>
                                        <input type="text" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Address</label>
                                        <input type="text" value={profileForm.address || ''} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" placeholder="Street Address" />
                                    </div>
                                    <div className="md:col-span-2 flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">City/State/Zip</label>
                                            <input type="text" value={profileForm.cityStateZip || ''} onChange={e => setProfileForm({...profileForm, cityStateZip: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Country</label>
                                            <input type="text" value={profileForm.country || ''} onChange={e => setProfileForm({...profileForm, country: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-maestro-700 pt-6">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /> Emergency Contact</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Name</label>
                                            <input type="text" value={profileForm.emergencyContactName || ''} onChange={e => setProfileForm({...profileForm, emergencyContactName: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none focus:border-maestro-accent" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone</label>
                                            <input type="text" value={profileForm.emergencyContactPhone || ''} onChange={e => setProfileForm({...profileForm, emergencyContactPhone: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none focus:border-maestro-accent" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Relationship</label>
                                            <input type="text" value={profileForm.emergencyContactRelation || ''} onChange={e => setProfileForm({...profileForm, emergencyContactRelation: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none focus:border-maestro-accent" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TRAVEL TAB */}
                        {activeTab === 'TRAVEL' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-maestro-900/50 rounded-lg border border-maestro-700">
                                        <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Flag className="w-4 h-4 text-blue-400" /> Citizenship & Passport</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Citizenship</label>
                                                <input type="text" value={profileForm.citizenship || ''} onChange={e => setProfileForm({...profileForm, citizenship: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Passport Number</label>
                                                <input type="text" value={profileForm.passportNumber || ''} onChange={e => setProfileForm({...profileForm, passportNumber: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none font-mono" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Expiration Date</label>
                                                <input type="date" value={profileForm.passportExpiry || ''} onChange={e => setProfileForm({...profileForm, passportExpiry: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Birth Date</label>
                                                <input type="date" value={profileForm.birthDate || ''} onChange={e => setProfileForm({...profileForm, birthDate: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-4 bg-maestro-900/50 rounded-lg border border-maestro-700">
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Plane className="w-4 h-4 text-green-400" /> Travel Preferences</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Frequent Flyer #</label>
                                                    <input type="text" value={profileForm.frequentFlyer || ''} onChange={e => setProfileForm({...profileForm, frequentFlyer: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Seating Preference</label>
                                                    <select value={profileForm.seatingPreference || 'Aisle'} onChange={e => setProfileForm({...profileForm, seatingPreference: e.target.value as any})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none">
                                                        <option value="Aisle">Aisle</option>
                                                        <option value="Window">Window</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-maestro-900/50 rounded-lg border border-maestro-700">
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Utensils className="w-4 h-4 text-maestro-gold" /> Personal</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Dietary Restrictions</label>
                                                    <input type="text" value={profileForm.dietaryRestrictions || ''} onChange={e => setProfileForm({...profileForm, dietaryRestrictions: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none" placeholder="e.g. Vegetarian, Gluten Free" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1"><Shirt className="w-3 h-3" /> Shirt Size</label>
                                                    <select value={profileForm.shirtSize || 'L'} onChange={e => setProfileForm({...profileForm, shirtSize: e.target.value})} className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-sm text-white outline-none">
                                                        <option value="XS">XS</option>
                                                        <option value="S">S</option>
                                                        <option value="M">M</option>
                                                        <option value="L">L</option>
                                                        <option value="XL">XL</option>
                                                        <option value="XXL">XXL</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DOCUMENTS TAB */}
                        {activeTab === 'DOCS' && (
                            <div className="space-y-6">
                                <div className="bg-maestro-900/50 p-4 rounded-lg border border-maestro-700 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Support Documents</h4>
                                        <p className="text-xs text-slate-400">Upload scans of passports, visas, contracts, and IDs.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={newDocType}
                                            onChange={(e) => setNewDocType(e.target.value as any)}
                                            className="bg-maestro-800 border border-maestro-600 rounded p-2 text-xs text-white outline-none"
                                        >
                                            <option value="Passport">Passport</option>
                                            <option value="Visa">Visa</option>
                                            <option value="Contract">Contract</option>
                                            <option value="ID">Photo ID</option>
                                            <option value="Medical">Medical</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <div className="relative">
                                            <input type="file" onChange={handleUploadDocument} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <button className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 pointer-events-none">
                                                <Plus className="w-4 h-4" /> Upload
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedUser.documents && selectedUser.documents.length > 0 ? (
                                        selectedUser.documents.map(doc => (
                                            <div key={doc.id} className="bg-maestro-900 p-4 rounded-lg border border-maestro-700 flex flex-col justify-between group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${
                                                            doc.type === 'Passport' ? 'bg-blue-900/30 text-blue-400' :
                                                            doc.type === 'Visa' ? 'bg-purple-900/30 text-purple-400' :
                                                            'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm truncate w-32" title={doc.name}>{doc.name}</div>
                                                            <div className="text-[10px] text-slate-500 uppercase font-bold">{doc.type}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-maestro-800 flex justify-between items-center">
                                                    <span className="text-[10px] text-slate-600">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                    <a href={doc.url} download={doc.name} className="text-xs text-maestro-accent hover:text-white font-bold">Download</a>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed border-maestro-700 rounded-lg text-slate-500">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No documents uploaded.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-maestro-900 border-t border-maestro-700 flex justify-end gap-3 shrink-0">
                        <button onClick={() => setSelectedUser(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
                        <button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Profile
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
