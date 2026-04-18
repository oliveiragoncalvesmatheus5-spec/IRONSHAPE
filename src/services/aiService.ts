import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Workout, Exercise } from "../types";

// @ts-ignore
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
const ai = new GoogleGenAI({ apiKey: geminiKey });

export async function generatePersonalizedWorkout(profile: UserProfile): Promise<Workout> {
  const prompt = `Crie um treino personalizado para um usuário com o seguinte perfil:
    Nome: ${profile.name}
    Idade: ${profile.age}
    Peso: ${profile.weight}kg
    Altura: ${profile.height}cm
    Objetivo: ${profile.goal}
    Plano: ${profile.plano}
    
    O treino deve ser focado no objetivo dele e adequado para o nível do plano.
    Retorne um objeto JSON com: name, description, muscleGroup e uma lista de exercises (cada um com name, series, reps, restTime, muscleGroup).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          muscleGroup: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                series: { type: Type.NUMBER },
                reps: { type: Type.STRING },
                restTime: { type: Type.STRING },
                muscleGroup: { type: Type.STRING }
              },
              required: ["name", "series", "reps", "restTime", "muscleGroup"]
            }
          }
        },
        required: ["name", "description", "muscleGroup", "exercises"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    id: crypto.randomUUID(),
    planRequired: profile.plano,
    authorUid: 'system'
  };
}

export async function generateNutritionPlan(profile: UserProfile) {
  const prompt = `Crie um plano nutricional para um usuário com o seguinte perfil:
    Objetivo: ${profile.goal}
    Peso: ${profile.weight}kg
    Altura: ${profile.height}cm
    Idade: ${profile.age}
    
    Calcule os macros diários (calorias, proteínas, carboidratos, gorduras) e sugira 4 refeições.
    Retorne um objeto JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                time: { type: Type.STRING },
                foods: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
