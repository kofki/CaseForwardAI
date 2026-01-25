import { google } from '@ai-sdk/google';

export function getGeminiModel(modelName: string = 'gemma-3-27b-it') {
  return google(modelName);
}
