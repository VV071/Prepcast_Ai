import { GoogleGenAI } from "@google/genai";
import { detectDomainBERT } from "./bertService";

const API_KEY = import.meta.env.VITE_API_KEY || '';

// Internal Gemini fallback
const detectWithGeminiAPI = async (columns, sampleData) => {
    if (!API_KEY) {
        console.warn("No API Key found for Gemini. Defaulting to general.");
        return { domain: 'general' };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = `
      Analyze the following dataset structure and determine its domain.
      
      Columns: ${columns.join(', ')}
      
      Sample Row 1: ${JSON.stringify(sampleData[0] || {})}
      Sample Row 2: ${JSON.stringify(sampleData[1] || {})}

      Possible domains: healthcare, finance, ecommerce, hr, general.
      
      Return ONLY the domain name in lowercase.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text?.trim().toLowerCase();

        let domain = 'general';
        if (text?.includes('healthcare')) domain = 'healthcare';
        else if (text?.includes('finance')) domain = 'finance';
        else if (text?.includes('ecommerce')) domain = 'ecommerce';
        else if (text?.includes('hr') || text?.includes('human resources')) domain = 'hr';

        return { domain };
    } catch (error) {
        console.error("Gemini detection failed:", error);
        return { domain: 'general' };
    }
};

// Main Export
export const detectDomainWithGemini = async (
    columns,
    sampleData
) => {
    // 1. Try BERT Detection (Local + Fast)
    try {
        const bertResult = await detectDomainBERT(columns, sampleData);
        if (bertResult && bertResult !== 'general') {
            return { domain: bertResult };
        }
    } catch (e) {
        console.warn("BERT detection error, falling back to Gemini", e);
    }

    // 2. Fallback to Gemini (Cloud + Smart)
    return await detectWithGeminiAPI(columns, sampleData);
};
