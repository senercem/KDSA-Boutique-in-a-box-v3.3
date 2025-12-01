import { GoogleGenAI, Type } from "@google/genai";
import { PremortemScenario } from "../types";

// Initialize Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExternalBenchmarkResult {
  summary: string;
  sources: { title: string; uri: string }[];
}

export const fetchExternalBenchmarks = async (riskCategories: string[]): Promise<ExternalBenchmarkResult> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Analyze the following organizational risk factors in the context of 2024-2025 industry trends: ${riskCategories.join(', ')}.
    
    Provide a concise "External Risk Intelligence" summary (max 3 sentences) highlighting:
    1. Recent benchmarks or failure rates in the industry.
    2. Emerging external threats related to these human factors.
    
    Do not give generic advice. Focus on external data/trends.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
        }
      });
    }

    return {
      summary: response.text || "No external intelligence available.",
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return {
      summary: "Unable to connect to external intelligence network.",
      sources: []
    };
  }
};

export const generatePremortemAnalysis = async (
  decisionContext: string,
  riskFactors: string
): Promise<PremortemScenario[]> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are the 'Decision Engine' (M2) of the KDSA architecture. Your goal is to act as a 'Cognitive Circuit-Breaker' to de-bias a high-stakes executive decision.
    
    Context:
    The organization is planning: "${decisionContext}"
    
    Detected Human-Factor Risks (from M1 ACORE):
    ${riskFactors}
    
    Task:
    Conduct a 'Pre-mortem' analysis. Assume the project has FAILED catastrophically 1 year from now.
    Identify 3 specific, plausible reasons why it failed, rooted in the provided risks and common cognitive biases (Optimism Bias, Sunk Cost, etc.).
    For each reason, provide a concrete mitigation strategy.

    Return the response as a JSON object matching the following schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING, description: "The failure scenario description" },
              probability: { type: Type.STRING, description: "Likelihood (Low/Medium/High)" },
              impact: { type: Type.STRING, description: "Business Impact (Critical/Severe/Moderate)" },
              mitigation: { type: Type.STRING, description: "Actionable step to prevent this" }
            },
            required: ["scenario", "probability", "impact", "mitigation"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PremortemScenario[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback mock data in case of API failure or missing key
    return [
      {
        scenario: "Cultural Rejection",
        probability: "High",
        impact: "Critical",
        mitigation: "Implement 'Psychological Safety' workshops before tech rollout."
      },
      {
        scenario: "Executive Blindness",
        probability: "Medium",
        impact: "Severe",
        mitigation: "Establish a 'Red Team' to challenge steering committee assumptions."
      },
      {
        scenario: "Change Saturation",
        probability: "High",
        impact: "Critical",
        mitigation: "Pause all non-essential initiatives for 3 months to recover capacity."
      }
    ];
  }
};

export const draftGovernancePolicy = async (topic: string, framework: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    You are an expert AI Governance & Compliance Officer.
    Draft a formal, concise governance policy statement regarding: "${topic}".
    
    Ensure it aligns specifically with the requirements of: ${framework}.
    
    Tone: Formal, authoritative, binding.
    Length: 1 paragraph (approx 50-80 words).
    Do not include markdown formatting or headings, just the policy text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });
    return response.text || "Policy drafting failed. Please enter manually.";
  } catch (error) {
    console.error("Gemini Policy Draft Error:", error);
    return "Service unavailable. Please draft policy manually.";
  }
};