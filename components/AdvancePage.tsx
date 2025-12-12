
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TourDate, AdvanceStatus, UserRole, AdvanceTemplate, AdvanceTemplateField } from '../types';
import { generateText } from '../services/geminiService';
import { Send, CheckCircle, Loader2, Copy, ExternalLink, Calendar, MapPin, XCircle, ArrowRight, Layout, Plus, Trash2, Edit2, Save, Sparkles, AlertCircle } from 'lucide-react';

export const AdvancePage: React.FC = () => {
    const { tourDates, currentTour, selectedDateId, setSelectedDateId, updateTourDate, hotels, travelItems, currentUser, advanceTemplates, addAdvanceTemplate, updateAdvanceTemplate, deleteAdvanceTemplate } = useApp();
    const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'EMAIL' | 'TEMPLATES'>('CHECKLIST');
    
    // AI Email State
    const [emailDraft, setEmailDraft] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('INITIAL');

    // Template Editor State
    const [editingTemplate, setEditingTemplate] = useState<Partial<AdvanceTemplate> | null>(null);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldDefault, setNewFieldDefault] = useState('');
    const [newFieldCategory, setNewFieldCategory] = useState<AdvanceTemplateField['category']>('Production');

    // Sort dates
    const currentDates = tourDates.filter(d => d.tourId === currentTour?.id).sort((a,b) => a.date.localeCompare(b.date));
    const selectedDate = tourDates.find(d => d.id === selectedDateId);

    // Filter Templates (System + Current Tour)
    const availableTemplates = advanceTemplates.filter(t => t.tourId === 'SYSTEM' || t.tourId === currentTour?.id);

    // Permission Check
    const canEdit = currentUser?.role !== UserRole.CREW;

    // Derived Data for Checklist
    const dateHotels = hotels.filter(h => h.date === selectedDate?.date || (h.checkIn && h.checkOut && selectedDate && selectedDate.date >= h.checkIn && selectedDate.date < h.checkOut));
    const dateTravel = travelItems.filter(t => t.departureDate === selectedDate?.date || t.arrivalDate === selectedDate?.date);
    const hasVenueInfo = !!(selectedDate?.venue && selectedDate?.address && selectedDate?.venueContactName);
    const hasSchedule = !!(selectedDate?.schedule && selectedDate.schedule.length > 0);
    const hasDocs = !!(selectedDate?.documents && selectedDate.documents.length > 0);
    
    const readinessScore = [
        hasVenueInfo, 
        dateHotels.length > 0, 
        dateTravel.length > 0, 
        hasSchedule
    ].filter(Boolean).length;

    // --- HANDLERS ---

    const handleDateSelect = (id: string) => {
        setSelectedDateId(id);
        setEmailDraft(''); // Clear draft on change
        setActiveTab('CHECKLIST');
    };

    const handleStatusUpdate = (status: AdvanceStatus) => {
        if (selectedDateId && canEdit) {
            updateTourDate(selectedDateId, { advanceStatus: status });
        }
    };

    const generateAdvanceEmail = async () => {
        if (!selectedDate || !currentUser) return;
        setIsGenerating(true);
        setActiveTab('EMAIL');

        const signature = `${currentUser.name}\n${currentUser.jobTitle || 'Tour Manager'}\n${currentUser.phone || ''}`;
        
        let promptContext = `
        Tour: ${currentTour?.name}
        Artist: ${currentTour?.artist}
        Date: ${selectedDate.date}
        Venue: ${selectedDate.venue} (${selectedDate.city})
        Venue Contact: ${selectedDate.venueContactName || 'Production Manager'}
        
        Missing Info (Please ask for these specifically if relevant to the email type):
        ${!dateHotels.length ? '- Local hotel recommendations' : ''}
        ${!hasSchedule ? '- Confirmation of load-in and door times' : ''}
        
        My Signature:
        ${signature}
        `;

        let instruction = "";
        
        // Check if selectedTemplateId corresponds to a Custom Template or a Default one
        const customTemplate = availableTemplates.find(t => t.id === selectedTemplateId);

        if (customTemplate) {
            // Build instruction from custom fields
            const fieldsList = customTemplate.fields.map(f => `- [${f.category}] ${f.label}: ${f.defaultValue}`).join('\n');
            instruction = `Draft a comprehensive advance email using the following custom requirements template: "${customTemplate.name}".
            
            You MUST specifically address or ask about the following items defined in our tour's advance protocol:
            ${fieldsList}
            
            Group the questions by category (Production, Hospitality, etc.) to keep the email organized. Tone should be professional but firm regarding requirements.`;
        } else {
            // Default Templates
            switch (selectedTemplateId) {
                case 'INITIAL':
                    instruction = "Draft a friendly introductory advance email. Introduce myself as the Tour Manager. Confirm the date and venue. Ask for their technical packet (tech specs) and venue information sheet. Ask about parking and load-in location. Keep it professional but concise.";
                    break;
                case 'TECH':
                    instruction = "Draft a production-focused email. State that I am attaching our Tech Rider and Stage Plot (mention this in text). Ask for confirmation that our power and stage dimension requirements can be met. Ask for the local production contact list.";
                    break;
                case 'HOSPITALITY':
                    instruction = "Draft a hospitality advance email. State that I am attaching our Hospitality Rider (mention this). Ask about dressing room allocation, showers, and catering capabilities. Confirm if a runner will be available.";
                    break;
                case 'FINAL':
                    instruction = "Draft a final confirmation email for the show happening soon. Confirm Load-in time (refer to standard 9am if not specified). Confirm guest list capacity. Provide my mobile number for show day. Express excitement for the show.";
                    break;
            }
        }

        const prompt = `${instruction}\n\nContext Data:\n${promptContext}`;

        try {
            const result = await generateText(prompt, 'gemini-3-pro-preview');
            setEmailDraft(result);
        } catch (e) {
            console.error(e);
            setEmailDraft("Error generating draft. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenMailClient = () => {
        if (!selectedDate) return;
        const subject = encodeURIComponent(`${currentTour?.name} Advance - ${selectedDate.date} - ${selectedDate.venue}`);
        const body = encodeURIComponent(emailDraft);
        window.location.href = `mailto:${selectedDate.venueContactEmail || ''}?subject=${subject}&body=${body}`;
    };

    // --- TEMPLATE EDITOR HANDLERS ---
    const handleStartEditTemplate = (tpl?: AdvanceTemplate) => {
        if (tpl) {
            setEditingTemplate({ ...tpl });
        } else {
            setEditingTemplate({ id: '', name: 'New Custom Advance', description: '', fields: [] });
        }
    };

    const handleSaveTemplate = () => {
        if (!editingTemplate || !editingTemplate.name) return;
        
        if (editingTemplate.id) {
            updateAdvanceTemplate(editingTemplate.id, editingTemplate);
        } else {
            const newTpl: AdvanceTemplate = {
                id: Math.random().toString(36).substr(2, 9),
                tourId: currentTour?.id || 'SYSTEM',
                name: editingTemplate.name!,
                description: editingTemplate.description,
                fields: editingTemplate.fields || []
            };
            addAdvanceTemplate(newTpl);
        }
        setEditingTemplate(null);
    };

    const handleAddField = () => {
        if (!editingTemplate || !newFieldName) return;
        const newField: AdvanceTemplateField = {
            id: Math.random().toString(36).substr(2, 9),
            label: newFieldName,
            defaultValue: newFieldDefault,
            category: newFieldCategory
        };
        setEditingTemplate({
            ...editingTemplate,
            fields: [...(editingTemplate.fields || []), newField]
        });
        setNewFieldName('');
        setNewFieldDefault('');
    };

    const handleRemoveField = (fieldId: string) => {
        if (!editingTemplate) return;
        setEditingTemplate({
            ...editingTemplate,
            fields: editingTemplate.fields?.filter(f => f.id !== fieldId)
        });
    };

    return (
        <div className="flex h-full bg-maestro-900 overflow-hidden">
            {/* LEFT SIDEBAR: UPCOMING DATES */}
            <div className="w-1/3 min-w-[300px] border-r border-maestro-700 flex flex-col bg-maestro-800">
                <div className="p-4 border-b border-maestro-700 bg-maestro-900 shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-maestro-accent" /> Advancing
                    </h2>
                    <p className="text-xs text-slate-400">Select a show to manage logistics.</p>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {currentDates.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic text-sm">
                            No dates found. Add dates in the Dashboard.
                        </div>
                    ) : (
                        currentDates.map(d => (
                            <div 
                                key={d.id} 
                                onClick={() => handleDateSelect(d.id)}
                                className={`p-4 border-b border-maestro-700 cursor-pointer transition-colors hover:bg-maestro-700/50 ${selectedDateId === d.id ? 'bg-maestro-700 border-l-4 border-l-maestro-accent' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-xs text-slate-400">{d.date}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        d.advanceStatus === 'CONFIRMED' ? 'bg-green-900 text-green-400' :
                                        d.advanceStatus === 'IN_PROGRESS' ? 'bg-blue-900 text-blue-400' :
                                        d.advanceStatus === 'INITIAL_SENT' ? 'bg-yellow-900 text-yellow-400' :
                                        'bg-slate-800 text-slate-500'
                                    }`}>
                                        {d.advanceStatus ? d.advanceStatus.replace('_', ' ') : 'Not Started'}
                                    </span>
                                </div>
                                <div className="font-bold text-white text-sm truncate">{d.city}</div>
                                <div className="text-xs text-slate-400 truncate">{d.venue}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT CONTENT: WORKSPACE */}
            <div className="flex-1 flex flex-col overflow-hidden bg-maestro-900 relative">
                {!selectedDate ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Send className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a date to begin advancing.</p>
                    </div>
                ) : (
                    <>
                        {/* Detail Header */}
                        <div className="p-6 border-b border-maestro-700 bg-maestro-800 shrink-0">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-1">{selectedDate.venue}</h1>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedDate.city}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedDate.date}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Advance Status</label>
                                    <select 
                                        value={selectedDate.advanceStatus || 'NOT_STARTED'} 
                                        onChange={(e) => handleStatusUpdate(e.target.value as AdvanceStatus)}
                                        disabled={!canEdit}
                                        className="bg-maestro-900 border border-maestro-700 text-white text-xs rounded px-3 py-2 outline-none focus:border-maestro-accent cursor-pointer"
                                    >
                                        <option value="NOT_STARTED">Not Started</option>
                                        <option value="INITIAL_SENT">Initial Sent</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Readiness Bar */}
                            <div className="w-full bg-maestro-900 h-2 rounded-full overflow-hidden flex">
                                <div className={`h-full ${readinessScore >= 1 ? 'bg-red-500' : 'bg-slate-700'} w-1/4 border-r border-maestro-900`}></div>
                                <div className={`h-full ${readinessScore >= 2 ? 'bg-orange-500' : 'bg-slate-700'} w-1/4 border-r border-maestro-900`}></div>
                                <div className={`h-full ${readinessScore >= 3 ? 'bg-yellow-500' : 'bg-slate-700'} w-1/4 border-r border-maestro-900`}></div>
                                <div className={`h-full ${readinessScore >= 4 ? 'bg-green-500' : 'bg-slate-700'} w-1/4`}></div>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                <span>Venue</span>
                                <span>Hotels</span>
                                <span>Travel</span>
                                <span>Schedule</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-maestro-700 bg-maestro-800 shrink-0">
                            <button onClick={() => setActiveTab('CHECKLIST')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'CHECKLIST' ? 'border-maestro-accent text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                                Readiness Checklist
                            </button>
                            <button onClick={() => setActiveTab('EMAIL')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'EMAIL' ? 'border-maestro-accent text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                                Email Generator
                            </button>
                            <button onClick={() => setActiveTab('TEMPLATES')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'TEMPLATES' ? 'border-maestro-accent text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                                Custom Templates
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'CHECKLIST' && (
                                <div className="space-y-4 max-w-3xl mx-auto">
                                    <ChecklistItem 
                                        label="Venue Contact Info" 
                                        status={hasVenueInfo} 
                                        subtext={hasVenueInfo ? selectedDate.venueContactName : "Missing contact name or email"} 
                                    />
                                    <ChecklistItem 
                                        label="Accommodation" 
                                        status={dateHotels.length > 0} 
                                        subtext={dateHotels.length > 0 ? `${dateHotels.length} Hotel(s) booked` : "No hotels found for this date"} 
                                    />
                                    <ChecklistItem 
                                        label="Travel Logistics" 
                                        status={dateTravel.length > 0} 
                                        subtext={dateTravel.length > 0 ? `${dateTravel.length} Travel item(s)` : "No travel items linked"} 
                                    />
                                    <ChecklistItem 
                                        label="Day Schedule" 
                                        status={hasSchedule} 
                                        subtext={hasSchedule ? `${selectedDate.schedule?.length} Events` : "Timeline is empty"} 
                                    />
                                    <ChecklistItem 
                                        label="Tech Documents" 
                                        status={hasDocs} 
                                        subtext={hasDocs ? `${selectedDate.documents?.length} Files attached` : "No tech pack or plots attached"} 
                                    />

                                    <div className="mt-8 pt-6 border-t border-maestro-700">
                                        <h3 className="text-lg font-bold text-white mb-4">Advance Progress</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => handleStatusUpdate('INITIAL_SENT')}
                                                disabled={selectedDate.advanceStatus !== 'NOT_STARTED'}
                                                className={`p-4 rounded-lg border text-left ${selectedDate.advanceStatus === 'NOT_STARTED' ? 'bg-maestro-800 border-maestro-500 hover:border-maestro-accent' : 'bg-maestro-900 border-maestro-800 opacity-50'}`}
                                            >
                                                <div className="text-sm font-bold text-white mb-1">1. Send Intro</div>
                                                <div className="text-xs text-slate-400">Establish contact and request venue packet.</div>
                                            </button>
                                            <button 
                                                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                                disabled={selectedDate.advanceStatus === 'NOT_STARTED' || selectedDate.advanceStatus === 'CONFIRMED'}
                                                className={`p-4 rounded-lg border text-left ${selectedDate.advanceStatus === 'INITIAL_SENT' || selectedDate.advanceStatus === 'IN_PROGRESS' ? 'bg-maestro-800 border-maestro-500 hover:border-maestro-accent' : 'bg-maestro-900 border-maestro-800 opacity-50'}`}
                                            >
                                                <div className="text-sm font-bold text-white mb-1">2. Production & Hospitality</div>
                                                <div className="text-xs text-slate-400">Exchange riders, confirm power, parking, catering.</div>
                                            </button>
                                            <button 
                                                onClick={() => handleStatusUpdate('CONFIRMED')}
                                                disabled={selectedDate.advanceStatus !== 'IN_PROGRESS'}
                                                className={`p-4 rounded-lg border text-left col-span-full ${selectedDate.advanceStatus === 'IN_PROGRESS' ? 'bg-maestro-800 border-green-500/50 hover:border-green-500' : 'bg-maestro-900 border-maestro-800 opacity-50'}`}
                                            >
                                                <div className="text-sm font-bold text-white mb-1">3. Final Confirmation</div>
                                                <div className="text-xs text-slate-400">Lock in times, guest list, and runner info 48h prior.</div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'EMAIL' && (
                                <div className="space-y-6 h-full flex flex-col">
                                    <div className="shrink-0 bg-maestro-800 p-4 rounded-xl border border-maestro-700">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Select Email Template</label>
                                        <select 
                                            value={selectedTemplateId} 
                                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                                            className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm outline-none focus:border-maestro-accent"
                                        >
                                            <optgroup label="Standard Templates">
                                                <option value="INITIAL">Initial Introduction</option>
                                                <option value="TECH">Production Request</option>
                                                <option value="HOSPITALITY">Hospitality Rider</option>
                                                <option value="FINAL">Final Confirmation</option>
                                            </optgroup>
                                            {availableTemplates.length > 0 && (
                                                <optgroup label="Custom Templates">
                                                    {availableTemplates.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>

                                    <div className="flex-1 bg-maestro-800 rounded-xl border border-maestro-700 p-4 flex flex-col relative">
                                        {isGenerating && (
                                            <div className="absolute inset-0 bg-maestro-800/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-maestro-accent animate-spin mb-2" />
                                                <p className="text-sm text-slate-300 font-medium">Gemini 3 Pro is drafting your email...</p>
                                            </div>
                                        )}
                                        
                                        <textarea 
                                            value={emailDraft}
                                            onChange={(e) => setEmailDraft(e.target.value)}
                                            placeholder="Select a template above and click Generate to create a draft..."
                                            className="flex-1 bg-transparent text-slate-300 text-sm font-mono resize-none outline-none leading-relaxed"
                                        />
                                        
                                        <div className="flex justify-between items-center pt-4 border-t border-maestro-700 mt-2">
                                            <button 
                                                onClick={generateAdvanceEmail}
                                                disabled={isGenerating}
                                                className="bg-maestro-700 hover:bg-maestro-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                                            >
                                                <Sparkles className="w-4 h-4 text-maestro-gold" /> Generate Draft
                                            </button>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(emailDraft)}
                                                    disabled={!emailDraft}
                                                    className="bg-maestro-900 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-maestro-700"
                                                >
                                                    <Copy className="w-4 h-4" /> Copy
                                                </button>
                                                <button 
                                                    onClick={handleOpenMailClient}
                                                    disabled={!emailDraft}
                                                    className="bg-maestro-accent hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Open Mail App
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'TEMPLATES' && (
                                <div className="flex h-full gap-6">
                                    {/* Sidebar: List of Templates */}
                                    <div className="w-64 shrink-0 border-r border-maestro-700 pr-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-white text-sm">Templates</h3>
                                            <button onClick={() => handleStartEditTemplate()} className="text-maestro-accent hover:text-white p-1 rounded hover:bg-maestro-800">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {availableTemplates.map(t => (
                                                <div 
                                                    key={t.id}
                                                    onClick={() => handleStartEditTemplate(t)}
                                                    className={`p-3 rounded-lg cursor-pointer text-sm ${editingTemplate?.id === t.id ? 'bg-maestro-700 text-white' : 'bg-maestro-800 text-slate-400 hover:bg-maestro-700/50'}`}
                                                >
                                                    <div className="font-bold">{t.name}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">{t.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main: Editor */}
                                    <div className="flex-1 flex flex-col h-full bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
                                        {editingTemplate ? (
                                            <>
                                                <div className="p-4 border-b border-maestro-700 bg-maestro-900/50">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="space-y-2 flex-1 mr-4">
                                                            <input 
                                                                type="text" 
                                                                value={editingTemplate.name}
                                                                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                                                placeholder="Template Name (e.g. Festival Advance)"
                                                                className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-transparent focus:border-maestro-accent"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={editingTemplate.description || ''}
                                                                onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                                                                placeholder="Description..."
                                                                className="w-full bg-transparent text-sm text-slate-400 outline-none border-b border-transparent focus:border-maestro-accent"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {editingTemplate.id && (
                                                                <button onClick={() => { if(window.confirm('Delete template?')) deleteAdvanceTemplate(editingTemplate.id!); setEditingTemplate(null); }} className="text-slate-500 hover:text-red-500 p-2">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button onClick={handleSaveTemplate} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                                                                <Save className="w-3 h-3" /> Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-y-auto p-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Custom Fields & Requirements</h4>
                                                    
                                                    {(!editingTemplate.fields || editingTemplate.fields.length === 0) && (
                                                        <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-maestro-700 rounded-lg">
                                                            No fields added yet. Add custom requirements below.
                                                        </div>
                                                    )}

                                                    <div className="space-y-2 mb-6">
                                                        {editingTemplate.fields?.map(field => (
                                                            <div key={field.id} className="flex items-center gap-3 p-3 bg-maestro-900 border border-maestro-700 rounded-lg group">
                                                                <div className="w-24 shrink-0 text-[10px] uppercase font-bold text-slate-500 bg-maestro-800 px-2 py-1 rounded text-center">
                                                                    {field.category}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-bold text-white">{field.label}</div>
                                                                    <div className="text-xs text-slate-400">{field.defaultValue}</div>
                                                                </div>
                                                                <button onClick={() => handleRemoveField(field.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="bg-maestro-900/50 p-4 rounded-lg border border-maestro-700">
                                                        <h5 className="text-xs font-bold text-maestro-gold uppercase mb-2">Add New Custom Field</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                                            <input 
                                                                type="text" 
                                                                value={newFieldName}
                                                                onChange={e => setNewFieldName(e.target.value)}
                                                                placeholder="Field Name (e.g. Shore Power)"
                                                                className="bg-maestro-800 border border-maestro-700 rounded p-2 text-xs text-white outline-none"
                                                            />
                                                            <select 
                                                                value={newFieldCategory}
                                                                onChange={e => setNewFieldCategory(e.target.value as any)}
                                                                className="bg-maestro-800 border border-maestro-700 rounded p-2 text-xs text-white outline-none"
                                                            >
                                                                <option value="Production">Production</option>
                                                                <option value="Hospitality">Hospitality</option>
                                                                <option value="Security">Security</option>
                                                                <option value="Merch">Merch</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                            <input 
                                                                type="text" 
                                                                value={newFieldDefault}
                                                                onChange={e => setNewFieldDefault(e.target.value)}
                                                                placeholder="Question / Requirement text..."
                                                                className="bg-maestro-800 border border-maestro-700 rounded p-2 text-xs text-white outline-none"
                                                            />
                                                        </div>
                                                        <button onClick={handleAddField} className="w-full bg-maestro-700 hover:bg-maestro-600 text-white py-2 rounded text-xs font-bold">Add Field</button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                                <Layout className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Select a template to edit or create new.</p>
                                                <p className="text-xs mt-2 max-w-xs text-center">Templates are saved to your tour database and available for AI generation.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Subcomponent for Checklist Item
const ChecklistItem: React.FC<{ label: string, status: boolean, subtext: string }> = ({ label, status, subtext }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${status ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
        <div className="flex items-center gap-3">
            {status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
            <div>
                <div className={`text-sm font-bold ${status ? 'text-green-100' : 'text-red-100'}`}>{label}</div>
                <div className={`text-xs ${status ? 'text-green-400/70' : 'text-red-400/70'}`}>{subtext}</div>
            </div>
        </div>
        {!status && (
            <a href="#" className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1">
                Fix <ArrowRight className="w-3 h-3" />
            </a>
        )}
    </div>
);
