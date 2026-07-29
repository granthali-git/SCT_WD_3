import React from 'react';
import { Trophy, X, Award } from 'lucide-react';
import { getLeaderboard } from '../utils/leaderboard';

export default function Leaderboard({ entries, onClose }) {
  const list = entries || getLeaderboard();

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
            🥇 #1
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-300/20 border border-slate-300/60 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
            🥈 #2
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-600/60 text-amber-500 font-bold text-xs flex items-center justify-center shrink-0">
            🥉 #3
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
            #{rank}
          </div>
        );
    }
  };

  const getItemBorderClass = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-amber-950/40 border-amber-400/50 text-amber-200';
      case 2:
        return 'bg-slate-900/90 border-slate-400/40 text-slate-200';
      case 3:
        return 'bg-amber-950/20 border-orange-500/40 text-amber-300';
      default:
        return 'bg-slate-900/40 border-slate-800/80 text-slate-300';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-slide">
      {/* Leaderboard Header */}
      <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-serif text-lg font-bold text-slate-100">
            Leaderboard — Top 10
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded p-1 transition-colors cursor-pointer"
            aria-label="Close leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Leaderboard List */}
      {list.length === 0 ? (
        <div className="py-8 text-center space-y-2 text-slate-400">
          <Award className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-medium">No high scores recorded yet!</p>
          <p className="text-xs text-slate-500">Play a quiz and save your score to appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {list.map((item, index) => {
            const rank = index + 1;
            return (
              <div
                key={index}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${getItemBorderClass(
                  rank
                )}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(rank)}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      Topic: <span className="text-slate-300 font-medium">{item.topic}</span>
                      {item.date ? ` • ${item.date}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-teal-400">
                    {item.percentage}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.score}/{item.total} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
