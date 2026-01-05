'use server';

/**
 * @fileOverview This file defines an AI-powered anti-cheating flow for analyzing student video and screen activity.
 *
 * The flow takes video and screen recording data as input, analyzes it for potential cheating behaviors,
 * and returns a report with identified risks.
 *
 * @interface AIAntiCheatingInput - Defines the input schema for the anti-cheating flow.
 * @interface AIAntiCheatingOutput - Defines the output schema for the anti-cheating flow.
 * @function analyzeStudentActivity - The main function to trigger the anti-cheating analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAntiCheatingInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'Student video recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected description
    ),
  screenDataUri: z
    .string()
    .describe(
      'Student screen recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected description
    ),
  examDetails: z
    .string()
    .describe('Details about the exam, including topics covered and allowed resources.'),
});

export type AIAntiCheatingInput = z.infer<typeof AIAntiCheatingInputSchema>;

const AIAntiCheatingOutputSchema = z.object({
  report: z.string().describe('A detailed report of potential cheating behaviors detected.'),
  riskAssessment: z
    .string()
    .describe('Overall risk assessment based on the analysis (e.g., low, medium, high).'),
});

export type AIAntiCheatingOutput = z.infer<typeof AIAntiCheatingOutputSchema>;

export async function analyzeStudentActivity(
  input: AIAntiCheatingInput
): Promise<AIAntiCheatingOutput> {
  return aiAntiCheatingFlow(input);
}

const aiAntiCheatingPrompt = ai.definePrompt({
  name: 'aiAntiCheatingPrompt',
  input: {schema: AIAntiCheatingInputSchema},
  output: {schema: AIAntiCheatingOutputSchema},
  prompt: `You are an AI proctoring tool. Your objective is to analyze the video and screen recording of a student during an exam to identify potential cheating behaviors.

  Exam Details: {{{examDetails}}}

  Analyze the student's video and screen recording, looking for the following indicators:
  - Use of unauthorized devices (e.g., phones, tablets)
  - Access to unauthorized websites or applications
  - Collaboration with other individuals
  - Suspicious eye movements or body language
  - Copying and pasting from external sources

  Based on your analysis, provide a detailed report of any potential cheating behaviors detected and an overall risk assessment (low, medium, or high).

  Video Recording: {{media url=videoDataUri}}
  Screen Recording: {{media url=screenDataUri}}`,
});

const aiAntiCheatingFlow = ai.defineFlow(
  {
    name: 'aiAntiCheatingFlow',
    inputSchema: AIAntiCheatingInputSchema,
    outputSchema: AIAntiCheatingOutputSchema,
  },
  async input => {
    const {output} = await aiAntiCheatingPrompt(input);
    return output!;
  }
);
