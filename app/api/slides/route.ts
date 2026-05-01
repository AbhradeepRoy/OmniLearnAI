import { generateText, Output } from 'ai';
import { z } from 'zod';

const slideSchema = z.object({
  title: z.string(),
  content: z.array(z.string()),
  summary: z.string(),
  imageSearchTerm: z.string(),
});

const slidesArraySchema = z.array(slideSchema);

export async function POST(req: Request) {
  const { topic, level } = await req.json();

  const { output } = await generateText({
    model: 'google/gemini-2.0-flash-001',
    prompt: `Generate a 7-slide masterclass-level educational presentation about "${topic}" for a ${level} level student. 
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
    output: Output.object({ schema: slidesArraySchema }),
  });

  return Response.json(output);
}
