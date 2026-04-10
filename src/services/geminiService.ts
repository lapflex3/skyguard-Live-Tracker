import { GoogleGenAI } from "@google/genai";
import { RadarTarget } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeThreats(targets: RadarTarget[]) {
  if (!process.env.GEMINI_API_KEY) return "AI Analysis Offline: Missing API Key";

  const prompt = `
    As a Military Intelligence AI, analyze the following radar targets and provide a brief tactical summary.
    Identify the most dangerous threats and suggest prioritization.
    
    Targets:
    ${targets.map(t => `- ${t.id}: ${t.type}, Alt: ${t.alt}m, Spd: ${t.speed}km/h, Threat: ${t.threatLevel}`).join('\n')}
    
    Format the response as a concise military report (max 100 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Tactical analysis failed. System degraded.";
  }
}

export async function getTargetVisual(target: RadarTarget) {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `Generate a high-resolution military reconnaissance image of a ${target.type} at ${target.alt} meters altitude. The environment is ${target.lat > 0 ? 'tropical' : 'arctic'}. The target is ${target.threatLevel} threat. Cinematic, realistic, thermal vision style.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}
