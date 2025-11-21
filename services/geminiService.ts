import { GoogleGenAI } from "@google/genai";

export const generateGameOverComment = async (score: number, nickname: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Гру закінчено! Непоганий результат.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Гравець ${nickname} щойно програв у грі Змійка (Snake) з рахунком ${score}.
      Дай короткий, дотепний, саркастичний або підбадьорливий коментар українською мовою (максимум 1 речення).
      Якщо рахунок менше 10, пожартуй над цим. Якщо більше 50, похвали.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Гру закінчено!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Гру закінчено! Твій рахунок: ${score}`;
  }
};