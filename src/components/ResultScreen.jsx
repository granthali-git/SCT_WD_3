import React, { useState } from 'react';
import { Trophy, CheckCircle2, XCircle, RotateCcw, Share2, Check, Lightbulb, BarChart2, ChevronDown, Download, Sparkles } from 'lucide-react';
import { saveScore } from '../utils/leaderboard';
import Leaderboard from './Leaderboard';

export default function ResultScreen({
  userAnswers = [],
  topic = 'General Knowledge',
  difficulty = 'Medium',
  mode = 'Timed',
  bestStreak = 0,
  difficultyNote = '',
  onNewQuiz
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [name, setName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const totalQuestions = userAnswers.length;
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Analytics Computations
  const totalTime = userAnswers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
  const avgTimeVal = totalQuestions > 0 ? totalTime / totalQuestions : 0;
  const avgTimeStr = avgTimeVal % 1 === 0 ? avgTimeVal.toFixed(0) : avgTimeVal.toFixed(1);
  const hintsCount = userAnswers.filter((a) => a.usedHint).length;

  const getBestType = () => {
    if (!userAnswers || userAnswers.length === 0) return 'N/A';
    const stats = {};
    userAnswers.forEach((ans) => {
      const t = ans.type || 'single';
      if (!stats[t]) stats[t] = { total: 0, correct: 0 };
      stats[t].total += 1;
      if (ans.isCorrect) stats[t].correct += 1;
    });

    let bestT = null;
    let maxAcc = -1;
    const typeNames = { single: 'Single', multi: 'Multi', fill: 'Fill' };

    Object.keys(stats).forEach((t) => {
      const acc = (stats[t].correct / stats[t].total) * 100;
      if (acc > maxAcc) {
        maxAcc = acc;
        bestT = t;
      }
    });

    return bestT ? (typeNames[bestT] || bestT) : 'N/A';
  };

  const bestType = getBestType();

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || isSaved) return;

    const updated = saveScore({
      name: name.trim(),
      topic,
      score: correctCount,
      total: totalQuestions,
      percentage,
      date: new Date().toLocaleDateString()
    });
    setLeaderboard(updated);
    setIsSaved(true);
  };

  const handleShareResult = async () => {
    const shareText = `I scored ${correctCount}/${totalQuestions} on ${topic}!`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback ignore if clipboard is restricted
    }
  };

  return (
    <div className="space-y-6 text-center sm:text-left animate-fade-in-slide">
      {/* Print-Only Header: AI Quiz Arena — Result Summary */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4 text-left">
        <h1 className="text-2xl font-serif font-bold text-slate-900">
          AI Quiz Arena — Result Summary
        </h1>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-800 font-sans">
          <div><strong>Topic:</strong> {topic} ({difficulty})</div>
          <div><strong>Mode:</strong> {mode === 'Practice' ? 'Practice run' : 'Timed run'}</div>
          <div><strong>Score:</strong> {correctCount} / {totalQuestions} ({percentage}%)</div>
          <div><strong>Best Streak:</strong> {bestStreak} in a row</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          {difficultyNote && <div className="col-span-2"><strong>Adjustment:</strong> {difficultyNote}</div>}
        </div>
      </div>

      {/* Hero Score Section */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/40 rounded-full flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-400/10 print:hidden">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="font-serif text-3xl sm:text-4xl text-slate-100 font-bold tracking-tight">
            {correctCount} / {totalQuestions} Correct
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-teal-400 font-semibold">{percentage}% Score</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-900/60 border border-indigo-800 text-amber-300">
              {mode === 'Practice' ? 'Practice run' : 'Timed run'}
            </span>
            <span>•</span>
            <span>Best streak: <strong className="text-amber-300 font-semibold">{bestStreak}</strong></span>
            <span>•</span>
            <span>Topic: <strong className="text-amber-400 font-semibold">{topic}</strong> ({difficulty})</span>
          </p>
        </div>

        {difficultyNote && (
          <div className="pt-1 flex items-center justify-center">
            <span className="bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{difficultyNote}</span>
            </span>
          </div>
        )}
      </div>

      {/* Save to Leaderboard Section */}
      <div className="bg-slate-900/90 border border-indigo-900/80 rounded-xl p-4 space-y-3 shadow-md print:hidden">
        {!isSaved ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Trophy className="w-4 h-4" />
                Save score to leaderboard
              </span>
            </div>
            <form onSubmit={handleSave} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (max 20 chars)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  !name.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20 cursor-pointer active:scale-[0.99]'
                }`}
              >
                <span>Save</span>
              </button>
            </form>
          </div>
        ) : (
          <Leaderboard entries={leaderboard} />
        )}
      </div>

      {/* Analytics Breakdown Section */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
          className="w-full flex items-center justify-between text-xs uppercase tracking-widest text-slate-400 font-semibold hover:text-amber-400 transition-colors py-1 cursor-pointer focus:outline-none"
        >
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>Performance Analytics</span>
          </span>
          <span className="text-xs text-amber-400 font-semibold normal-case flex items-center gap-1">
            {isAnalyticsOpen ? 'Hide details' : 'Show details'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAnalyticsOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {isAnalyticsOpen && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 animate-fade-in-slide">
            {/* Column 1: Best Type */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center space-y-1">
              <div className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                Best Type
              </div>
              <div className="text-xl font-serif text-amber-400 font-bold truncate">
                {bestType}
              </div>
            </div>

            {/* Column 2: Avg Time */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center space-y-1">
              <div className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                Avg Time
              </div>
              <div className="text-xl font-serif text-amber-400 font-bold">
                {avgTimeStr}s
              </div>
            </div>

            {/* Column 3: Hints Used */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center space-y-1">
              <div className="text-slate-400 uppercase text-xs font-semibold tracking-wider">
                Hints Used
              </div>
              <div className="text-xl font-serif text-amber-400 font-bold">
                {hintsCount} / {totalQuestions}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review List Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400 font-semibold">
          <span>Question Review</span>
          <span>{correctCount} of {totalQuestions} passed</span>
        </div>

        {/* Scrollable Question Review List */}
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1.5 border-y border-indigo-900/60 py-4 custom-scrollbar">
          {userAnswers.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 sm:p-4 rounded-xl border space-y-2 text-left transition-all ${
                item.isCorrect
                  ? 'bg-slate-900/60 border-slate-800/80'
                  : 'bg-rose-950/20 border-rose-900/50'
              }`}
            >
              {/* Question Header & Icon */}
              <div className="flex items-start gap-3">
                {item.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                      Q{idx + 1} • {item.type}
                    </span>
                    {item.usedHint && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20" title="Hint used for this question">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        <span>Hint used</span>
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-slate-200 text-sm sm:text-base font-medium leading-snug break-words">
                    {item.question}
                  </p>
                </div>
              </div>

              {/* User Answer Display */}
              <div className="text-xs text-slate-400 pl-8 space-y-1">
                <div className="break-words">
                  Your answer:{' '}
                  <span className={item.isCorrect ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>
                    {item.chosen}
                  </span>
                </div>

                {/* Show Correct Answer ONLY for incorrect/timed-out questions */}
                {!item.isCorrect && (
                  <div className="text-slate-400 break-words">
                    Correct answer:{' '}
                    <span className="text-emerald-400 font-semibold">{item.correctAnswer}</span>
                  </div>
                )}

                {item.explanation && (
                  <p className="text-slate-400 italic text-xs sm:text-[13px] pt-1 break-words">
                    {item.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons Row: Share Result + Download + New Quiz */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 print:hidden">
        <button
          type="button"
          onClick={handleShareResult}
          className={`w-full py-3 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
            isCopied
              ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
              : 'bg-indigo-900/40 hover:bg-amber-400/20 hover:border-amber-400/70 hover:scale-[1.02] border-amber-400/50 text-amber-300'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Share</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full py-3 px-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 hover:border-amber-400/40 hover:text-amber-300 hover:scale-[1.02] border border-slate-700 text-slate-200 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          title="Download result summary as PDF"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={onNewQuiz}
          className="w-full bg-amber-400 hover:bg-amber-300 hover:brightness-110 hover:shadow-amber-400/40 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 text-slate-950 font-bold text-xs sm:text-sm py-3 px-3 rounded-xl shadow-lg shadow-amber-400/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 fill-slate-950" />
          <span>New quiz</span>
        </button>
      </div>
    </div>
  );
}
