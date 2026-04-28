/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  content: any; // Can be markdown for text, slide data, or audio data
}

export interface Slide {
  title: string;
  content: string[];
  summary: string;
}
