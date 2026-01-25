import { google } from '@ai-sdk/google';

/**
 * Get a configured Gemini model instance.
 * 
 * @param modelName - The model to use (e.g., 'gemini-2.5-flash', 'gemini-2.5-flash-lite')
 * @returns The Vercel AI SDK language model instance
 */
export const getGeminiModel = (modelName: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' = 'gemini-2.5-flash') => {
    return google(modelName, {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
    });
};

// Export the google provider for direct use if needed
export { google };
