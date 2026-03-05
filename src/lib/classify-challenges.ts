
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';
import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const ai: Ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

type Challenge = {
  id: string;
  title: string;
  description: string;
  language: string;
  testCases: string;
};

type ChallengeDifficulty = "Básico" | "Medio" | "Avanzado";

async function classifyChallenge(challenge: Challenge): Promise<ChallengeDifficulty> {
  const prompt = `
    Analiza el siguiente reto de programación y clasifícalo como "Básico", "Medio" o "Avanzado".

    Título: ${challenge.title}
    Descripción: ${challenge.description}
    Lenguaje: ${challenge.language}
    Casos de Prueba: ${challenge.testCases}
  `;

  const response = await ai.generateText({
    prompt: prompt,
    temperature: 0.3,
  });

  const classification = response.text().trim();

  if (classification === "Básico" || classification === "Medio" || classification === "Avanzado") {
    return classification;
  }

  // Fallback por si la IA no devuelve una clasificación válida
  return "Medio";
}

export async function classifyAndSaveChallenges() {
  const challengesCol = collection(db, 'challenges');
  const snapshot = await getDocs(challengesCol);

  for (const docSnap of snapshot.docs) {
    const challenge = { id: docSnap.id, ...docSnap.data() } as Challenge;
    const difficulty = await classifyChallenge(challenge);
    await updateDoc(doc(db, 'challenges', challenge.id), {
      difficulty: difficulty,
    });
    console.log(`Clasificado reto "${challenge.title}" como ${difficulty}`)
  }
}
