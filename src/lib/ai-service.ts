import Groq from "groq-sdk";
import OpenAI from "openai";
import { generateSystemPrompt, formatConversationHistory, type AIPromptOptions } from "./ai-prompts";

// Initialize clients (lazy-loaded)
let groqClient: Groq | null = null;
let openaiClient: OpenAI | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export interface AIResponse {
  answer: string;
  model: "groq" | "openai" | "none";
  error?: string;
}

/**
 * Main AI service: Try Groq first, fallback to OpenAI
 */
export async function getAIResponse(options: AIPromptOptions): Promise<AIResponse> {
  const { hotelContext, userMessage, conversationHistory } = options;

  const systemPrompt = generateSystemPrompt(hotelContext);
  const history = formatConversationHistory(conversationHistory);

  // Build messages
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  // Try Groq first (fast & cheap)
  try {
    const groq = getGroqClient();
    if (groq) {
      console.log("[AI] Attempting Groq API...");
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile", // Fast, multilingual, cheap
        messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
      });

      const answer = completion.choices[0]?.message?.content?.trim();
      if (answer) {
        console.log("[AI] ✅ Groq success");
        return { answer, model: "groq" };
      }
    }
  } catch (error: unknown) {
    console.error("[AI] ❌ Groq failed:", error instanceof Error ? error.message : String(error));
  }

  // Fallback to OpenAI
  try {
    const openai = getOpenAIClient();
    if (openai) {
      console.log("[AI] Attempting OpenAI API...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cheap & fast alternative
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const answer = completion.choices[0]?.message?.content?.trim();
      if (answer) {
        console.log("[AI] ✅ OpenAI success");
        return { answer, model: "openai" };
      }
    }
  } catch (error: unknown) {
    console.error("[AI] ❌ OpenAI failed:", error instanceof Error ? error.message : String(error));
  }

  // Both failed or no API keys configured
  return {
    answer:
      "I apologize, but I'm currently unable to process your request. Please contact our team directly for assistance.",
    model: "none",
    error: "No AI service available",
  };
}

/**
 * Check if AI services are configured
 */
export function isAIConfigured(): boolean {
  return !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}

/**
 * Detect intent from AI response (check if WA link is present)
 */
export function detectIntent(aiResponse: string): string | null {
  const lowerResponse = aiResponse.toLowerCase();
  if (lowerResponse.includes("whatsapp") || lowerResponse.includes("contact us")) {
    if (lowerResponse.includes("book") || lowerResponse.includes("reserv")) return "booking";
    if (lowerResponse.includes("price") || lowerResponse.includes("rate")) return "pricing";
    return "contact";
  }
  return null;
}
