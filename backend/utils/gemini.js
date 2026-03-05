import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Gen AI client
// Note: We're using @google/genai as requested, which uses api_key standard variable named GEMINI_API_KEY by default from env
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Analyzes a plant image using Gemini 1.5 Flash to identify species, 
 * care requirements, and current health status (Phase 15).
 * 
 * @param {Buffer} imageBuffer 
 * @param {string} mimeType 
 * @returns {Promise<Object>} JSON containing plant analysis
 */
export async function analyzePlantImage(imageBuffer, mimeType) {
    if (!ai) {
        throw new Error("Gemini API key not configured");
    }

    // Convert buffer to base64 for the API
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
    You are an expert botanist and horticulturist. Analyze this plant photo and return a strict JSON object (no markdown formatting, just parseable JSON).
    
    Required properties in JSON:
    1. "species": The scientific or common name of the plant. If you aren't sure, explain what type of plant it looks like.
    2. "waterFrequencyDays": Integer representing how many days between watering on average.
    3. "lightRequirement": A short string (e.g., "Indirect Bright", "Low Light").
    4. "healthStatus": Must be exactly one of ["healthy", "thirsty", "overwatered"]. Base this on the visual evidence (e.g., yellowing leaves, drooping, wet soil).
    5. "smartTip": A short, friendly 1-2 sentence tip offering care advice. If the plant looks "thirsty" or "overwatered", explain why from the photo and advise on recovery.

    If the image is not a plant, return: {"error": "Not a plant"}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                { inlineData: { data: base64Image, mimeType: mimeType } }
            ]
        });

        // Parse JSON from text, accommodating possible markdown JSON blocks
        let rawText = response.text || '';
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(rawText);
        return parsed;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Plant analysis failed');
    }
}
