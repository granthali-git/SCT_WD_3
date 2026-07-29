import React, { useState } from 'react';
import { Sparkles, Loader2, Volume2, VolumeX, AlertCircle, CircleHelp, Trophy, Zap, Star, Brain, Target, CheckCircle2 } from 'lucide-react';
import SetupScreen from './components/SetupScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import { generateQuiz } from './utils/generateQuiz';

export default function App() {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'loading' | 'quiz' | 'results'
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(6);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [apiError, setApiError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mode, setMode] = useState('Timed'); // 'Timed' | 'Practice'

  // Adaptive difficulty state
  const [totalRequestedCount, setTotalRequestedCount] = useState(6);
  const [hasGeneratedBatch2, setHasGeneratedBatch2] = useState(false);
  const [difficultyNote, setDifficultyNote] = useState('');
  const [isAdaptingBatch, setIsAdaptingBatch] = useState(false);

  // Track recent question texts to prevent repetition across attempts
  const [recentQuestionTexts, setRecentQuestionTexts] = useState([]);

  const envApiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const hasEnvApiKey = Boolean(envApiKey);

  const getAdjustedDifficulty = (currentDiff, accuracy) => {
    const levels = ['Easy', 'Medium', 'Hard'];
    const currentIndex = levels.indexOf(currentDiff);
    const safeIndex = currentIndex >= 0 ? currentIndex : 1;

    if (accuracy > 70) {
      const newIndex = Math.min(levels.length - 1, safeIndex + 1);
      const newDiff = levels[newIndex];
      const changed = newIndex !== safeIndex;
      return {
        nextDifficulty: newDiff,
        note: changed
          ? `Difficulty increased to ${newDiff} based on your performance`
          : ''
      };
    } else if (accuracy < 40) {
      const newIndex = Math.max(0, safeIndex - 1);
      const newDiff = levels[newIndex];
      const changed = newIndex !== safeIndex;
      return {
        nextDifficulty: newDiff,
        note: changed
          ? `Difficulty adjusted to ${newDiff} based on your performance`
          : ''
      };
    } else {
      return {
        nextDifficulty: currentDiff,
        note: ''
      };
    }
  };

  const handleStartQuiz = async (topicVal, diffVal, countVal) => {
    if (!hasEnvApiKey) {
      setApiError('API key not configured. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.');
      return;
    }

    setScreen('loading');
    setIsAdaptingBatch(false);
    setApiError('');
    setCurrentIndex(0);
    setUserAnswers([]);
    setCurrentStreak(0);
    setBestStreak(0);
    setDifficultyNote('');
    setHasGeneratedBatch2(false);
    setTotalRequestedCount(countVal);

    const batch1Count = Math.ceil(countVal / 2);

    try {
      const generatedQuestions = await generateQuiz(topicVal, diffVal, batch1Count, recentQuestionTexts);
      setQuestions(generatedQuestions);
      const newTexts = generatedQuestions.map((q) => q.question).filter(Boolean);
      setRecentQuestionTexts((prev) => [...prev, ...newTexts].slice(-20));
      setScreen('quiz');
    } catch (err) {
      setApiError(err.message || 'An error occurred while generating the quiz.');
      setScreen('setup');
    }
  };

  const handleRecordAnswer = (answerRecord) => {
    setUserAnswers((prev) => [...prev, answerRecord]);
    if (answerRecord.isCorrect) {
      setCurrentStreak((prevStreak) => {
        const nextStreak = prevStreak + 1;
        setBestStreak((prevBest) => Math.max(prevBest, nextStreak));
        return nextStreak;
      });
    } else {
      setCurrentStreak(0);
    }
  };

  const handleNextQuestion = async () => {
    const nextIdx = currentIndex + 1;
    const batch1Count = Math.ceil(totalRequestedCount / 2);
    const batch2Count = totalRequestedCount - batch1Count;

    if (!hasGeneratedBatch2 && batch2Count > 0 && nextIdx === questions.length) {
      setIsAdaptingBatch(true);
      setScreen('loading');
      try {
        const firstHalfCorrect = userAnswers.filter((a) => a.isCorrect).length;
        const accuracy = userAnswers.length > 0 ? (firstHalfCorrect / userAnswers.length) * 100 : 0;
        const { nextDifficulty, note } = getAdjustedDifficulty(difficulty, accuracy);

        if (note) {
          setDifficultyNote(note);
        }

        const secondBatchQuestions = await generateQuiz(topic, nextDifficulty, batch2Count, recentQuestionTexts);
        setQuestions((prev) => [...prev, ...secondBatchQuestions]);
        const newTexts = secondBatchQuestions.map((q) => q.question).filter(Boolean);
        setRecentQuestionTexts((prev) => [...prev, ...newTexts].slice(-20));
        setHasGeneratedBatch2(true);
        setCurrentIndex(nextIdx);
        setScreen('quiz');
      } catch (err) {
        setApiError(err.message || 'Failed to generate second half of questions.');
        setScreen('results');
      } finally {
        setIsAdaptingBatch(false);
      }
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const handleQuizComplete = () => {
    setScreen('results');
  };

  const handleNewQuiz = () => {
    setScreen('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setCurrentStreak(0);
    setBestStreak(0);
    setDifficultyNote('');
    setHasGeneratedBatch2(false);
    setApiError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans antialiased relative overflow-hidden z-0">
      {/* Base Layer: Stage Spotlight Glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.28) 0%, rgba(15, 23, 42, 0.98) 75%)'
        }}
      />

      {/* Animated Perspective Grid Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0 opacity-60">
        <div className="w-full h-[220%] grid-floor" />
      </div>

      {/* Accent Light Streaks */}
      <div className="absolute top-1/4 -left-10 w-[28rem] h-[3px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent -rotate-45 blur-[1.5px] animate-streak-shimmer pointer-events-none z-0" />
      <div className="absolute bottom-1/3 -right-10 w-[28rem] h-[3px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent rotate-12 blur-[1.5px] animate-streak-shimmer pointer-events-none z-0" />
      <div className="absolute top-1/2 right-1/4 w-96 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent -rotate-12 blur-[1px] animate-streak-shimmer pointer-events-none z-0" />

      {/* Floating Game Icons with Colored Drop Shadows */}
      <div className="absolute top-10 left-10 text-amber-400/35 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-icon-float-1 pointer-events-none z-0">
        <Trophy className="w-12 h-12" />
      </div>
      <div className="absolute top-16 right-12 text-teal-400/35 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] animate-icon-float-2 pointer-events-none z-0">
        <Zap className="w-10 h-10" />
      </div>
      <div className="absolute bottom-16 left-12 text-teal-400/35 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] animate-icon-float-3 pointer-events-none z-0">
        <Brain className="w-12 h-12" />
      </div>
      <div className="absolute bottom-20 right-14 text-amber-400/35 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-icon-float-1 pointer-events-none z-0">
        <Target className="w-10 h-10" />
      </div>
      <div className="absolute top-1/3 left-6 text-amber-400/30 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] animate-icon-float-2 pointer-events-none z-0">
        <Star className="w-8 h-8" />
      </div>
      <div className="absolute bottom-1/3 right-6 text-teal-400/30 drop-shadow-[0_0_10px_rgba(45,212,191,0.4)] animate-icon-float-3 pointer-events-none z-0">
        <CircleHelp className="w-8 h-8" />
      </div>
      <div className="absolute top-14 right-1/3 text-amber-400/30 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-icon-float-1 pointer-events-none z-0">
        <Sparkles className="w-7 h-7" />
      </div>
      <div className="absolute bottom-10 left-1/3 text-teal-400/30 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)] animate-icon-float-2 pointer-events-none z-0">
        <CheckCircle2 className="w-7 h-7" />
      </div>

      {/* Main Shell Card: Visual Stage Focal Point */}
      <div className="max-w-xl w-full bg-indigo-950/95 border border-indigo-800/90 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.25)] ring-1 ring-amber-400/20 p-6 sm:p-8 space-y-6 relative z-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_65px_rgba(251,191,36,0.25)] hover:border-amber-400/40">
        
        {/* Top Eyebrow Header Row */}
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400 text-sm tracking-wider uppercase">
              AI Quiz Arena
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Mute Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded p-1 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
              aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              {screen === 'setup' && 'Setup Mode'}
              {screen === 'loading' && (isAdaptingBatch ? 'Adapting...' : 'Generating...')}
              {screen === 'quiz' && `Topic: ${topic}`}
              {screen === 'results' && 'Results'}
            </span>
          </div>
        </div>

        {/* Missing API Key Warning Banner */}
        {!hasEnvApiKey && (
          <div className="p-4 bg-rose-950/90 border border-rose-800 rounded-xl flex items-start gap-3 text-rose-200 text-xs sm:text-sm font-medium shadow-lg animate-fade-in-slide">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-300 font-bold mb-0.5">Missing API Key</strong>
              <span>API key not configured. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.</span>
            </div>
          </div>
        )}

        {/* Setup Screen */}
        {screen === 'setup' && (
          <SetupScreen
            topic={topic}
            setTopic={setTopic}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            count={count}
            setCount={setCount}
            mode={mode}
            setMode={setMode}
            onStart={handleStartQuiz}
            apiError={apiError}
            setApiError={setApiError}
          />
        )}

        {/* Loading Screen */}
        {screen === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
            <h3 className="font-serif text-xl font-medium text-slate-100">
              {isAdaptingBatch
                ? 'Adapting difficulty for second half...'
                : 'Gemini is writing your questions...'}
            </h3>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Topic: {topic} • {difficulty} • {totalRequestedCount} Questions ({mode} Mode)
            </p>
          </div>
        )}

        {/* Quiz Screen */}
        {screen === 'quiz' && questions.length > 0 && (
          <QuizScreen
            question={questions[currentIndex]}
            currentIndex={currentIndex}
            totalQuestions={totalRequestedCount}
            currentStreak={currentStreak}
            isMuted={isMuted}
            mode={mode}
            onRecordAnswer={handleRecordAnswer}
            onNextQuestion={handleNextQuestion}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {/* Results Screen */}
        {screen === 'results' && (
          <ResultScreen
            userAnswers={userAnswers}
            topic={topic}
            difficulty={difficulty}
            mode={mode}
            bestStreak={bestStreak}
            difficultyNote={difficultyNote}
            onNewQuiz={handleNewQuiz}
          />
        )}

      </div>
    </div>
  );
}
