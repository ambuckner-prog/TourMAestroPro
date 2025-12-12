
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { HardDrive, Settings, Users, Database, Shield, AlertTriangle, Save, RefreshCw, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { currentTour, updateTour, resetToDefaults } = useApp();
    const [formState, setFormState] = useState({ name: '', artist: '' });
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (currentTour) {
            setFormState({ name: currentTour.name, artist: currentTour.artist });
            setIsDirty(false);
        }
    }, [currentTour]);

    if (!currentTour) return null;

    const handleSave = () => {
        updateTour(currentTour.id, formState);
        setIsDirty(false);
        alert("Tour configuration saved successfully.");
    };

    const handleChange = (field: 'name' | 'artist', value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    // Calculate Storage Stats
    // Convert to GB for display
    const usedGB = (currentTour.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
    const totalGB = (currentTour.storageLimit / (1024 * 1024 * 1024)).toFixed(0);
    const usagePercent = Math.min((currentTour.storageUsed / currentTour.storageLimit) * 100, 100);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-maestro-gold" /> Back Office
                </h1>
                <p className="text-slate-400">Workspace Settings for <span className="font-bold text-white">{currentTour.name}</span></p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Storage Quota Card */}
                <div className="bg-maestro-800 p-8 rounded-xl border border-maestro-700 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                <HardDrive className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Workspace Storage</h3>
                                <p className="text-xs text-slate-400">Shared files, assets, and backups</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{usedGB} <span className="text-sm text-slate-500">/ {totalGB} GB</span></div>
                    </div>

                    <div className="w-full bg-maestro-900 h-4 rounded-full overflow-hidden border border-maestro-700 mb-2">
                        <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                                usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{usagePercent.toFixed(1)}% Used</span>
                        {usagePercent > 90 && <span className="text-red-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Space Low</span>}
                    </div>

                    <div className="mt-8 pt-6 border-t border-maestro-700 grid grid-cols-2 gap-4">
                        <div className="bg-maestro-900 p-3 rounded-lg">
                            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Asset Library</div>
                            <div className="text-white font-mono text-sm">Creative Studio</div>
                        </div>
                        <div className="bg-maestro-900 p-3 rounded-lg">
                            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Attachments</div>
                            <div className="text-white font-mono text-sm">Notes & Riders</div>
                        </div>
                    </div>
                </div>

                {/* Tour Details Card */}
                <div className="bg-maestro-800 p-8 rounded-xl border border-maestro-700 shadow-lg relative">
                    {isDirty && (
                        <span className="absolute top-4 right-4 bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-600/50 flex items-center gap-1 animate-pulse">
                            Unsaved Changes
                        </span>
                    )}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-maestro-accent/10 rounded-lg text-maestro-accent">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Tour Configuration</h3>
                            <p className="text-xs text-slate-400">ID: {currentTour.id}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tour Name</label>
                            <input 
                                type="text" 
                                value={formState.name} 
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent focus:ring-1 focus:ring-maestro-accent" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Artist / Headliner</label>
                            <input 
                                type="text" 
                                value={formState.artist} 
                                onChange={(e) => handleChange('artist', e.target.value)}
                                className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-white outline-none focus:border-maestro-accent focus:ring-1 focus:ring-maestro-accent" 
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Staff Access</label>
                            <div className="w-full bg-maestro-900 border border-maestro-700 rounded p-3 text-slate-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                {currentTour.crewIds.length + 1} Authorized Users
                            </div>
                        </div>
                        
                        <div className="pt-4 mt-4 border-t border-maestro-700">
                             <button 
                                onClick={handleSave}
                                disabled={!isDirty}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                                    isDirty 
                                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                                    : 'bg-maestro-700 text-slate-500 cursor-not-allowed'
                                }`}
                             >
                                <Save className="w-4 h-4" /> Save Configuration
                             </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Database & Danger Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700">
                    <div className="flex items-center gap-2 mb-4 font-bold text-white">
                        <Database className="w-5 h-5 text-slate-400" /> Database Status
                    </div>
                    <div className="flex gap-8 text-sm text-slate-400">
                        <div>Status: <span className="text-green-400 font-bold">Healthy</span></div>
                        <div>Last Backup: <span className="text-white">Just now</span></div>
                        <div>Encryption: <span className="text-white">AES-256 (Simulated)</span></div>
                    </div>
                </div>
                
                <div className="bg-red-900/10 p-6 rounded-xl border border-red-900/30">
                     <div className="flex items-center gap-2 mb-4 font-bold text-red-400">
                        <AlertTriangle className="w-5 h-5" /> Danger Zone
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-red-300/70 max-w-[200px]">
                            Resetting will clear all local data, logs, and settings, returning the app to its initial demo state.
                        </p>
                        <button 
                            onClick={resetToDefaults}
                            className="bg-red-900/30 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-500/30 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Restore Factory Defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
