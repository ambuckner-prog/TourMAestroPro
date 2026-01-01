import React, { useState } from 'react';
import { askSearch, analyzeImage } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
// Added missing User and Building imports
import { Upload, Search, FileText, Loader2, LinkIcon, Zap, Ruler, Users, Info, Phone, Save, Mail, MapPin, User, Building } from 'lucide-react';
import { GroundingChunk, TourDate } from '../types';

export const VenueIntel: React.FC = () => {
  const { addNote, currentTour, currentUser, tourDates, updateTourDate } = useApp();
  const [activeTab, setActiveTab] = useState<'search' | 'analyze' | 'directory'>('search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{text: string, chunks?: GroundingChunk[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Analyze State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzePrompt, setAnalyzePrompt] = useState(
    'Analyze this tech rider or stage plot image and extract:\n\n' +
    '1. ⚡ POWER: Voltage, Amps, Phases, Tie-in points.\n' +
    '2. 📏 DIMENSIONS: Stage Width/Depth, Trim Height.\n' +
    '3. ☎️ KEY CONTACTS: PM Name, Direct Phone, Email.'
  );
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Directory State
  const [selectedDateId, setSelectedDateId] = useState<string>(tourDates[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const activeDate = tourDates.find(d => d.id === selectedDateId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
        const result = await askSearch(searchQuery);
        setSearchResult({
            text: result.text || "",
            chunks: result.chunks ? (result.chunks as unknown as GroundingChunk[]) : undefined
        });
    } catch (e) { console.error(e); }
    finally { setIsSearching(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
        const text = await analyzeImage(selectedImage.split(',')[1], analyzePrompt);
        setAnalysisResult(text || "Could not analyze image.");
    } catch (e) { setAnalysisResult("Error analyzing image."); }
    finally { setIsAnalyzing(false); }
  };

  const handleUpdateContact = (field: keyof TourDate, value: string) => {
      if (selectedDateId) {
          updateTourDate(selectedDateId, { [field]: value });
      }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto p-6">
        <header>
            <h1 className="text-3xl font-bold text-white">Venue Intelligence</h1>
            <p className="text-slate-400">Technical Data Mining & Professional Directory</p>
        </header>

        <div className="flex space-x-4 border-b border-maestro-700 bg-maestro-900/50 rounded-t-xl p-1 w-fit">
            <button onClick={() => setActiveTab('search')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${activeTab === 'search' ? 'bg-maestro-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Live Search</button>
            <button onClick={() => setActiveTab('analyze')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${activeTab === 'analyze' ? 'bg-maestro-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Tech Plot Analysis</button>
            <button onClick={() => setActiveTab('directory')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${activeTab === 'directory' ? 'bg-maestro-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Contact Directory</button>
        </div>

        {activeTab === 'search' && (
            <div className="space-y-6 animate-fadeIn">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search venue capacity, load-in rules, or recent curfews..."
                        className="flex-1 bg-maestro-800 border border-maestro-700 text-white p-4 rounded-xl focus:ring-1 focus:ring-maestro-accent outline-none"
                    />
                    <button type="submit" disabled={isSearching} className="bg-maestro-accent hover:bg-violet-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2">
                        {isSearching ? <Loader2 className="animate-spin" /> : <Search className="w-5 h-5" />} Search
                    </button>
                </form>

                {searchResult && (
                    <div className="bg-maestro-800 p-8 rounded-2xl border border-maestro-700 shadow-2xl">
                        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-lg">
                            {searchResult.text}
                        </div>
                        {searchResult.chunks && searchResult.chunks.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-maestro-700">
                                <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Grounded Sources</h4>
                                <div className="flex flex-wrap gap-4">
                                    {searchResult.chunks.map((chunk, idx) => chunk.web && (
                                        <a key={idx} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-maestro-900 border border-maestro-700 px-4 py-2 rounded-full text-maestro-accent text-xs font-bold hover:bg-maestro-700 transition-colors">
                                            <LinkIcon className="w-3 h-3" /> {chunk.web.title || 'Source'}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'analyze' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-maestro-700 rounded-2xl p-10 text-center hover:border-maestro-accent transition-all cursor-pointer bg-maestro-800/50 group">
                        <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        {selectedImage ? (
                            <img src={selectedImage} alt="Preview" className="max-h-80 mx-auto rounded-xl shadow-2xl" />
                        ) : (
                            <div className="py-10">
                                <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4 group-hover:text-maestro-accent transition-colors" />
                                <p className="text-slate-300 font-bold text-lg">Upload Technical Document</p>
                                <p className="text-sm text-slate-500 mt-2">Stage Plot, Lighting Rider, or Power specs</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-maestro-800 p-6 rounded-2xl border border-maestro-700">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-3">AI Instruction</label>
                        <textarea value={analyzePrompt} onChange={e => setAnalyzePrompt(e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 p-4 rounded-xl text-slate-300 h-32 outline-none focus:border-maestro-accent font-sans" />
                        <button onClick={handleAnalyze} disabled={isAnalyzing || !selectedImage} className="w-full mt-4 bg-maestro-accent hover:bg-violet-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            {isAnalyzing ? 'Analyzing Document...' : 'Extract Data'}
                        </button>
                    </div>
                </div>
                
                <div className="bg-maestro-800 p-8 rounded-2xl border border-maestro-700 min-h-[500px] shadow-2xl">
                    <h3 className="text-maestro-gold font-bold mb-6 flex items-center gap-3 text-xl border-b border-maestro-700 pb-4">
                        <Info className="w-6 h-6" /> Extracted Specifications
                    </h3>
                    {isAnalyzing ? (
                        <div className="flex flex-col justify-center items-center h-[300px] space-y-4">
                            <Loader2 className="w-12 h-12 text-maestro-accent animate-spin" />
                            <p className="text-slate-400 font-medium animate-pulse">Scanning stage dimensions and power phases...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap text-slate-300">
                            {analysisResult || "No data extracted yet. Upload a plot to begin."}
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'directory' && (
            <div className="bg-maestro-800 rounded-2xl border border-maestro-700 shadow-2xl overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-maestro-700 bg-maestro-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-maestro-accent" /> Venue Contact Directory</h3>
                        <p className="text-sm text-slate-500">Manage direct lines for Production Managers and Box Office.</p>
                    </div>
                    <select value={selectedDateId} onChange={e => setSelectedDateId(e.target.value)} className="bg-maestro-800 border border-maestro-700 text-white rounded-lg px-4 py-2 text-sm outline-none font-bold">
                        {tourDates.map(d => <option key={d.id} value={d.id}>{d.date} - {d.venue} ({d.city})</option>)}
                    </select>
                </div>

                {activeDate ? (
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3" /> PM Name</label>
                            <input type="text" value={activeDate.venueContactName || ''} onChange={e => handleUpdateContact('venueContactName', e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded-xl p-4 text-white outline-none focus:border-maestro-accent" placeholder="Contact Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> Direct Phone</label>
                            <input type="text" value={activeDate.venueContactPhone || ''} onChange={e => handleUpdateContact('venueContactPhone', e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded-xl p-4 text-white outline-none focus:border-maestro-accent font-mono" placeholder="+1 555-0199" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> Contact Email</label>
                            <input type="email" value={activeDate.venueContactEmail || ''} onChange={e => handleUpdateContact('venueContactEmail', e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded-xl p-4 text-white outline-none focus:border-maestro-accent" placeholder="pm@venue.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building className="w-3 h-3" /> Venue Main Line</label>
                            <input type="text" value={activeDate.venuePhone || ''} onChange={e => handleUpdateContact('venuePhone', e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded-xl p-4 text-white outline-none focus:border-maestro-accent font-mono" placeholder="Main Box Office" />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Venue Address</label>
                            <input type="text" value={activeDate.address || ''} onChange={e => handleUpdateContact('address', e.target.value)} className="w-full bg-maestro-900 border border-maestro-700 rounded-xl p-4 text-white outline-none focus:border-maestro-accent" />
                        </div>
                        <div className="col-span-full pt-6 flex justify-end">
                            <button onClick={() => alert("Contacts Updated.")} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all">
                                <Save className="w-5 h-5" /> Save Directory Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center text-slate-500 italic">No venue selected.</div>
                )}
            </div>
        )}
    </div>
  );
};