import { generateText } from 'ai';

export async function POST(req: Request) {
  const { text, targetLanguage } = await req.json();

  const { text: translated } = await generateText({
    model: 'google/gemini-2.0-flash-001',
    prompt: `Translate the following text to ${targetLanguage}. Return ONLY the translated text without any preamble or quotes: \n\n${text}`,
  });

  return Response.json({ translated });
}
