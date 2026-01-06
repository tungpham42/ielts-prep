import axios from "axios";

export const fetchAIResponse = async (
  prompt: string,
  systemMessage: string
) => {
  try {
    // Calls the local Netlify function (or production URL)
    const response = await axios.post("/.netlify/functions/groq-api", {
      prompt,
      systemMessage,
    });
    return response.data.content;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};
