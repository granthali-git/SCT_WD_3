import React, { useState } from 'react';
import { Sparkles, BookOpen, Sliders, Hash, AlertCircle, Tag, Trophy, Timer } from 'lucide-react';
import Leaderboard from './Leaderboard';

const CATEGORIES = [
  { id: 'gk', label: 'General Knowledge', preset: 'General Knowledge' },
  { id: 'coding', label: 'Coding', preset: 'React hooks & JavaScript' },
  { id: 'science', label: 'Science', preset: 'Physics & Space Science' },
  { id: 'custom', label: 'Custom', preset: '' },
];

export default function SetupScreen({
  topic = '',
  setTopic = () => {},
  difficulty = 'Medium',
  setDifficulty = () => {},
  count = 6,
  setCount = () => {},
  mode = 'Timed',
  setMode = () => {},
  onStart,
  apiError = '',
  setApiError = () => {}
}) {
  const [validationError, setValidationError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const displayedError = validationError || apiError;

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat.id);
    if (cat.preset) {
      setTopic(cat.preset);
    } else {
      setTopic('');
    }
    if (validationError) setValidationError('');
    if (apiError) setApiError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setValidationError('Please enter a topic for your quiz.');
      return;
    }
    
    setValidationError('');
    setApiError('');
    if (onStart) {
      onStart(topic.trim(), difficulty, Number(count));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-100 font-semibold tracking-tight">
              Configure Your Quiz
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
              Select a category or enter a topic to generate a personalized AI quiz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 hover:border-amber-400/60 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
            title="View leaderboard"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Category Chips Selector */}
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Category Preset</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id || (cat.preset && topic === cat.preset);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                    isActive
                      ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold scale-[1.02]'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:scale-105 hover:border-amber-400/50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiz Topic Field */}
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Topic
          </label>
          <div className="relative flex items-center">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setSelectedCategory('custom');
                if (validationError) setValidationError('');
                if (apiError) setApiError('');
              }}
              placeholder="e.g. React hooks, Indian history, cricket"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-amber-400 transition-all"
            />
          </div>
        </div>

        {/* Quiz Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span>Quiz Mode</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Timed', 'Practice'].map((m) => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold border transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                    isActive
                      ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:scale-105 hover:border-amber-400/50'
                  }`}
                >
                  {m === 'Timed' ? <Timer className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Select Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Difficulty Select */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Difficulty
            </label>
            <div className="relative flex items-center">
              <Sliders className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-amber-400 transition-all cursor-pointer hover:border-amber-400/40"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question Count Select */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Question Count
            </label>
            <div className="relative flex items-center">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-amber-400 transition-all cursor-pointer hover:border-amber-400/40"
              >
                <option value={4}>4 Questions</option>
                <option value={6}>6 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Validation or API Error Banner */}
        {displayedError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg flex items-center gap-2.5 text-rose-200 text-xs sm:text-sm font-medium animate-fade-in-slide">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{displayedError}</span>
          </div>
        )}

        {/* Start Button */}
        <button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-300 hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 text-slate-950 font-bold text-sm sm:text-base py-3.5 rounded-xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 fill-slate-950" />
          <span>Generate quiz</span>
        </button>
      </form>

      {/* Leaderboard Modal Overlay */}
      {isLeaderboardOpen && (
        <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />
      )}
    </>
  );
}
