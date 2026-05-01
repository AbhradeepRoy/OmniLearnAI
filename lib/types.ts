export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'voice';
  timestamp: number;
}

export interface Tutor {
  id: string;
  name: string;
  subject: string;
  personality: string;
  avatar: string;
  color: string;
  description: string;
}

export type SolutionFormat = 'text' | 'slides' | 'voice';

export interface Solution {
  id: string;
  doubtId: string;
  format: SolutionFormat;
  content: unknown;
}

export interface Slide {
  title: string;
  content: string[];
  summary: string;
  imageSearchTerm?: string;
}

export interface AnalysisResult {
  concept: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  subject: string;
  initialExplanation: string;
  suggestedFormat: 'text' | 'slides' | 'voice';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
