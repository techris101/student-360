import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const google = createGoogleGenerativeAI({
  apiKey: apiKey || "",
});

export const modelFast = google(
  process.env.AI_MODEL_FAST || "gemini-2.5-flash-lite"
);

export const modelSmart = google(
  process.env.AI_MODEL_SMART || "gemini-2.5-flash"
);
