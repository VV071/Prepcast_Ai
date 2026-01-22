import { GoogleGenAI } from "@google/genai";
import { DomainType } from "../types";

const API_KEY = process.env.API_KEY || '';

export const detectDomainWithGemini = async (
  columns: string[],
  sampleData: any[]
): Promise<DomainType> => {
  if (!API_KEY) {
    console.warn("No API Key found for Gemini. Defaulting to general.");
    return 'general';
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

    if (text?.includes('healthcare')) return 'healthcare';
    if (text?.includes('finance')) return 'finance';
    if (text?.includes('ecommerce')) return 'ecommerce';
    if (text?.includes('hr') || text?.includes('human resources')) return 'hr';
    
    return 'general';
  } catch (error) {
    console.error("Gemini detection failed:", error);
    return 'general';
  }
};
