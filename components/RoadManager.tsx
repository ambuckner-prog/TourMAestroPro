import React, { useState, useRef, useEffect } from 'react';
import { createChat, generateSpeech, playAudio } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, User, Bot, Volume2, StopCircle, Loader } from 'lucide-react';

export const RoadManager: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Use a ref to store the chat session so it persists across renders
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chat
    chatSessionRef.current = createChat('You are the AI Road Manager for "Tour Maestro Pro". Be professional, concise, and helpful with logistics, technical questions, and scheduling.');
    
    // Initial Greeting
    setMessages([{
        id: 'init',
        role: 'model',
        text: 'Ready for duty. How can I assist with the tour logistics today?',
        timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        const result = await chatSessionRef.current.sendMessage(userMsg.text);
        const modelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.response.text(),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
        console.error(err);
    } finally {
        setIsTyping(false);
    }
  };

  const handleTTS = async (msgId: string, text: string) => {
    // Mark loading
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isLoadingAudio: true } : m));

    try {
        const audioBase64 = await generateSpeech(text);
        if (audioBase64) {
            playAudio(audioBase64);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, audioData: audioBase64 } : m));
        }
    } catch (e) {
        console.error("TTS Failed", e);
    } finally {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isLoadingAudio: false } : m));
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-maestro-800 rounded-xl border border-maestro-700 overflow-hidden">
        <header className="p-4 border-b border-maestro-700 bg-maestro-900 flex justify-between items-center">
            <div>
                <h2 className="font-bold text-white flex items-center gap-2">
                    <Bot className="text-maestro-accent" /> Road Manager AI
                </h2>
                <p className="text-xs text-slate-400">Gemini 3 Pro + Flash TTS</p>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-maestro-accent text-white rounded-tr-none' : 'bg-maestro-700 text-slate-200 rounded-tl-none'}`}>
                        <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        
                        {msg.role === 'model' && (
                            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2">
                                <button 
                                    onClick={() => handleTTS(msg.id, msg.text)}
                                    disabled={msg.isLoadingAudio}
                                    className="flex items-center gap-1 text-xs text-maestro-gold hover:text-white transition-colors"
                                >
                                    {msg.isLoadingAudio ? <Loader className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                                    {msg.isLoadingAudio ? 'Generating Audio...' : 'Read Aloud'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                 <div className="flex justify-start">
                    <div className="bg-maestro-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-maestro-900 border-t border-maestro-700">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about logistics, draft an email, or check the schedule..."
                    className="flex-1 bg-maestro-800 text-white rounded-lg px-4 py-3 border border-maestro-700 focus:border-maestro-accent outline-none"
                />
                <button type="submit" disabled={isTyping} className="bg-maestro-accent hover:bg-violet-600 text-white p-3 rounded-lg transition-colors">
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </form>
    </div>
  );
};