
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Ensure process.env.API_KEY is available or handled by the component layer via window.aistudio for Veo
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

// Helper to check Veo permissions
export const checkVeoKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
      return await aistudio.hasSelectedApiKey();
    }
    return true;
  }
  return true; // Fallback if not running in the specific environment, though Veo requires it
};

// --- GENERIC TEXT GENERATION ---
export const generateText = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });
        return response.text || "No response generated.";
    } catch (e) {
        console.error("Generate Text Error:", e);
        return "Error generating content.";
    }
};

// --- TRAVEL PARSING (JSON Schema) ---
export const parseTravelDetails = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    // Switched to gemini-2.5-flash as the previous lite model name was causing 404s
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Fast summary failed:", error);
    return "Could not generate summary.";
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
    const response = await ai.models.generateContent({
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
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

// --- IMAGE ANALYSIS (Pro) ---
export const analyzeImage = async (base64Image: string, prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    }
  });
  return response.text;
};

// --- IMAGE GENERATION (Pro + Size + Ratio) ---
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, size: ImageSize) => {
  // Use checkVeoKey logic if high quality implies paid tier, but generally Pro Image Preview works with standard key
  // However, Veo rules usually apply to high-end media generation in these contexts.
  // Using gemini-3-pro-image-preview
  
  // Note: The prompt asks for size and aspect ratio controls.
  // This model uses generateContent with imageConfig
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

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// --- IMAGE EDITING (Flash Image) ---
export const editImage = async (base64Image: string, prompt: string) => {
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
};

// --- VIDEO GENERATION (Veo) ---
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBase64?: string): Promise<string | null> => {
  // MUST Ensure API Key is selected for Veo
  await checkVeoKey();
  
  // Re-instantiate to capture the potentially newly selected key in the environment/session
  // (Though in a real browser env, the key injection happens at network level if using the specific window.aistudio flow,
  // we follow the prompt's instruction to create a new instance if needed, but here we just proceed assuming env injection works or we rely on the global key if available).
  // The instruction says: "Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key"
  
  const tempAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  let operation;
  
  if (imageBase64) {
    // Image to Video
    operation = await tempAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Animate this image", 
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png' // Assuming PNG for simplicity, could be derived
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Fast preview usually 720p
        aspectRatio: aspectRatio
      }
    });
  } else {
    // Text to Video
    operation = await tempAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
    operation = await tempAi.operations.getVideosOperation({ operation: operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) return null;

  // Append key for fetching
  return `${uri}&key=${process.env.API_KEY}`;
};

// --- CHAT (Pro) ---
export const createChat = (systemInstruction: string) => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction }
  });
};

// --- TTS ---
export const generateSpeech = async (text: string): Promise<string | null> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Professional voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || null;
};


// --- AUDIO DECODING HELPERS ---
// Decodes base64 string to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM data to AudioBuffer
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
