import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateArtworkMetadata = async (base64Image: string, mimeType: string): Promise<GeneratedMetadata> => {
  const model = "gemini-2.5-flash";
  
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A creative, artistic title for the image." },
      description: { type: Type.STRING, description: "A sophisticated, 2-3 sentence description suitable for an art gallery placard." },
      medium: { type: Type.STRING, description: "The estimated artistic medium (e.g., Oil on Canvas, Digital Photography, Charcoal)." },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "5 relevant keywords describing the style and content." 
      }
    },
    required: ["title", "description", "medium", "tags"],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "You are an expert art curator. Analyze this artwork and generate metadata for the portfolio website."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a professional art curator. Your tone is elegant, insightful, and concise. Avoid generic phrases like 'This image shows'. Focus on emotions, lighting, and composition.",
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No text returned from Gemini");
    }

    return JSON.parse(jsonText) as GeneratedMetadata;
  } catch (error) {
    console.error("Error generating metadata:", error);
    throw error;
  }
};
