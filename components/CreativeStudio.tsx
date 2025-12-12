import React, { useState } from 'react';
import { generateImage, generateVideo, editImage } from '../services/geminiService';
import { AspectRatio, ImageSize } from '../types';
import { Video, Image as ImageIcon, Wand2, RefreshCw, Download, Play, Film } from 'lucide-react';

type Mode = 'GENERATE_IMAGE' | 'EDIT_IMAGE' | 'GENERATE_VIDEO';

export const CreativeStudio: React.FC = () => {
  const [mode, setMode] = useState<Mode>('GENERATE_IMAGE');
  const [prompt, setPrompt] = useState('');
  
  // Image Config
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  
  // Video Config
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // Input for Editing/Img-to-Video
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  // Output
  const [outputMedia, setOutputMedia] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleAction = async () => {
    setIsLoading(true);
    setStatusMsg('Initializing creative model...');
    setOutputMedia(null);

    try {
      if (mode === 'GENERATE_IMAGE') {
        setStatusMsg('Generating high-fidelity image (Gemini 3 Pro)...');
        const result = await generateImage(prompt, aspectRatio, imageSize);
        setOutputMedia(result);
      } 
      else if (mode === 'EDIT_IMAGE') {
        if (!sourceImage) return;
        setStatusMsg('Editing with Gemini 2.5 Flash Image...');
        // Strip base64 header
        const rawBase64 = sourceImage.split(',')[1];
        const result = await editImage(rawBase64, prompt);
        setOutputMedia(result);
      } 
      else if (mode === 'GENERATE_VIDEO') {
        setStatusMsg('Generating video with Veo (this may take a minute)...');
        const rawBase64 = sourceImage ? sourceImage.split(',')[1] : undefined;
        const uri = await generateVideo(prompt, videoAspectRatio, rawBase64);
        setOutputMedia(uri);
      }
    } catch (error) {
      console.error(error);
      setStatusMsg('Operation failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Creative Studio</h1>
        <p className="text-slate-400">Powered by Veo 3 & Gemini 3 Pro Vision</p>
      </header>

      {/* Mode Selector */}
      <div className="flex gap-4 p-1 bg-maestro-800 w-fit rounded-lg border border-maestro-700">
        <button onClick={() => setMode('GENERATE_IMAGE')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${mode === 'GENERATE_IMAGE' ? 'bg-maestro-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <ImageIcon className="w-4 h-4" /> Generate Image
        </button>
        <button onClick={() => setMode('EDIT_IMAGE')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${mode === 'EDIT_IMAGE' ? 'bg-maestro-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <Wand2 className="w-4 h-4" /> Edit Image
        </button>
        <button onClick={() => setMode('GENERATE_VIDEO')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${mode === 'GENERATE_VIDEO' ? 'bg-maestro-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <Film className="w-4 h-4" /> Veo Video
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6 bg-maestro-800 p-6 rounded-xl border border-maestro-700">
            
            {(mode === 'EDIT_IMAGE' || mode === 'GENERATE_VIDEO') && (
                 <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Source Image {mode === 'GENERATE_VIDEO' && '(Optional)'}</label>
                    <div className="border-2 border-dashed border-maestro-600 rounded-lg p-4 text-center hover:bg-maestro-700 transition relative">
                        <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        {sourceImage ? (
                            <div className="relative h-32 mx-auto w-fit">
                                <img src={sourceImage} alt="Source" className="h-full rounded shadow" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white opacity-0 hover:opacity-100 transition">Change</div>
                            </div>
                        ) : (
                            <div className="text-slate-500 text-sm">Click to upload source</div>
                        )}
                    </div>
                 </div>
            )}

            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Prompt</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'EDIT_IMAGE' ? 'e.g., "Add a retro filter", "Remove the person in background"' : 'Describe the scene in detail...'}
                    className="w-full bg-maestro-900 border border-maestro-700 rounded-lg p-3 text-white h-24 focus:ring-1 focus:ring-maestro-accent outline-none"
                />
            </div>

            {/* Specific Configs */}
            {mode === 'GENERATE_IMAGE' && (
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Aspect Ratio</label>
                        <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm"
                        >
                            {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Resolution</label>
                        <select 
                            value={imageSize} 
                            onChange={(e) => setImageSize(e.target.value as ImageSize)}
                            className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm"
                        >
                            {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {mode === 'GENERATE_VIDEO' && (
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Video Ratio</label>
                    <select 
                        value={videoAspectRatio} 
                        onChange={(e) => setVideoAspectRatio(e.target.value as any)}
                        className="w-full bg-maestro-900 border border-maestro-700 rounded p-2 text-white text-sm"
                    >
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                    </select>
                </div>
            )}

            <button 
                onClick={handleAction}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-maestro-accent to-indigo-600 hover:from-indigo-600 hover:to-maestro-accent text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/50 transition-all flex justify-center items-center gap-2"
            >
                {isLoading ? <RefreshCw className="animate-spin" /> : <SparkleIcon />}
                {isLoading ? 'Processing...' : 'Generate'}
            </button>
            {isLoading && <p className="text-center text-xs text-maestro-gold animate-pulse">{statusMsg}</p>}
        </div>

        {/* Output Area */}
        <div className="bg-maestro-900 rounded-xl border border-maestro-700 flex items-center justify-center p-4 min-h-[400px] relative overflow-hidden">
            {!outputMedia && !isLoading && (
                <div className="text-center text-slate-600">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Your masterpiece will appear here</p>
                </div>
            )}
            
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-maestro-900/80 backdrop-blur-sm z-10">
                    <div className="w-16 h-16 border-4 border-maestro-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-medium">{statusMsg}</p>
                </div>
            )}

            {outputMedia && mode !== 'GENERATE_VIDEO' && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <img src={outputMedia} alt="Generated" className="max-w-full max-h-[500px] rounded shadow-2xl" />
                    <a href={outputMedia} download="maestro-gen.png" className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md">
                        <Download className="w-5 h-5" />
                    </a>
                </div>
            )}

            {outputMedia && mode === 'GENERATE_VIDEO' && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <video controls autoPlay loop src={outputMedia} className="max-w-full max-h-[500px] rounded shadow-2xl" />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SparkleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" fill="currentColor"/>
    </svg>
);