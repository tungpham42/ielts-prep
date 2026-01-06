import { Handler } from "@netlify/functions";
import Groq from "groq-sdk";

// Initialize Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Priority list: High intelligence -> High Speed -> Different Architecture
const MODELS = [
  "openai/gpt-oss-120b", // Model chính
  "openai/gpt-oss-20b", // Model dự phòng
  "qwen/qwen3-32b", // Model phụ
  "llama-3.3-70b-versatile", // Model thông minh nhất
  "llama-3.1-8b-instant", // Model nhanh nhất
];

interface ChatRequest {
  prompt: string;
  systemMessage?: string;
  maxTokens?: number;
}

/**
 * Recursive function to attempt chat completion with model fallback
 */
const generateWithFallback = async (
  messages: any[],
  maxTokens: number,
  modelIndex: number = 0
): Promise<{ content: string; modelUsed: string }> => {
  // Base case: If we've run out of models to try
  if (modelIndex >= MODELS.length) {
    throw new Error(
      "All models failed to respond (Rate limited or Server down)."
    );
  }

  const currentModel = MODELS[modelIndex];

  try {
    console.log(`Attempting with model: ${currentModel}`);

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: currentModel,
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    return {
      content: chatCompletion.choices[0]?.message?.content || "",
      modelUsed: currentModel,
    };
  } catch (error: any) {
    // Check for specific error codes to trigger retry
    const status = error?.status || error?.response?.status;

    // 429 = Too Many Requests (Rate Limit)
    // 5xx = Server Errors (Groq internal issues)
    if (status === 429 || (status >= 500 && status < 600)) {
      console.warn(
        `Error ${status} with ${currentModel}. Switching to next model...`
      );
      // Recursive call with the next model index
      return generateWithFallback(messages, maxTokens, modelIndex + 1);
    }

    // If it's a 400 (Bad Request) or 401 (Auth), do not retry.
    console.error(`Fatal error with ${currentModel}:`, error.message);
    throw error;
  }
};

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt, systemMessage, maxTokens } = JSON.parse(
      event.body || "{}"
    ) as ChatRequest;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    const messages = [
      {
        role: "system",
        content: systemMessage || "You are a helpful IELTS tutor.",
      },
      { role: "user", content: prompt },
    ];

    // Start the recursive chain
    const result = await generateWithFallback(messages, maxTokens || 4096);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: result.content,
        model: result.modelUsed, // Useful for debugging on frontend
      }),
    };
  } catch (error: any) {
    console.error("Final Handler Error:", error);

    return {
      statusCode: error.status || 500,
      body: JSON.stringify({
        error:
          error.message ||
          "An unexpected error occurred processing your request.",
      }),
    };
  }
};
