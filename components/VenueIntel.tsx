
import React, { useState } from 'react';
import { askSearch, analyzeImage } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { Upload, Search, FileText, Loader2, LinkIcon, Zap, Ruler, Users, Info, Phone, Save } from 'lucide-react';
import { GroundingChunk } from '../types';

export const VenueIntel: React.FC = () => {
  const { addNote, currentTour, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'search' | 'analyze'>('search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{text: string, chunks?: GroundingChunk[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // New State for Phone Saving
  const [phoneInput, setPhoneInput] = useState('');

  // Analyze State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Updated prompt to specifically target the requested data points
  const [analyzePrompt, setAnalyzePrompt] = useState(
    'Analyze this tech rider or stage plot image. \n' +
    'Please extract and structure the following details strictly:\n\n' +
    '1. ⚡ POWER REQUIREMENTS: Amps, Phases, Voltage, Camlock/Feeder info.\n' +
    '2. 📏 STAGE DIMENSIONS: Width, Depth, Deck Height, Overhead Clearance.\n' +
    '3. ☎️ CONTACT PERSONS: Name, Role, Email, Phone number.\n\n' +
    'Format the output with clear headers and bullet points. If information is missing, state "Not specified in document".'
  );
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResult(null); // Clear previous results while searching
    setPhoneInput(''); // Reset phone input
    try {
        const result = await askSearch(searchQuery);
        // Cast chunks to ensure compatibility with local GroundingChunk type
        setSearchResult({
            text: result.text || "",
            chunks: result.chunks ? (result.chunks as unknown as GroundingChunk[]) : undefined
        });
    } catch (e) {
        console.error(e);
    } finally {
        setIsSearching(false);
    }
  };

  const handleSavePhone = () => {
      if (!phoneInput || !currentTour || !currentUser) return;
      
      addNote({
          id: Math.random().toString(36).substr(2, 9),
          tourId: currentTour.id,
          content: `[Venue Intel] Search: "${searchQuery}"\nSaved Phone: ${phoneInput}\n\nContext excerpt:\n${searchResult?.text.substring(0, 150)}...`,
          type: 'General',
          authorName: currentUser.name,
          date: new Date().toISOString(),
          attachments: []
      });
      
      setPhoneInput('');
      alert("Phone number saved to Dashboard Notes.");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        // Automatically start analysis when image is selected for smoother UX
        const data = base64.split(',')[1];
        handleAnalyze(data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64Data: string) => {
    setIsAnalyzing(true);
    try {
        const text = await analyzeImage(base64Data, analyzePrompt);
        setAnalysisResult(text || "Could not analyze image.");
    } catch (e) {
        setAnalysisResult("Error analyzing image.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
        <header>
            <h1 className="text-3xl font-bold text-white">Venue Intelligence</h1>
            <p className="text-slate-400">Search Grounding & Tech Rider Analysis (Gemini 3 Pro)</p>
        </header>

        <div className="flex space-x-4 border-b border-maestro-700">
            <button 
                onClick={() => setActiveTab('search')}
                className={`pb-4 px-4 font-medium transition-colors ${activeTab === 'search' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500'}`}
            >
                Live Search
            </button>
            <button 
                onClick={() => setActiveTab('analyze')}
                className={`pb-4 px-4 font-medium transition-colors ${activeTab === 'analyze' ? 'text-maestro-accent border-b-2 border-maestro-accent' : 'text-slate-500'}`}
            >
                Tech Spec Analysis
            </button>
        </div>

        {activeTab === 'search' ? (
            <div className="space-y-6 animate-fadeIn">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for venue capacity, curfew rules, or recent news..."
                        className="flex-1 bg-maestro-800 border border-maestro-700 text-white p-3 rounded-lg focus:ring-1 focus:ring-maestro-accent outline-none"
                    />
                    <button type="submit" disabled={isSearching} className="bg-maestro-accent hover:bg-violet-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
                        {isSearching ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                    </button>
                </form>

                {searchResult && (
                    <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700">
                        <div className="prose prose-invert max-w-none mb-6">
                            <p>{searchResult.text}</p>
                        </div>
                        
                        {/* New Phone Number Input Area */}
                        <div className="mt-6 mb-6 p-4 bg-maestro-900/50 rounded-lg border border-maestro-700 flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="flex-1 w-full">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2">
                                    <Phone className="w-3 h-3" /> Found a number? Save it.
                                </label>
                                <input 
                                    type="text" 
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="e.g. +1 555-0199"
                                    className="w-full bg-maestro-800 border border-maestro-600 rounded p-2 text-white text-sm focus:border-maestro-accent outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleSavePhone}
                                disabled={!phoneInput}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>

                        {searchResult.chunks && searchResult.chunks.length > 0 && (
                            <div className="border-t border-maestro-700 pt-4">
                                <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase">Sources</h4>
                                <ul className="space-y-2">
                                    {searchResult.chunks.map((chunk, idx) => (
                                        chunk.web ? (
                                            <li key={idx}>
                                                <a href={chunk.web.uri || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-maestro-accent hover:underline text-sm">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {chunk.web.title || 'Source'}
                                                </a>
                                            </li>
                                        ) : null
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-maestro-700 rounded-xl p-8 text-center hover:border-maestro-accent transition-colors cursor-pointer relative bg-maestro-800/50">
                        <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        {selectedImage ? (
                            <img src={selectedImage} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                        ) : (
                            <div className="py-8">
                                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-300 font-medium">Upload Tech Rider / Stage Plot</p>
                                <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-maestro-800 p-4 rounded-lg border border-maestro-700">
                        <div className="flex items-center justify-between mb-2">
                             <label className="block text-xs font-bold text-slate-400 uppercase">Extraction Targets</label>
                             <div className="flex gap-2 text-maestro-accent">
                                <span title="Power"><Zap className="w-3 h-3" /></span>
                                <span title="Dimensions"><Ruler className="w-3 h-3" /></span>
                                <span title="Contacts"><Users className="w-3 h-3" /></span>
                             </div>
                        </div>
                        <textarea 
                            value={analyzePrompt}
                            onChange={(e) => setAnalyzePrompt(e.target.value)}
                            className="w-full bg-maestro-900 border border-maestro-700 p-3 rounded text-sm text-slate-300 h-32 outline-none focus:border-maestro-accent"
                        />
                         {selectedImage && (
                            <button 
                                onClick={() => handleAnalyze(selectedImage.split(',')[1])}
                                disabled={isAnalyzing}
                                className="w-full mt-2 bg-maestro-700 hover:bg-maestro-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                {isAnalyzing ? 'Extracting Data...' : 'Re-Analyze'}
                            </button>
                         )}
                    </div>
                </div>
                
                <div className="bg-maestro-800 p-6 rounded-xl border border-maestro-700 min-h-[400px]">
                    <div className="flex items-center gap-2 mb-4 text-maestro-gold border-b border-maestro-700 pb-2">
                        <Info className="w-5 h-5" />
                        <h3 className="font-bold">Extracted Specifications</h3>
                    </div>
                    {isAnalyzing ? (
                        <div className="flex flex-col justify-center items-center h-64 space-y-4">
                            <Loader2 className="w-8 h-8 text-maestro-accent animate-spin" />
                            <p className="text-sm text-slate-400 animate-pulse">Reading power specs and dimensions...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                            {analysisResult ? (
                                <div className="whitespace-pre-wrap">{analysisResult}</div>
                            ) : (
                                <div className="text-center py-20 text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="italic">Upload a document to extract:</p>
                                    <div className="flex justify-center gap-4 mt-4 text-xs font-bold uppercase opacity-60">
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Power</span>
                                        <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> Stage</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Contacts</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
