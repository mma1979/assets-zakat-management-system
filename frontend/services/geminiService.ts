import { GoogleGenAI } from "@google/genai";
import { Rate, Transaction, AssetType } from "../types";

const extractJSON = (text: string): Record<string, number> | null => {
  try {
    // Remove code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Try to find JSON object in text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response", e);
    return null;
  }
};

export const fetchMarketRates = async (currentRates: Rate[], apiKey?: string): Promise<Rate[]> => {
  const key = apiKey;
  if (!key) {
    console.warn("API Key not provided");
    return currentRates;
  }

  const ratesToFetch = currentRates.filter(r => r.key !== 'EGP');
  if (ratesToFetch.length === 0) return currentRates;

  try {
    const ai = new GoogleGenAI({ apiKey: key });

    const itemsList = ratesToFetch.map(r => `"${r.key}": Price of ${r.title || r.key} in EGP`).join('\n');

    // We use search grounding to get real-time data
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for the current market prices in Egypt today.
I need the current Buy prices in EGP for the following assets:
${itemsList}

For Gold use prices from https://egypt.gold-era.com/gold-price/ if available.
For Silver use prices from https://www.sabika.app/#Calculator if available.

Return ONLY a valid JSON object with the exact keys specified above and numeric values.
Example:
{
  "GOLD": 3500.50,
  "USD": 49.20
}`,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" // Unsupported with tools
      }
    });

    const text = response.text || "";
    console.log("Gemini Market Data Response:", text);

    const updates = extractJSON(text);

    if (!updates) {
      console.warn("No valid JSON found in Gemini response");
      return currentRates;
    }

    const timestamp = new Date().toISOString();

    // Update existing rates
    return currentRates.map(rate => {
      // Skip EGP
      if (rate.key === 'EGP') return rate;

      // Check if we have an update
      if (updates.hasOwnProperty(rate.key)) {
        const newVal = updates[rate.key];
        if (typeof newVal === 'number' && !isNaN(newVal)) {
          return { ...rate, value: newVal, lastUpdated: timestamp };
        }
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
  language: 'en' | 'ar',
  apiKey?: string
): Promise<string> => {
  const key = apiKey;
  if (!key) {
    return language === 'ar'
      ? "عذراً، مفتاح API غير متوفر للحصول على النصيحة. يرجى إضافته في الإعدادات."
      : "API Key missing. Please add it in Settings.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });

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