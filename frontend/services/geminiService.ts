import { GoogleGenAI } from "@google/genai";
import { Rate, Transaction, AssetType } from "../types";

// Helper to extract numbers from text if the model returns conversational text
const extractNumber = (text: string, key: string): number | null => {
  const regex = new RegExp(`${key}[:\\s]*([\\d,.]+)`, 'i');
  const match = text.match(regex);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
};

export const fetchMarketRates = async (currentRates: Rate[]): Promise<Rate[]> => {
  if (!process.env.API_KEY || process.env.API_KEY.includes('__APP_')) {
    console.warn("API_KEY not found or invalid in environment variables");
    return currentRates;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // We use search grounding to get real-time data
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for the current market prices in Egypt today. 
I need:
1. Gold Buy price per gram for 24k in EGP.
2. Gold Buy price per gram for 21k in EGP.
3. Silver Buy price per gram in EGP.
4. USD to EGP official bank Buy exchange rate.

for gold use prices from https://egypt.gold-era.com/gold-price/
for silver use prices from https://www.sabika.app/#Calculator

Return ONLY a text block with these exact labels and values:
GOLD: <value>
GOLD_21: <value>
SILVER: <value>
USD: <value>
      `,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    console.log("Gemini Market Data Response:", text);

    // Map keys to the prompt labels
    const updates: Record<string, number | null> = {
      'GOLD': extractNumber(text, 'GOLD'),
      'GOLD_21': extractNumber(text, 'GOLD_21'),
      'SILVER': extractNumber(text, 'SILVER'),
      'USD': extractNumber(text, 'USD')
    };

    const timestamp = new Date().toISOString();

    // Update existing rates
    return currentRates.map(rate => {
      const newVal = updates[rate.key];
      if (newVal !== null && newVal !== undefined && !isNaN(newVal)) {
        return { ...rate, value: newVal, lastUpdated: timestamp };
      }
      return rate;
    });

  } catch (error) {
    console.error("Failed to fetch market rates via Gemini:", error);
    throw error;
  }
};

export const getPortfolioAdvice = async (
  holdings: Record<AssetType, { quantity: number; avgCost: number; currentPrice: number }>,
  language: 'en' | 'ar'
): Promise<string> => {
  if (!process.env.API_KEY || process.env.API_KEY.includes('__APP_')) {
    return language === 'ar'
      ? "عذراً، مفتاح API غير متوفر للحصول على النصيحة."
      : "API Key missing. Cannot generate advice.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const portfolioSummary = Object.entries(holdings)
      .map(([type, data]) => {
        if (data.quantity <= 0) return null;
        const profitLoss = ((data.currentPrice - data.avgCost) / data.avgCost) * 100;
        return `- ${type}: ${data.quantity.toFixed(2)} units. Avg Cost: ${data.avgCost.toFixed(0)} EGP. Current Price: ${data.currentPrice.toFixed(0)} EGP. P/L: ${profitLoss.toFixed(1)}%`;
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `
      You are an expert financial advisor specializing in personal savings in Egypt (Gold, Silver, USD).
      
      User Portfolio Status:
      ${portfolioSummary || "The user currently has no assets."}

      Task:
      Provide 3 short, actionable pieces of advice (Buy, Sell, or Hold) for the user's portfolio.
      
      Logic to follow:
      1. COMPARE the user's Average Cost vs Current Price. 
      2. If Unrealized Gain is high (>20%), suggest considering taking some profit (Sell).
      3. If Unrealized Loss is significant but the long-term trend of the asset (Gold/USD) is positive, suggest Holding or Dollar Cost Averaging (Buy).
      4. If the user has no assets, suggest starting with small amounts (DCA).
      5. Consider diversification between Gold and USD.

      Constraints:
      - Language: ${language === 'ar' ? 'Arabic' : 'English'}
      - Format: Use bullet points.
      - Tone: Professional, cautious, and helpful.
      - Disclaimer: Ensure you mention this is AI generated advice.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a financial consultant. Be concise and data-driven.",
      }
    });

    return response.text || (language === 'ar' ? "لم يتم إنشاء نصيحة." : "No advice generated.");

  } catch (error) {
    console.error("Advice generation failed:", error);
    return language === 'ar' ? "فشل الاتصال بخدمة المستشار الذكي." : "Failed to connect to AI advisor.";
  }
};