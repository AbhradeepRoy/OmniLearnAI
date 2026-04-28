import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeDoubt(
  input: string | { mimeType: string; data: string },
  subjectHint?: string
) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a world-class academic tutor. 
Analyze the student's doubt (text or image). 
Identify the core concept, the complexity level, and the best way to explain it.
Be encouraging and clear.
Available formats: "text", "slides", "voice". NEVER suggest "video".`;

  const contents = typeof input === 'string' 
    ? input 
    : { 
        parts: [
          { inlineData: input }, 
          { text: `Analyze this academic doubt ${subjectHint ? `related to ${subjectHint}` : ''}.` }
        ] 
      };

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          complexity: { type: Type.STRING, enum: ["beginner", "intermediate", "advanced"] },
          subject: { type: Type.STRING },
          initialExplanation: { type: Type.STRING },
          suggestedFormat: { type: Type.STRING, enum: ["text", "slides", "voice"] }
        },
        required: ["concept", "complexity", "subject", "initialExplanation", "suggestedFormat"]
      }
    }
  });

  return JSON.parse(response.text!);
}

export async function generateSlides(topic: string, level: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Generate a 7-slide masterclass-level educational presentation about "${topic}" for a ${level} level student. 
    Each slide MUST be structured with:
    1. A bold, professional 'title'.
    2. A 'content' array of 4-5 high-value, detailed bullet points. Include facts, definitions, and technical details.
    3. A 'summary' providing a "Pro-Tip" or "Key Insight".
    4. An 'imageSearchTerm' which is a precise 3-4 word descriptive phrase to find a high-quality educational photo (e.g., "artificial intelligence neural network visualization", "molecular biology DNA structure").
    
    Structure the flow: 
    - Slide 1: Introduction & Context
    - Slide 2: Core Fundamentals
    - Slide 3: Detailed Working Mechanisms
    - Slide 4: Real-world Applications & Examples
    - Slide 5: Advanced Concepts or Challenges
    - Slide 6: Summary & Quick Recall
    - Slide 7: Future Outlook & Conclusion`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            imageSearchTerm: { type: Type.STRING }
          },
          required: ["title", "content", "summary", "imageSearchTerm"]
        }
      }
    }
  });

  return JSON.parse(response.text!);
}

export async function getChatResponse(messages: { role: string; content: string }[], tutor?: any) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = tutor 
    ? `You are ${tutor.name}, an expert ${tutor.subject} tutor. Your personality is ${tutor.personality}. 
       Help the student solve academic doubts. If they ask for a detailed explanation or a presentation, 
       ACKNOWLEDGE it and say you can generate one using the Scanner. Keep responses academic yet engaging.`
    : `You are OmniBuddy, a friendly academic companion. Help students with motivation, quick study tips, and general queries. 
       Be encouraging and use emojis. You can suggest the student uses the 'Scanner' for deep concept learning and presentations.`;

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const chat = ai.chats.create({
    model,
    config: { systemInstruction },
    history,
  });

  const result = await chat.sendMessage({ message: messages[messages.length - 1].content });
  return result.text;
}

export async function translateText(text: string, targetLanguage: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text without any preamble or quotes: \n\n${text}`
  });
  return response.text;
}

export async function generateQuiz(topic: string, level: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Generate a 5-question multiple choice quiz about "${topic}" for a ${level} level student. 
    Each question should:
    1. Be challenging but fair.
    2. Have 4 options ('options' array of strings).
    3. Specify the index of the correct answer ('correctAnswer' number, 0-indexed).
    4. Provide a brief 'explanation' for the correct answer.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text);
}
