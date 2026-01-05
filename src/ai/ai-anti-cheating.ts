
'use server';

/**
 * @fileOverview This file defines an AI-powered flow for code evaluation and anti-cheating analysis.
 *
 * The flow takes student code, exam details, and test cases as input. It analyzes the code for
 * cheating behaviors and evaluates its correctness against the provided test cases.
 *
 * @interface AIAntiCheatingInput - Defines the input schema for the flow.
 * @interface AIAntiCheatingOutput - Defines the output schema for the flow.
 * @function analyzeStudentActivity - The main function to trigger the analysis and evaluation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAntiCheatingInputSchema = z.object({
  videoDataUri: z
    .string()
    .optional()
    .describe(
      "Student video recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  screenDataUri: z
    .string()
    .optional()
    .describe(
      'Student screen recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  studentCode: z
    .string()
    .describe("The code submitted by the student."),
  examDetails: z
    .string()
    .describe('Details about the exam, including topics covered and allowed resources.'),
  testCases: z
    .string()
    .describe('A JSON string representing an array of test cases, each with an "input" and "expectedOutput".'),
  allowInteractiveApis: z.boolean().optional().describe('Whether to allow browser-specific APIs like prompt() and alert().'),
});

export type AIAntiCheatingInput = z.infer<typeof AIAntiCheatingInputSchema>;

const AIAntiCheatingOutputSchema = z.object({
  report: z.string().describe('A detailed report of potential cheating behaviors detected and an explanation of the code\'s correctness.'),
  riskAssessment: z
    .string()
    .describe('Overall risk assessment based on the cheating analysis (e.g., low, medium, high).'),
  testCaseResults: z.array(z.object({
    input: z.any(),
    expectedOutput: z.any(),
    status: z.enum(['passed', 'failed']).describe('Whether the student\'s code passed or failed this test case.'),
    actualOutput: z.any().optional().describe('The actual output produced by the student\'s code logic.')
  })).describe('An array containing the results for each test case execution.')
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
  prompt: `You are an AI proctoring and code evaluation tool. Your objective is to perform two tasks:
  1.  Analyze the student's activity to identify potential cheating behaviors.
  2.  Evaluate the student's code for correctness against a set of test cases.

  ## Exam & Cheating Analysis Details
  - Exam Details: {{{examDetails}}}
  - Analyze the student's code and, if available, their video and screen recording. Look for cheating indicators.
  {{#unless allowInteractiveApis}}
  - In the code, flag the use of unauthorized APIs like 'prompt()', 'alert()', 'document.write()', etc.
  {{/unless}}
  - In video/screen, look for unauthorized devices, websites, or collaboration.
  - Student Code to Analyze:
    \`\`\`
    {{{studentCode}}}
    \`\`\`
  {{#if videoDataUri}}Video Recording: {{media url=videoDataUri}}{{/if}}
  {{#if screenDataUri}}Screen Recording: {{media url=screenDataUri}}{{/if}}

  ## Code Correctness Evaluation
  - You must evaluate the provided student code against the given test cases.
  - The student may have written a script, a function, or used any other valid structure. Your evaluation must be flexible enough to understand the student's logic, regardless of the structure.
  - For each test case, determine if the student's code logic produces the expected output for the given input.
  - Your response MUST include a 'testCaseResults' array with the status ('passed' or 'failed') for each test case.
  - The student's code might use interactive APIs like 'prompt()'. You should reason about the code's logic as if the test case 'input' was provided to those prompts. Do not try to execute them.

  - Test Cases (JSON):
    \`\`\`json
    {{{testCases}}}
    \`\`\`

  ## Final Output
  - Based on your analysis, provide a detailed 'report' explaining both cheating risks and code correctness.
  - Provide an overall 'riskAssessment' (low, medium, or high) for cheating.
  - Provide the 'testCaseResults' array with the outcome for each test case.
  `,
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
