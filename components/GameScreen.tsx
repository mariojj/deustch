import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Word, AnswerFeedback } from '../types';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';
import RepeatIcon from './icons/RepeatIcon';

interface GameScreenProps {
  words: Word[];
  onGameFinish: (score: number, failedWords: Word[], allWords: Word[]) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ words, onGameFinish }) => {
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [failedWords, setFailedWords] = useState<Word[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [isGermanWordVisible, setIsGermanWordVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when words prop changes (e.g., for a review session)
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setGameWords(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setFailedWords([]);
    setFeedback(null);
    setUserInput('');
    setIsGermanWordVisible(false);
  }, [words]);

  const currentWord = gameWords[currentIndex];

  useEffect(() => {
    if (currentWord && audioRef.current) {
      audioRef.current.src = currentWord.audioUrl;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      inputRef.current?.focus();
    }
  }, [currentWord]);

  const handleRepeatAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to the start
      audioRef.current.play().catch(e => console.error("Audio playback failed on repeat:", e));
    }
  };

  const handleNextWord = useCallback(() => {
    setFeedback(null);
    setUserInput('');
    setIsGermanWordVisible(false); // Hide word for the next round
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback || !currentWord) return; // Prevent multiple submissions

    const isCorrect = userInput.trim().toLowerCase() === currentWord.spanish.toLowerCase();
    
    let updatedFailedWords = failedWords;
    let finalGameWords = gameWords;

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      
      const updatedWord = { ...currentWord, timesFailed: (currentWord.timesFailed || 0) + 1 };
      
      finalGameWords = gameWords.map((word, index) => 
        index === currentIndex ? updatedWord : word
      );
      setGameWords(finalGameWords);

      updatedFailedWords = [...failedWords, updatedWord];
      setFailedWords(updatedFailedWords);
    }

    const isLastWord = currentIndex + 1 >= gameWords.length;
    const finalScore = isCorrect ? score + 1 : score;

    setTimeout(() => {
      if (isLastWord) {
        onGameFinish(finalScore, updatedFailedWords, finalGameWords);
      } else {
        handleNextWord();
      }
    }, isCorrect ? 1000 : 1500);
  };

  const getBorderColor = () => {
    if (feedback === 'correct') return 'border-green-500';
    if (feedback === 'incorrect') return 'border-red-500';
    return 'border-slate-300 dark:border-slate-600';
  };

  if (!currentWord) {
    return <div className="text-center">Loading words...</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl">
        <div className="text-right text-sm text-slate-500 dark:text-slate-400 mb-4 font-mono">
          {currentIndex + 1} / {gameWords.length}
        </div>
        
        <div className="relative mb-6 text-center flex flex-col justify-center items-center" style={{ minHeight: '130px' }}>
            <p className="text-slate-500 dark:text-slate-400 mb-2">Translate this word:</p>
            <div className="flex flex-col items-center justify-center" style={{minHeight: '60px'}}>
                {isGermanWordVisible ? (
                    <h2 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-slate-100">{currentWord.german}</h2>
                ) : (
                    <button
                        onClick={() => setIsGermanWordVisible(true)}
                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                        aria-label="Show word"
                    >
                        Show Word
                    </button>
                )}
            </div>
             <button
                onClick={handleRepeatAudio}
                className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 font-semibold py-2 px-4 rounded-lg transition-colors text-sm mt-4"
                aria-label="Repeat audio"
            >
                <RepeatIcon className="h-4 w-4" />
                Repeat Audio
            </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={!!feedback}
              placeholder="Type the Spanish translation"
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors duration-300 ${getBorderColor()}`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                {feedback === 'correct' && <CheckIcon className="h-6 w-6 text-green-500" />}
                {feedback === 'incorrect' && <XIcon className="h-6 w-6 text-red-500" />}
            </div>
          </div>
        </form>

        {feedback === 'incorrect' && (
            <div className="mt-4 text-center text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                Correct answer: <span className="font-bold">{currentWord.spanish}</span>
            </div>
        )}
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default GameScreen;