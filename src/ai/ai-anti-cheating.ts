'use server';

/**
 * @fileOverview This file defines an AI-powered flow for code evaluation and anti-cheating analysis.
 *
 * The flow takes student code, exam details, and test cases as input. It analyzes the code for
 * cheating behaviors, evaluates its correctness against test cases, assigns a grade, and identifies skills.
 *
 * @interface AIAntiCheatingInput - Defines the input schema for the flow.
 * @interface AIAntiCheatingOutput - Defines the output schema for the flow.
 * @function analyzeStudentActivity - The main function to trigger the analysis and evaluation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

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

type AIAntiCheatingInput = z.infer<typeof AIAntiCheatingInputSchema>;

const AIAntiCheatingOutputSchema = z.object({
  report: z.string().describe('Un reporte detallado en español de los posibles comportamientos de trampa detectados y una explicación de la corrección del código.'),
  riskAssessment: z
    .string()
    .describe('Evaluación general del riesgo en español (por ejemplo, "Bajo", "Medio", "Alto").'),
  testCaseResults: z.array(z.object({
    input: z.any(),
    expectedOutput: z.any(),
    status: z.enum(['passed', 'failed']).describe('Si el código del estudiante pasó o falló este caso de prueba.'),
    actualOutput: z.any().optional().describe('El resultado real producido por la lógica del código del estudiante.')
  })).describe('Un array que contiene los resultados de la ejecución de cada caso de prueba.'),
  grade: z.number().min(1).max(5).describe('Una calificación numérica de 1 a 5 basada en la efectividad del código y el cumplimiento de los requisitos.'),
  developedSkills: z.array(z.string()).describe('Una lista de 2-3 habilidades de programación clave (ej. "Manipulación de Arrays", "Lógica Condicional") que el estudiante demostró en su solución.'),
});


type AIAntiCheatingOutput = z.infer<typeof AIAntiCheatingOutputSchema>;

export async function analyzeStudentActivity(
  input: AIAntiCheatingInput
): Promise<AIAntiCheatingOutput> {
  return aiAntiCheatingFlow(input);
}

const aiAntiCheatingPrompt = ai.definePrompt({
  name: 'aiAntiCheatingPrompt',
  input: {schema: AIAntiCheatingInputSchema},
  output: {schema: AIAntiCheatingOutputSchema},
  prompt: `Eres una herramienta de IA para supervisión y evaluación de código. Tu respuesta DEBE estar completamente en español. Tus objetivos son:
  1. Analizar la actividad del estudiante para identificar posibles trampas.
  2. Evaluar la corrección del código del estudiante frente a un conjunto de casos de prueba.
  3. Asignar una calificación numérica de 1 a 5.
  4. Identificar las habilidades de programación demostradas.

  ## Detalles del Examen y Análisis de Trampas
  - Detalles del Examen: {{{examDetails}}}
  - Analiza el código y, si están disponibles, el video y la grabación de pantalla del estudiante. Busca indicadores de trampa.
  {{#unless allowInteractiveApis}}
  - En el código, marca el uso de APIs no autorizadas como 'prompt()', 'alert()', 'document.write()', etc.
  {{/unless}}
  - En el video/pantalla, busca dispositivos, sitios web o colaboración no autorizados.
  - Código del Estudiante a Analizar:
    \`\`\`
    {{{studentCode}}}
    \`\`\`
  {{#if videoDataUri}}Grabación de Video: {{media url=videoDataUri}}{{/if}}
  {{#if screenDataUri}}Grabación de Pantalla: {{media url=screenDataUri}}{{/if}}

  ## Evaluación de la Corrección y Calificación
  - Debes evaluar el código del estudiante proporcionado frente a los casos de prueba dados.
  - El estudiante puede haber escrito un script, una función o cualquier otra estructura válida. Tu evaluación debe ser lo suficientemente flexible como para entender la lógica del estudiante, independientemente de la estructura.
  - Para cada caso de prueba, determina si la lógica del código del estudiante produce la salida esperada.
  - Tu respuesta DEBE incluir un array 'testCaseResults' con el estado ('passed' o 'failed') para cada caso de prueba.
  - El código del estudiante podría usar APIs interactivas como 'prompt()'. Debes razonar sobre la lógica como si la 'input' del caso de prueba se proporcionara a esos prompts. No intentes ejecutarlos.

  - Casos de Prueba (JSON):
    \`\`\`json
    {{{testCases}}}
    \`\`\`

  ## Calificación (1-5)
  Asigna una calificación ('grade') basada en estos criterios:
  - 5: El código es correcto, pasa todos los casos de prueba y sigue las mejores prácticas y parámetros del desafío.
  - 4: El código es funcional y pasa la mayoría de los casos de prueba, pero tiene errores menores o no es óptimo.
  - 3: El código produce una respuesta pero no sigue los parámetros solicitados o falla en varios casos de prueba.
  - 2: El código tiene errores de sintaxis graves o una lógica muy defectuosa que impide que se complete la mayoría de los casos de prueba.
  - 1: El código está incompleto, no da una respuesta coherente o no tiene relación con el problema.

  ## Habilidades Desarrolladas
  - Analiza el código y extrae una lista de 2 a 3 habilidades clave que el estudiante aplicó. Ejemplos: "Manipulación de Strings", "Algoritmos de Búsqueda", "Programación Orientada a Objetos", "Manejo de Errores". Asigna esto al campo 'developedSkills'.

  ## Salida Final
  - Proporciona un 'report' detallado.
  - Proporciona una 'riskAssessment' general.
  - Proporciona el array 'testCaseResults'.
  - Proporciona el 'grade' numérico.
  - Proporciona el array 'developedSkills'.
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
