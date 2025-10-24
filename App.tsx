import React, { useState, useCallback, useRef } from 'react';
import { GameState, Word } from './types';
import { fetchAndParseSheet } from './services/googleSheetsService';
import { parseXlsxFile } from './services/xlsxService';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [masterWords, setMasterWords] = useState<Word[]>([]);
  const [wordsForGame, setWordsForGame] = useState<Word[]>([]);
  const [failedWords, setFailedWords] = useState<Word[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingSource, setLoadingSource] = useState<'url' | 'file' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startQuizWithWords = (parsedWords: Word[]) => {
    setMasterWords(parsedWords);
    setWordsForGame(parsedWords);
    setGameState('playing');
  };

  const handleLoadSheet = useCallback(async () => {
    if (!sheetUrl) {
      setError('Please enter a Google Sheet URL.');
      return;
    }
    setIsLoading(true);
    setLoadingSource('url');
    setError(null);
    try {
      const parsedWords = await fetchAndParseSheet(sheetUrl);
      if (parsedWords.length === 0) {
        setError('The sheet is empty or could not be parsed correctly. Make sure it has at least 3 columns: German, Spanish, Audio URL.');
        setIsLoading(false);
        setLoadingSource(null);
        return;
      }
      startQuizWithWords(parsedWords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingSource(null);
    }
  }, [sheetUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingSource('file');
    setError(null);
    try {
      const parsedWords = await parseXlsxFile(file);
      startQuizWithWords(parsedWords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while parsing the file.');
    } finally {
      setIsLoading(false);
      setLoadingSource(null);
      if (event.target) event.target.value = ''; // Allow re-uploading the same file
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGameFinish = useCallback((score: number, failed: Word[], updatedGameWords: Word[]) => {
    const newMasterWords = masterWords.map(masterWord => {
        const updatedVersion = updatedGameWords.find(ugw => ugw.german === masterWord.german && ugw.spanish === masterWord.spanish);
        return updatedVersion || masterWord;
    });
    setMasterWords(newMasterWords);
    setFinalScore(score);
    setFailedWords(failed);
    setGameState('results');
  }, [masterWords]);

  const handleRestart = useCallback(() => {
    setGameState('setup');
    setMasterWords([]);
    setWordsForGame([]);
    setFailedWords([]);
    setFinalScore(0);
    setError(null);
  }, []);

  const handleReview = useCallback(() => {
    if (failedWords.length > 0) {
      setWordsForGame(failedWords);
      setFailedWords([]); 
      setFinalScore(0);
      setGameState('playing');
    }
  }, [failedWords]);

  const renderContent = () => {
    switch (gameState) {
      case 'playing':
        return <GameScreen words={wordsForGame} onGameFinish={handleGameFinish} />;
      case 'results':
        return (
            <ResultsScreen 
                score={finalScore} 
                totalWords={wordsForGame.length} 
                onRestart={handleRestart} 
                failedWords={failedWords}
                onReview={handleReview}
                allWords={masterWords}
            />
        );
      case 'setup':
      default:
        return (
          <div className="w-full max-w-lg mx-auto">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-center">German Vocab Quiz</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">Load your vocabulary from a public Google Sheet or an XLSX file.</p>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
              <div className="mb-4">
                <label htmlFor="sheet-url" className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Google Sheet URL</label>
                <input
                  type="text"
                  id="sheet-url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition"
                />
              </div>
              <button
                onClick={handleLoadSheet}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-transform duration-150 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && loadingSource === 'url' ? <Loader /> : 'Start from URL'}
              </button>

              <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                  <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500">OR</span>
                  <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
                disabled={isLoading}
              />
              <button
                onClick={handleUploadClick}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-transform duration-150 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading && loadingSource === 'file' ? <Loader /> : 'Upload XLSX File'}
              </button>

              {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
              
              <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-bold mb-1">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Your file/sheet should have 5 columns: German, Spanish, Audio URL, Notes (optional), Times Failed.</li>
                    <li>If using Google Sheets, remember to publish it to the web first.</li>
                </ol>
            </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 text-slate-800 dark:text-slate-200">
      {renderContent()}
    </main>
  );
};

export default App;