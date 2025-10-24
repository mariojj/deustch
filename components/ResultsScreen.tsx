import React from 'react';
import { Word } from '../types';

// This script assumes the xlsx library is loaded from a CDN and available as `XLSX` global.
declare const XLSX: any;

interface ResultsScreenProps {
  score: number;
  totalWords: number;
  onRestart: () => void;
  failedWords: Word[];
  onReview: () => void;
  allWords: Word[];
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, totalWords, onRestart, failedWords, onReview, allWords }) => {
  const percentage = totalWords > 0 ? ((score / totalWords) * 100).toFixed(0) : 0;
  
  const getFeedbackMessage = (p: number) => {
    if (p >= 90) return "Excellent work! You're a vocabulary master!";
    if (p >= 70) return "Great job! Keep practicing to get even better.";
    if (p >= 50) return "Good effort! A little more practice will make a big difference.";
    return "Keep trying! Every attempt is a step forward.";
  }
  
  const numericPercentage = Number(percentage);

  const handleDownload = () => {
    const header = ["Alemán", "Español", "URL de Audio", "Notas", "Veces Fallado"];
    const data = allWords.map(word => [
      word.german,
      word.spanish,
      word.audioUrl,
      word.column4,
      word.timesFailed,
    ]);

    const worksheetData = [header, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulario Actualizado");

    // Auto-size columns
    const colWidths = header.map((_, i) => ({
        wch: Math.max(...worksheetData.map(row => row[i] ? String(row[i]).length : 0)) + 2
    }));
    worksheet["!cols"] = colWidths;
    
    XLSX.writeFile(workbook, "vocabulario_actualizado.xlsx");
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Quiz Complete!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{getFeedbackMessage(numericPercentage)}</p>
        
        <div className="flex justify-around items-center my-8">
            <div className="flex flex-col">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{score} / {totalWords}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Correct Answers</span>
            </div>
             <div className="flex flex-col">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{percentage}%</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Accuracy</span>
            </div>
        </div>

        {failedWords.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-3">Words to Review:</h3>
            <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
              {failedWords.map((word, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{word.german}</span>
                  <span className="text-slate-500 dark:text-slate-400">{word.spanish}</span>
                </div>
              ))}
            </div>
             <button
                onClick={onReview}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-150 ease-in-out hover:scale-105 mt-6"
            >
                Review {failedWords.length} Failed Word{failedWords.length > 1 ? 's' : ''}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4">
            <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-150 ease-in-out hover:scale-105"
            >
                Download Updated File
            </button>

            <button
                onClick={onRestart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-150 ease-in-out hover:scale-105"
                >
                Start New Quiz
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;