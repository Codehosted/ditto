import { GoogleGenAI, Type } from '@google/genai';

// Initialize the SDK
// The API key is automatically injected by AI Studio into process.env.GEMINI_API_KEY
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface DeceasedLocation {
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export const generateNextStepsAndDocs = async (location: DeceasedLocation) => {
  const ai = getAiClient();
  const locationStr = `${location.city}, ${location.county ? location.county + ' County, ' : ''}${location.state} ${location.zipCode}`;
  
  const prompt = `
    A user's loved one has just passed away in ${locationStr}.
    I need you to do a web search to demystify the next steps for them.
    
    Return a JSON object with two main sections:
    1. 'nextSteps': containing 'immediateActions' (24-48 hours), 'shortTermActions' (first week), and 'longTermActions' (coming months).
    2. 'requiredDocuments': an array of documents they will need (e.g., Death Certificate, Letters Testamentary). For EACH document, provide specific 'obtainingGuidance' on exactly how they will obtain these documents based on the geography provided (${locationStr}). Include real office names or websites if possible.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt + "\n\nReturn ONLY valid JSON. Do not include markdown formatting.",
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  if (!response.text) throw new Error("Failed to generate next steps");
  
  let jsonStr = response.text.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  
  return JSON.parse(jsonStr);
};

export const findLocalBusinesses = async (location: DeceasedLocation) => {
  const ai = getAiClient();
  const locationStr = `${location.city}, ${location.state} ${location.zipCode}`;
  
  const prompt = `
    Find real, highly-rated local businesses in or near ${locationStr} for the following categories:
    1. Florist (flowers)
    2. Funeral Home
    3. Cemetery
    4. Church or Place of Worship
    5. Casket Company or Funeral Supply
    
    Return a JSON array of these businesses.
  `;

  // Note: googleMaps tool cannot be used with responseSchema/responseMimeType.
  // We will ask for JSON in the prompt and parse it.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt + "\n\nReturn ONLY valid JSON in the following format: [{ \"category\": \"flowers|funeral_home|cemetery|church|casket_company\", \"name\": \"Business Name\", \"address\": \"Full Address\", \"rating\": 4.5, \"websiteUrl\": \"https://...\", \"phoneNumber\": \"555-1234\" }]",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        // We don't have exact lat/lng, but the text prompt will guide the map search
      }
    }
  });

  if (!response.text) throw new Error("Failed to find local businesses");
  
  // Clean up markdown formatting if present
  let jsonStr = response.text.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse business JSON:", jsonStr);
    return [];
  }
};
