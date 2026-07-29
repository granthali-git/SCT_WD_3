import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, Send, ArrowRight, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { getHint } from '../utils/generateQuiz';

const QUESTION_TIME_LIMIT = 25;

export default function QuizScreen({
  question,
  currentIndex = 0,
  totalQuestions = 1,
  currentStreak = 0,
  isMuted = false,
  mode = 'Timed',
  onRecordAnswer,
  onNextQuestion,
  onQuizComplete
}) {
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [fillInput, setFillInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [hint, setHint] = useState('');
  const [isFetchingHint, setIsFetchingHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [hintError, setHintError] = useState('');
  const [isHintCollapsed, setIsHintCollapsed] = useState(false);
  const timerRef = useRef(null);

  // Reset state on new question
  useEffect(() => {
    setSelectedIndices([]);
    setFillInput('');
    setIsSubmitted(false);
    setIsTimeUp(false);
    setTimeLeft(QUESTION_TIME_LIMIT);
    setHint('');
    setIsFetchingHint(false);
    setUsedHint(false);
    setHintError('');
    setIsHintCollapsed(false);
  }, [currentIndex, question]);

  const {
    type,
    question: questionText,
    options = [],
    correctIndices = [],
    answer: correctAnswer = '',
    explanation = ''
  } = question || {};

  const handleGetHint = async () => {
    if (usedHint || isFetchingHint || isSubmitted) return;
    setIsFetchingHint(true);
    setHintError('');
    try {
      const fetchedHint = await getHint(questionText, options);
      setHint(fetchedHint);
      setUsedHint(true);
    } catch (err) {
      setHintError(err.message || 'Failed to fetch hint.');
    } finally {
      setIsFetchingHint(false);
    }
  };

  const checkIsCorrect = useCallback(() => {
    if (type === 'fill') {
      return fillInput.trim().toLowerCase() === (correctAnswer || '').trim().toLowerCase();
    }
    if (type === 'single') {
      return (
        selectedIndices.length === 1 &&
        correctIndices.includes(selectedIndices[0])
      );
    }
    if (type === 'multi') {
      if (selectedIndices.length !== correctIndices.length) return false;
      return selectedIndices.every((idx) => correctIndices.includes(idx));
    }
    return false;
  }, [type, fillInput, correctAnswer, selectedIndices, correctIndices]);

  const isUserCorrect = isSubmitted && !isTimeUp && checkIsCorrect();

  const recordCurrentAnswer = useCallback((isCorrect, timedOut) => {
    let chosenText = '';
    let correctText = '';

    if (type === 'fill') {
      chosenText = fillInput.trim() || '(No response)';
      correctText = correctAnswer;
    } else {
      chosenText = selectedIndices.length > 0
        ? selectedIndices.map((i) => options[i]).join(' | ')
        : '(No selection)';
      correctText = correctIndices.map((i) => options[i]).join(' | ');
    }

    const timeTaken = timedOut ? QUESTION_TIME_LIMIT : Math.max(0, QUESTION_TIME_LIMIT - timeLeft);

    if (onRecordAnswer) {
      onRecordAnswer({
        question: questionText,
        type,
        chosen: chosenText,
        isCorrect,
        isTimeUp: timedOut,
        explanation,
        correctAnswer: correctText,
        usedHint,
        timeTaken
      });
    }
  }, [type, fillInput, correctAnswer, selectedIndices, options, correctIndices, timeLeft, onRecordAnswer, questionText, explanation, usedHint]);

  const handleTimeOut = useCallback(() => {
    setIsTimeUp(true);
    setIsSubmitted(true);
    if (!isMuted) soundEffects.playIncorrect();
    recordCurrentAnswer(false, true);
  }, [isMuted, recordCurrentAnswer]);

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (isSubmitted) return;

    if (type === 'fill' && !fillInput.trim()) return;
    if ((type === 'single' || type === 'multi') && selectedIndices.length === 0) return;

    setIsSubmitted(true);
    const correct = checkIsCorrect();
    if (!isMuted) {
      if (correct) soundEffects.playCorrect();
      else soundEffects.playIncorrect();
    }
    recordCurrentAnswer(correct, false);
  }, [isSubmitted, type, fillInput, selectedIndices, checkIsCorrect, isMuted, recordCurrentAnswer]);

  const handleNextClick = useCallback(() => {
    if (currentIndex === totalQuestions - 1) {
      if (onQuizComplete) onQuizComplete();
    } else {
      if (onNextQuestion) onNextQuestion();
    }
  }, [currentIndex, totalQuestions, onQuizComplete, onNextQuestion]);

  const handleOptionClick = useCallback((index) => {
    if (isSubmitted) return;

    if (type === 'single') {
      setSelectedIndices([index]);
    } else if (type === 'multi') {
      setSelectedIndices((prev) => 
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
      );
    }
  }, [isSubmitted, type]);

  const isSubmitDisabled =
    isSubmitted ||
    (type === 'fill' ? !fillInput.trim() : selectedIndices.length === 0);

  // Timer Countdown (Only in Timed mode)
  useEffect(() => {
    if (!question || isSubmitted || mode === 'Practice') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isSubmitted, question, mode, handleTimeOut]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    if (!question) return;

    const handleKeyDown = (e) => {
      const tagName = e.target ? e.target.tagName : '';
      const isTyping = tagName === 'INPUT' || tagName === 'TEXTAREA';

      // Pressing Enter key
      if (e.key === 'Enter') {
        if (!isSubmitted) {
          if (!isSubmitDisabled) {
            e.preventDefault();
            handleSubmit();
          }
        } else {
          e.preventDefault();
          handleNextClick();
        }
        return;
      }

      // Ignore number shortcuts if user is currently typing in an input field
      if (isTyping) return;

      // Number keys 1-5 to toggle options for single/multi questions
      if (!isSubmitted && (type === 'single' || type === 'multi')) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          const optionIndex = num - 1;
          if (options && optionIndex < options.length) {
            e.preventDefault();
            handleOptionClick(optionIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [question, currentIndex, isSubmitted, isSubmitDisabled, type, options, fillInput, selectedIndices, handleSubmit, handleNextClick, handleOptionClick]);

  if (!question) return null;

  const getQuestionTypeLabel = (qType) => {
    switch (qType) {
      case 'single':
        return 'Single select';
      case 'multi':
        return 'Multi select';
      case 'fill':
        return 'Fill in the blank';
      default:
        return 'Multiple choice';
    }
  };

  const mainProgress = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const timeRatio = timeLeft / QUESTION_TIME_LIMIT;
  const isTimeLow = timeRatio <= 0.3;

  return (
    <div key={currentIndex} className="space-y-6 animate-fade-in-slide">
      {/* Top Header & Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            {currentStreak >= 2 && (
              <span
                key={currentStreak}
                className="bg-amber-950 text-amber-300 rounded-full px-3 py-1 text-xs font-semibold tracking-normal normal-case animate-pop-in inline-flex items-center gap-1 border border-amber-800/40"
              >
                🔥 {currentStreak} in a row
              </span>
            )}
          </div>

          {/* Clock Timer Top Right - Hidden in Practice Mode */}
          {mode === 'Timed' && (
            <div className="flex items-center gap-1.5">
              <Clock className={`w-4 h-4 ${isTimeLow ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span className={`font-mono text-sm font-bold ${isTimeLow ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>

        {/* Main Progress Bar */}
        <div className="w-full bg-indigo-900/50 rounded-full h-1.5 overflow-hidden border border-indigo-900">
          <div
            className="bg-teal-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(45,212,191,0.6)]"
            style={{ width: `${mainProgress}%` }}
          />
        </div>

        {/* Question Timer Slim Progress Bar - Hidden in Practice Mode */}
        {mode === 'Timed' && (
          <div className="w-full bg-slate-900/80 rounded-full h-1 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isTimeLow
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
              }`}
              style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Question Header & Type Eyebrow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20 inline-block">
            {getQuestionTypeLabel(type)}
          </span>

          <div className="flex items-center gap-2">
            {!isSubmitted && (
              <button
                type="button"
                disabled={usedHint || isFetchingHint}
                onClick={handleGetHint}
                className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                  usedHint
                    ? 'bg-slate-900/40 border-slate-800/50 text-slate-600 cursor-not-allowed'
                    : isFetchingHint
                    ? 'bg-slate-900 border-slate-800 text-amber-400 cursor-wait'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-amber-300 cursor-pointer'
                }`}
                title={usedHint ? 'Hint already used' : 'Get a hint'}
              >
                {isFetchingHint ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Lightbulb className={`w-3.5 h-3.5 ${usedHint ? 'text-slate-600' : 'text-slate-400'}`} />
                )}
                <span>{isFetchingHint ? 'Fetching hint...' : usedHint ? 'Hint used' : 'Get a hint'}</span>
              </button>
            )}

            {isTimeUp && (
              <span className="text-xs uppercase tracking-widest font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Time Expired
              </span>
            )}
          </div>
        </div>

        <h2 className="font-serif text-xl sm:text-2xl text-slate-100 font-semibold leading-relaxed break-words">
          {questionText}
        </h2>

        {/* Collapsible Hint Text Box */}
        {hint && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm space-y-1.5 animate-fade-in-slide shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Hint</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHintCollapsed(!isHintCollapsed)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {isHintCollapsed ? 'Show hint' : 'Hide hint'}
              </button>
            </div>
            {!isHintCollapsed && (
              <p className="text-xs sm:text-sm text-slate-300 font-sans italic leading-relaxed break-words">
                "{hint}"
              </p>
            )}
          </div>
        )}

        {hintError && (
          <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
            {hintError}
          </div>
        )}
      </div>

      {/* Single and Multi Select Options */}
      {(type === 'single' || type === 'multi') && (
        <div className="space-y-3 pt-1">
          {options.map((option, idx) => {
            const isChosenOption = selectedIndices.includes(idx);
            const isCorrectOption = correctIndices.includes(idx);
            const letter = String.fromCharCode(65 + idx);

            let optionClass = 'bg-indigo-950/40 border-indigo-900/60 text-slate-300 hover:bg-indigo-900/60 hover:border-amber-400/40 hover:scale-[1.01] transition-all duration-200';

            if (!isSubmitted) {
              if (isChosenOption) {
                optionClass = 'border-amber-400 bg-slate-900 text-amber-300 shadow-md shadow-amber-400/10 scale-[1.01]';
              }
            } else {
              if (isCorrectOption) {
                optionClass = 'border-emerald-500 bg-emerald-950 text-emerald-300';
              } else if (isChosenOption && !isCorrectOption) {
                optionClass = 'border-rose-500 bg-rose-950 text-rose-300';
              } else {
                optionClass = 'bg-indigo-950/20 border-indigo-900/30 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                onClick={() => handleOptionClick(idx)}
                className={`w-full p-3.5 sm:p-4 border rounded-xl flex items-center justify-between text-left transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${optionClass} ${
                  isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                      isSubmitted
                        ? isCorrectOption
                          ? 'bg-emerald-400 text-slate-950'
                          : isChosenOption
                          ? 'bg-rose-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500'
                        : isChosenOption
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-indigo-900/60 text-slate-400 border border-indigo-800/80'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="font-medium text-xs sm:text-base break-words">
                    {option}
                  </span>
                </div>

                {isSubmitted ? (
                  isCorrectOption ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : isChosenOption ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : null
                ) : type === 'multi' ? (
                  <div
                    className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      isChosenOption
                        ? 'bg-amber-400 border-amber-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isChosenOption && <span className="text-xs font-bold">✓</span>}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* Fill in the Blank Render */}
      {type === 'fill' && (
        <div className="space-y-3 pt-1">
          <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Your Answer
          </label>
          <input
            type="text"
            disabled={isSubmitted}
            value={fillInput}
            onChange={(e) => setFillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmitDisabled) {
                handleSubmit(e);
              }
            }}
            placeholder="Type your answer here..."
            className={`w-full p-3.5 border rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors ${
              !isSubmitted
                ? 'bg-slate-900 border-slate-800 focus:border-amber-400'
                : isUserCorrect
                ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                : 'border-rose-500 bg-rose-950 text-rose-300'
            }`}
          />

          {isSubmitted && !isUserCorrect && (
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 pt-1 break-words">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Correct answer: <strong className="underline underline-offset-2">{correctAnswer}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Feedback Banner below options / fill input */}
      {isSubmitted && (
        <div
          className={`p-4 rounded-xl border space-y-2 transition-all ${
            isUserCorrect
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isUserCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-bold text-sm">
              {isUserCorrect ? 'Correct!' : isTimeUp ? "Time's Up!" : 'Incorrect'}
            </span>
          </div>
          {explanation && (
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed sm:pl-7 break-words">
              {explanation}
            </p>
          )}
        </div>
      )}

      {/* Action Footer: Submit Answer or Next Question / See Results */}
      <div className="pt-4 border-t border-indigo-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold self-start sm:self-center">
          {isSubmitted ? (
            isUserCorrect ? (
              <span className="text-emerald-400 font-bold">✓ Correct Answer</span>
            ) : isTimeUp ? (
              <span className="text-rose-400 font-bold">✕ Time Out</span>
            ) : (
              <span className="text-rose-400 font-bold">✕ Incorrect Answer</span>
            )
          ) : mode === 'Timed' ? (
            <span>Timer: {timeLeft}s remaining</span>
          ) : (
            <span className="text-slate-400 font-medium normal-case">Practice mode (no timer)</span>
          )}
        </div>

        {!isSubmitted ? (
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              isSubmitDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-[0.99] cursor-pointer'
            }`}
          >
            <span>Submit answer</span>
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg shadow-teal-400/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <span>{currentIndex === totalQuestions - 1 ? 'See results' : 'Next question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desktop Keyboard Hint Row */}
      <div className="hidden md:flex items-center justify-center text-slate-500 text-xs pt-1">
        <span>Press 1-4 to select, Enter to submit</span>
      </div>
    </div>
  );
}
