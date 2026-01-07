import {genkit, Ai} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai: Ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
