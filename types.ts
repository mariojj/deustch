
export interface Word {
  spanish: string;
  german: string;
  audioUrl: string;
  column4: string; // Placeholder for the 4th column to preserve it
  timesFailed: number;
}

export type GameState = 'setup' | 'playing' | 'results';

export type AnswerFeedback = 'correct' | 'incorrect' | null;