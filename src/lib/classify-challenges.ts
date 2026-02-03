
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';
import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const app = initializeApp(firebaseConfig);
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

    Responde únicamente con una de las tres opciones: "Básico", "Medio" o "Avanzado".
  `;

  const response = await ai.generateText({ prompt });
  const classification = response.text().trim();

  if (["Básico", "Medio", "Avanzado"].includes(classification)) {
    return classification as ChallengeDifficulty;
  }

  return "Básico"; // Default a Básico si la respuesta no es válida
}

async function classifyAndApplyDifficulty() {
  const challengesRef = collection(db, 'challenges');
  const challengesSnapshot = await getDocs(challengesRef);

  for (const challengeDoc of challengesSnapshot.docs) {
    const challenge = { id: challengeDoc.id, ...challengeDoc.data() } as Challenge;

    if (!challengeDoc.data().difficulty) { // Solo clasificar si no tiene dificultad
      const difficulty = await classifyChallenge(challenge);
      const challengeToUpdateRef = doc(db, 'challenges', challenge.id);
      await updateDoc(challengeToUpdateRef, { difficulty });
      console.log(`Reto "${challenge.title}" clasificado como "${difficulty}"`);
    }
  }

  console.log('Clasificación de retos completada.');
}

classifyAndApplyDifficulty();
