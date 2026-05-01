import { generateText, Output } from 'ai';
import { z } from 'zod';

const analysisSchema = z.object({
  concept: z.string(),
  complexity: z.enum(["beginner", "intermediate", "advanced"]),
  subject: z.string(),
  initialExplanation: z.string(),
  suggestedFormat: z.enum(["text", "slides", "voice"]),
});

export async function POST(req: Request) {
  const { input, imageData, subjectHint } = await req.json();

  const systemInstruction = `You are a world-class academic tutor. 
Analyze the student's doubt (text or image). 
Identify the core concept, the complexity level, and the best way to explain it.
Be encouraging and clear.
Available formats: "text", "slides", "voice". NEVER suggest "video".`;

  let userContent: string;
  
  if (imageData) {
    userContent = `Analyze this academic doubt ${subjectHint ? `related to ${subjectHint}` : ''}. The image shows: [Image data provided]`;
  } else {
    userContent = input;
  }

  const { output } = await generateText({
    model: 'google/gemini-2.0-flash-001',
    system: systemInstruction,
    prompt: userContent,
    output: Output.object({ schema: analysisSchema }),
  });

  return Response.json(output);
}
