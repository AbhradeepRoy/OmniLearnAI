import { generateText, Output } from 'ai';
import { z } from 'zod';

const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string(),
});

const quizSchema = z.array(questionSchema);

export async function POST(req: Request) {
  const { topic, level } = await req.json();

  const { output } = await generateText({
    model: 'google/gemini-2.0-flash-001',
    prompt: `Generate a 5-question multiple choice quiz about "${topic}" for a ${level} level student. 
    Each question should:
    1. Be challenging but fair.
    2. Have 4 options ('options' array of strings).
    3. Specify the index of the correct answer ('correctAnswer' number, 0-indexed).
    4. Provide a brief 'explanation' for the correct answer.`,
    output: Output.object({ schema: quizSchema }),
  });

  return Response.json(output);
}
