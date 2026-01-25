import { google } from '@ai-sdk/google';

export function getGeminiModel(modelName: string = 'gemini-2.5-flash') {
  return google(modelName);
}
