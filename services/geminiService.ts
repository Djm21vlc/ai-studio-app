import { GoogleGenAI } from "@google/genai";
import { Collection, Sticker } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  analyzeCollection: async (
    collection: Collection,
    allStickers: Sticker[],
    userQuery: string
  ): Promise<string> => {
    // Prepare context data
    const totalStickers = allStickers.length;
    const ownedIds = Object.keys(collection);
    const totalOwned = ownedIds.length;
    const totalRepeated = ownedIds.reduce((acc, id) => acc + (collection[id] > 1 ? collection[id] - 1 : 0), 0);
    const missingCount = totalStickers - totalOwned;

    // Create a summarized text representation of the collection status
    // To avoid token limits, we summarize by team stats rather than listing every single sticker
    const teamStats: Record<string, { owned: number; total: number; repeated: number }> = {};
    
    allStickers.forEach(sticker => {
      if (!teamStats[sticker.team]) {
        teamStats[sticker.team] = { owned: 0, total: 0, repeated: 0 };
      }
      teamStats[sticker.team].total += 1;
      const count = collection[sticker.id] || 0;
      if (count > 0) {
        teamStats[sticker.team].owned += 1;
      }
      if (count > 1) {
        teamStats[sticker.team].repeated += (count - 1);
      }
    });

    const context = `
      Datos de la colección de cromos:
      - Total de cromos en el álbum: ${totalStickers}
      - Cromos tenidos: ${totalOwned}
      - Cromos faltantes: ${missingCount}
      - Cromos repetidos (para cambiar): ${totalRepeated}
      
      Desglose por equipos:
      ${JSON.stringify(teamStats, null, 2)}
      
      Usuario pregunta: "${userQuery}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: context
              }
            ]
          }
        ],
        config: {
          systemInstruction: `Eres un experto analista de colecciones de cromos deportivos. 
          Tu objetivo es ayudar al usuario a completar su álbum. 
          Sé conciso, animado y usa emojis deportivos. 
          Si preguntan qué equipos están cerca de completar, usa los datos.
          Si preguntan por estrategias de cambio, sugiere basándote en los repetidos.
          Responde siempre en español.`
        }
      });

      return response.text || "No pude generar un análisis en este momento.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Hubo un error conectando con el asistente inteligente. Por favor intenta más tarde.";
    }
  }
};