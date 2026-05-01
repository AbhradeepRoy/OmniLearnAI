import { streamText, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  const { messages, tutor } = await req.json();

  const systemInstruction = tutor 
    ? `You are ${tutor.name}, an expert ${tutor.subject} tutor. Your personality is ${tutor.personality}. 
       Help the student solve academic doubts. If they ask for a detailed explanation or a presentation, 
       ACKNOWLEDGE it and say you can generate one using the Scanner. Keep responses academic yet engaging.`
    : `You are OmniBuddy, a friendly academic companion. Help students with motivation, quick study tips, and general queries. 
       Be encouraging and use emojis. You can suggest the student uses the 'Scanner' for deep concept learning and presentations.`;

  const result = streamText({
    model: 'google/gemini-2.0-flash-001',
    system: systemInstruction,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
