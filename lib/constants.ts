import { Tutor } from './types';

export const TUTORS: Tutor[] = [
  {
    id: 'math-expert',
    name: 'Dr. Euler',
    subject: 'Mathematics',
    personality: 'Logical, detailed, and encouraging. Uses real-world analogies to explain complex formulas.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    color: 'blue',
    description: 'Expert in Algebra, Calculus, and Geometry.'
  },
  {
    id: 'science-guide',
    name: 'Professor Curie',
    subject: 'Science',
    personality: 'Curious, energetic, and visual. Loves diagrams and experimental thinking.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    color: 'emerald',
    description: 'Specializes in Physics, Chemistry, and Biology.'
  },
  {
    id: 'language-tutor',
    name: 'Linguia',
    subject: 'Languages & Literature',
    personality: 'Articulate, patient, and creative. Focuses on context, grammar, and storytelling.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    color: 'purple',
    description: 'English, Spanish, and Literature expert.'
  }
];

export const APP_NAME = 'OmniLearn AI';
