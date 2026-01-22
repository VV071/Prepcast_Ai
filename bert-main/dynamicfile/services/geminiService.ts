import { GoogleGenAI, Type } from "@google/genai";
import { CleaningDomain, CleanedDataRow, RawDataRow } from '../types';

// Helper to get AI instance safely
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

export const detectSourceInfo = async (url: string): Promise<{ type: 'SHEET' | 'API' | 'SCRAPER', confidence: number }> => {
  try {
    const ai = getAI();
    // Simulate analyzing the URL structure
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this URL and categorize it into 'SHEET' (Google Sheets/Excel), 'API' (JSON/REST), or 'SCRAPER' (News/HTML). URL: ${url}. Return JSON only.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['SHEET', 'API', 'SCRAPER'] },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{"type": "API", "confidence": 0.5}');
  } catch (e) {
    console.error("AI Detection failed, falling back to regex", e);
    if (url.includes('sheets.google.com') || url.endsWith('.csv')) return { type: 'SHEET', confidence: 1 };
    if (url.includes('api')) return { type: 'API', confidence: 0.9 };
    return { type: 'SCRAPER', confidence: 0.8 };
  }
};

export const processBatchWithAI = async (
  rawData: RawDataRow[], 
  domain: CleaningDomain
): Promise<{ cleanedRows: CleanedDataRow[], logs: string[] }> => {
  
  const apiKey = process.env.API_KEY;
  
  // If no API key, perform a mock "pass-through" cleaning with simple heuristics
  // to prevent the app from crashing during demo.
  if (!apiKey) {
    console.warn("No API Key - using heuristic fallback");
    return {
      cleanedRows: rawData.map(r => ({ ...r, _status: 'CLEAN', _anomalyScore: 0 })),
      logs: ["System: API Key missing. Running in heuristic fallback mode."]
    };
  }

  try {
    const ai = getAI();
    
    const systemPrompt = `
      You are 'DataSentinel', an advanced ML data cleaning pipeline.
      Current Domain Strategy: ${domain}.
      
      Your tasks:
      1. Imputation: Fill missing values based on ${domain} logic (e.g., Mean for general, KNN-style inference for Health).
      2. Anomaly Detection: Calculate an anomaly score (0-1) for each row based on Isolation Forest logic. Flag if score > 0.7.
      3. Normalization: Standardize text (e.g., 'NYC', 'New York' -> 'New York').
      
      Input is a JSON array of rows.
      Output a JSON object containing:
      - cleanedRows: Array of objects with original fields plus:
        - _status: 'CLEAN' | 'IMPUTED' | 'ANOMALY' | 'NORMALIZED'
        - _anomalyScore: number (0-1)
        - _cleaningNotes: array of strings explaining changes
        - _originalValues: object containing any fields that were changed (key: old_value)
      - logs: Array of technical log strings (e.g., "Imputer: Filled null Age with 45 (Median)").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(rawData),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        // We let the model determine the schema dynamically based on input columns
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      cleanedRows: result.cleanedRows || [],
      logs: result.logs || []
    };

  } catch (error) {
    console.error("AI Processing Error:", error);
    return {
      cleanedRows: rawData.map(r => ({ ...r, _status: 'CLEAN', _cleaningNotes: ['AI Processing Failed'] })),
      logs: [`Error: AI pipeline failed - ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};