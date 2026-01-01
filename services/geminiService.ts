
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AspectRatio, ImageSize, VenueDocument } from "../types";

/* Fix: Removed top-level ai client initialization. 
   Coding Guidelines require creating a new GoogleGenAI instance right before making an API call 
   to ensure the most up-to-date API key is used. */

// Helper to handle API errors
const handleGeminiError = (error: any, fallbackText: string) => {
    // Only warn for 429s, otherwise error
    if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.code === 429) {
        console.warn("Gemini Quota Exceeded (429). returning fallback.");
        return `${fallbackText} (System busy - Rate limit exceeded)`;
    }
    console.error("Gemini API Error:", error);
    return fallbackText;
};

// Helper to check Veo permissions
export const checkVeoKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
      /* Fix: Guideline requires assuming success after triggering openSelectKey() 
         to mitigate race conditions where hasSelectedApiKey() might not immediately reflect the update. */
      return true;
    }
    return true;
  }
  return true; // Fallback if not running in the specific environment, though Veo requires it
};

// --- GENERIC TEXT GENERATION ---
/* Fix: Defaulted to gemini-3-flash-preview for general text tasks */
export const generateText = async (prompt: string, model: string = 'gemini-3-flash-preview'): Promise<string> => {
    try {
        /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });
        return response.text || "No response generated.";
    } catch (e) {
        return handleGeminiError(e, "Unable to generate text at this time.");
    }
};

// --- TRAVEL PARSING (JSON Schema) ---
export const parseTravelDetails = async (text: string) => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      /* Fix: Upgrade to gemini-3-flash-preview for parsing tasks */
      model: 'gemini-3-flash-preview',
      contents: `Extract travel details from the following text into a structured JSON object. 
      Text: "${text}"
      If specific fields are missing, make a best guess or leave empty string.
      For 'type', infer Flight, Bus, Train, or Ground.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['Flight', 'Bus', 'Train', 'Ground'] },
            carrier: { type: Type.STRING },
            number: { type: Type.STRING },
            departureDate: { type: Type.STRING },
            departureTime: { type: Type.STRING },
            departureLocation: { type: Type.STRING },
            arrivalDate: { type: Type.STRING },
            arrivalTime: { type: Type.STRING },
            arrivalLocation: { type: Type.STRING },
            notes: { type: Type.STRING }
          }
        }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Travel parsing failed:", error);
    return null;
  }
};

// --- FLASH LITE (Fast Responses) ---
export const generateFastSummary = async (prompt: string): Promise<string> => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    /* Fix: Using gemini-3-flash-preview for summarization (Basic Text Tasks) */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    });
    return response.text || "No summary available.";
  } catch (error) {
    return handleGeminiError(error, "Briefing unavailable.");
  }
};

// --- MAPS GROUNDING ---
export const askMaps = async (query: string, latitude?: number, longitude?: number) => {
  // Check for API Key availability
  if (!process.env.API_KEY) {
    console.error("Google Maps Integration Error: API Key is missing in environment variables.");
    return {
      text: "Google Maps integration requires a valid API key. Please ensure your API key is configured in the environment variables to use this feature.",
      chunks: []
    };
  }

  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (latitude && longitude) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: { latitude, longitude }
      }
    };
  }

  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      /* Maps grounding requires 2.5 series */
      model: 'gemini-2.5-flash',
      contents: query,
      config
    });

    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Maps request failed:", error);
    return {
      text: "Unable to access Google Maps data. Please verify your API key configuration and permissions.",
      chunks: []
    };
  }
};

// --- SEARCH GROUNDING ---
export const askSearch = async (query: string) => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      /* Fix: Upgrade to gemini-3-flash-preview for search grounded queries */
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
      console.error("Search request failed:", error);
      return { text: "Search currently unavailable.", chunks: [] };
  }
};

// --- VENUE DOC SCRAPER ---
export const findVenueDocuments = async (venue: string, city: string): Promise<VenueDocument[]> => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Enhanced prompt prioritizing Stage Plots and Technical Riders
    const query = `Find "Technical Rider" PDF, "Stage Plot" PDF, or "Production Pack" PDF for ${venue} in ${city}. Focus on official venue technical specifications.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview', 
        contents: query,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const docs: VenueDocument[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    chunks.forEach((chunk, index) => {
        if (chunk.web && chunk.web.uri) {
            const uri = chunk.web.uri.toLowerCase();
            const title = chunk.web.title || `Document ${index + 1}`;
            const lowerTitle = title.toLowerCase();
            
            // Refined filtering and typing
            if (
                uri.endsWith('.pdf') || 
                lowerTitle.includes('tech') || 
                lowerTitle.includes('production') || 
                lowerTitle.includes('rider') || 
                lowerTitle.includes('specs') ||
                lowerTitle.includes('plot')
            ) {
                let docType: VenueDocument['type'] = 'Other';
                if (lowerTitle.includes('plot')) docType = 'Plot';
                else if (lowerTitle.includes('guide') || lowerTitle.includes('facility')) docType = 'Facility Guide';
                else if (lowerTitle.includes('tech') || lowerTitle.includes('rider') || lowerTitle.includes('production')) docType = 'Tech Pack';

                docs.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title: chunk.web.title || "Venue Document",
                    url: chunk.web.uri,
                    type: docType
                });
            }
        }
    });

    // Deduplicate by URL
    const uniqueDocs = Array.from(new Map(docs.map(item => [item.url, item])).values());
    
    // Sort to prioritize Plots and Tech Packs
    uniqueDocs.sort((a, b) => {
        const priority = { 'Tech Pack': 1, 'Plot': 2, 'Facility Guide': 3, 'Other': 4 };
        return (priority[a.type] || 4) - (priority[b.type] || 4);
    });

    return uniqueDocs.slice(0, 5); 
  } catch (error) {
    console.error("Doc scraping failed", error);
    return [];
  }
};

// --- IMAGE ANALYSIS (Pro) ---
export const analyzeImage = async (base64Image: string, prompt: string) => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
        /* Complex Text Tasks with vision -> Pro preview */
        model: 'gemini-3-pro-preview',
        contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt }
        ]
        }
    });
    return response.text;
  } catch (e) {
      return handleGeminiError(e, "Image analysis failed.");
  }
};

// --- IMAGE GENERATION (Pro + Size + Ratio) ---
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, size: ImageSize) => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
        imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: size
        }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (e) {
      console.error(e);
      return null;
  }
};

// --- IMAGE EDITING (Flash Image) ---
export const editImage = async (base64Image: string, prompt: string) => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
        parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } }, // User upload
            { text: prompt } // "Add a retro filter"
        ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (e) {
      console.error(e);
      return null;
  }
};

// --- VIDEO GENERATION (Veo) ---
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBase64?: string): Promise<string | null> => {
  try {
    await checkVeoKey();
    /* Fix: Create new instance using latest API key from env before calling generateVideos */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    let operation;
    
    if (imageBase64) {
        operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image", 
        image: {
            imageBytes: imageBase64,
            mimeType: 'image/png' 
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p', 
            aspectRatio: aspectRatio
        }
        });
    } else {
        operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
        });
    }

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); 
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) return null;
    return `${uri}&key=${process.env.API_KEY}`;
  } catch (e) {
      console.error("Veo generation failed", e);
      return null;
  }
};

// --- CHAT (Pro) ---
export const createChat = (systemInstruction: string) => {
  /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction }
  });
};

// --- TTS ---
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    /* Fix: Initialize client with latest process.env.API_KEY per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
        },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (e) {
      console.error("TTS Failed", e);
      return null;
  }
};


// --- AUDIO DECODING HELPERS ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playAudio = async (base64String: string) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    
    const bytes = decode(base64String);
    const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};
