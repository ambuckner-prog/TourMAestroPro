
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { HardDrive, Settings, Database, Shield, AlertTriangle, Save, RefreshCw, Download, Upload, History } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { currentTour, updateTour, resetToDefaults, storageUsage, exportDatabase, importDatabase } = useApp();
    const [formState, setFormState] = useState({ name: '', artist: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentTour) {
            setFormState({ name: currentTour.name, artist: currentTour.artist });
        }
    }, [currentTour]);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (window.confirm("WARNING: Restoring a backup will overwrite all current tour data. Proceed?")) {
                const res = await importDatabase(file);
                alert(res.message);
                if (res.success) window.location.reload();
            }
        }
    };

    if (!currentTour) return null;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-maestro-gold" /> Workspace Settings
                </h1>
                <p className="text-slate-400">Database health and tour configurations</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* BACKUP & RESTORE */}
                <div className="bg-maestro-800 p-8 rounded-xl border border-maestro-700 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><History className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Security & Backup</h3>
                            <p className="text-xs text-slate-400">Export your entire database</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400 mb-4">Always keep a physical copy of your tour data. Our cloud simulation syncs hourly, but physical backups are absolute.</p>
                        <div className="flex gap-4">
                            <button onClick={exportDatabase} className="flex-1 bg-maestro-700 hover:bg-maestro-600 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Export JSON
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 border border-maestro-700 hover:bg-white/5 text-slate-300 p-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                <Upload className="w-4 h-4" /> Restore Image
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                        </div>
                    </div>
                </div>

                <div className="bg-maestro-800 p-8 rounded-xl border border-maestro-700 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><HardDrive className="w-6 h-6" /></div>
                            <h3 className="text-lg font-bold text-white">Storage Health</h3>
                        </div>
                        <div className="text-2xl font-bold text-white">{storageUsage.toFixed(1)}%</div>
                    </div>
                    <div className="w-full bg-maestro-900 h-4 rounded-full overflow-hidden border border-maestro-700">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${storageUsage}%` }}></div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-maestro-700">
                        <button onClick={resetToDefaults} className="w-full text-red-400 hover:text-red-300 flex items-center justify-center gap-2 text-xs uppercase font-bold tracking-widest">
                            <RefreshCw className="w-3 h-3" /> Factory Reset App
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
