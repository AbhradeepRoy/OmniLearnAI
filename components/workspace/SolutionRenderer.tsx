'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Layers, MessageSquare, Star, Flame, Trophy, Mic, Info, Loader2, Sparkles, Play } from 'lucide-react';
import Markdown from 'react-markdown';
import type { AnalysisResult, Slide, QuizQuestion } from '@/lib/types';

interface SolutionRendererProps {
  analysis: AnalysisResult;
  onClose: () => void;
  onFollowUp?: () => void;
  onNextChallenge?: () => void;
  onAwardBadge?: (badge: { id: string; title: string; description?: string; icon: typeof Trophy; color: string; bg: string; fill?: boolean }) => void;
}

export default function SolutionRenderer({ analysis, onClose, onFollowUp, onNextChallenge, onAwardBadge }: SolutionRendererProps) {
  const [format, setFormat] = useState(analysis.suggestedFormat);
  const [content, setContent] = useState<Slide[] | QuizQuestion[] | { text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  
  // Quiz State
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setCurrentSlide(0);
    setError(null);
    setIsLoading(true);
    
    async function loadContent() {
      try {
        let result = null;
        if (format === 'slides') {
          const response = await fetch('/api/slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: analysis.concept, level: analysis.complexity }),
          });
          result = await response.json();
        } else if (format === 'quiz') {
          const response = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: analysis.concept, level: analysis.complexity }),
          });
          result = await response.json();
          setQuizScore(0);
          setCurrentQuestionIndex(0);
          setShowResults(false);
          setSelectedAnswer(null);
        } else {
          result = { text: analysis.initialExplanation };
        }

        if (isMounted) {
          setContent(result);
          setIsLoading(false);
          setCurrentSlide(0);
        }
      } catch (e) {
        if (isMounted) {
          console.error(e);
          setError("Generation failed. Falling back to text explanation.");
          setFormat('text');
          setIsLoading(false);
        }
      }
    }

    loadContent();
    return () => { 
      isMounted = false;
      window.speechSynthesis.cancel();
    };
  }, [format, analysis.concept, analysis.complexity, analysis.initialExplanation]);

  const handleTranslateSpecific = async (targetLang: string) => {
    setIsTranslating(true);
    try {
      let originalText = "";
      const slides = content as Slide[];
      const textContent = content as { text: string };
      
      if ((format === 'text' || format === 'voice') && textContent?.text) {
        originalText = textContent.text;
      } else if (format === 'slides' && slides?.[currentSlide]) {
        const slide = slides[currentSlide];
        originalText = (Array.isArray(slide.content) ? slide.content.join('. ') : slide.content) + '. ' + slide.title;
      }
      
      if (!originalText) {
        setIsTranslating(false);
        return;
      }
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, targetLanguage: targetLang }),
      });
      const { translated } = await response.json();
      
      if (format === 'text' || format === 'voice') {
        setContent({ text: translated });
      } else if (format === 'slides' && slides?.[currentSlide]) {
        const newContent = [...slides];
        const points = translated.split('\n').filter((p: string) => p.trim()).map((p: string) => p.replace(/^[•\-\d\.]\s*/, '').trim());
        
        newContent[currentSlide] = { 
          ...newContent[currentSlide], 
          content: points.length > 0 ? points : [translated],
          title: `[${targetLang}] ${newContent[currentSlide].title}`
        };
        setContent(newContent);
      }
    } catch (e) {
      console.error("Translation error:", e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleNarrate = () => {
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      return;
    }

    let textToSpeak = "";
    const slides = content as Slide[];
    const textContent = content as { text: string };
    
    if ((format === 'text' || format === 'voice') && textContent?.text) {
      textToSpeak = textContent.text;
    } else if (format === 'slides' && slides?.[currentSlide]) {
      const slide = slides[currentSlide];
      textToSpeak = (slide.title || "") + ". " + (Array.isArray(slide.content) ? slide.content.join(". ") : (slide.content || ""));
    }
    
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    
    setIsNarrating(true);
    window.speechSynthesis.speak(utterance);
  };

  const slides = content as Slide[];
  const quizQuestions = content as QuizQuestion[];
  const textContent = content as { text: string };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[60] flex items-center justify-center p-0 md:p-4"
    >
      <div className="bg-white dark:bg-[#050505] w-full h-full md:max-w-7xl md:max-h-[96vh] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-10 py-4 md:py-6 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div className="truncate">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">{analysis.concept}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                  analysis.complexity === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                  analysis.complexity === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {analysis.complexity}
                </span>
                <span className="text-slate-400 text-xs">{analysis.subject}</span>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar gap-1">
            <div className="flex bg-white dark:bg-slate-700/50 rounded-xl p-0.5">
              <button
                disabled={isTranslating}
                onClick={() => handleTranslateSpecific('Hindi')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                Hindi
              </button>
              <button
                disabled={isTranslating}
                onClick={() => handleTranslateSpecific('Bengali')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                Bengali
              </button>
            </div>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1 my-auto shrink-0" />
            <button
              onClick={handleNarrate}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isNarrating ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isNarrating ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
              {isNarrating ? 'Stop' : 'Listen'}
            </button>
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-2 my-auto hidden md:block" />
            {[
              { id: 'text', icon: MessageSquare, label: 'Text' },
              { id: 'slides', icon: Layers, label: 'Presentation' },
              { id: 'quiz', icon: Star, label: 'Quiz' },
              { id: 'voice', icon: Mic, label: 'Voice' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as typeof format)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  format === f.id ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <f.icon size={16} />
                <span className="inline">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-slate-50/50 dark:bg-slate-900/50">
          {error && (
            <div className="mb-4 p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium">
              <Info size={16} /> {error}
            </div>
          )}
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full"
              />
              <p className="text-slate-500 font-medium animate-pulse">Designing your AI Presentation...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {format === 'text' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-slate dark:prose-invert max-w-4xl mx-auto prose-headings:tracking-tight prose-p:text-lg prose-p:leading-relaxed bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <Markdown>{textContent?.text}</Markdown>
                </motion.div>
              )}

              {format === 'slides' && slides && (
                <motion.div 
                  key="slideshow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col gap-6"
                >
                  <div className="flex-1 rounded-[32px] relative overflow-hidden bg-[#050505] text-white flex flex-col border border-white/5 shadow-2xl min-h-[450px]">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600/20 via-transparent to-purple-600/10 opacity-60" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
                    
                    <div className="flex-1 flex flex-col md:flex-row relative z-10 overflow-hidden">
                      <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 p-6 md:p-12 self-center"
                      >
                        {slides[currentSlide] && (
                          <div className="space-y-3 md:space-y-4">
                            <h3 className="text-lg md:text-2xl font-black text-white leading-tight">
                              <span className="text-brand-500 mr-2">#0{currentSlide + 1}</span> {slides[currentSlide]?.title}
                            </h3>
                            <div className="space-y-2 md:space-y-2.5 max-w-2xl">
                              {Array.isArray(slides[currentSlide].content) ? (
                                slides[currentSlide].content.map((point: string, i: number) => (
                                  <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-3 md:gap-4 text-[10px] md:text-sm text-slate-200 leading-relaxed group"
                                  >
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-brand-500 mt-1.5 md:mt-2 flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    {point}
                                  </motion.div>
                                ))
                              ) : (
                                <p className="text-xs md:text-base text-slate-300 leading-relaxed">{slides[currentSlide]?.content}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {slides?.[currentSlide]?.imageSearchTerm && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={`img-${currentSlide}`}
                          className="w-full md:w-5/12 h-48 md:h-auto relative overflow-hidden"
                        >
                          <img 
                            src={`https://source.unsplash.com/featured/800x800?${encodeURIComponent(slides[currentSlide]?.imageSearchTerm || analysis.concept)}`} 
                            alt={slides[currentSlide]?.imageSearchTerm}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://loremflickr.com/800/800/${encodeURIComponent(slides[currentSlide]?.imageSearchTerm || analysis.concept)}?lock=${currentSlide}`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:bg-gradient-to-l" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="relative z-10 px-6 md:px-12 py-4 md:py-6 border-t border-white/10 flex items-center justify-between bg-black/20">
                      <div className="text-slate-400 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase max-w-[70%] truncate">
                        {slides[currentSlide]?.summary}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[8px] md:text-[10px] font-bold text-white/60 tracking-widest uppercase">
                        <Sparkles size={10} className="text-brand-400" /> AI Tutor v3
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 pb-2">
                    <div className="flex gap-2">
                      {Array.isArray(slides) && slides.map((_, i: number) => (
                        <button 
                          key={i} 
                          onClick={() => setCurrentSlide(i)}
                          className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-12 bg-brand-600' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 md:gap-4">
                      <button 
                        disabled={currentSlide === 0}
                        onClick={() => setCurrentSlide(s => s - 1)}
                        className="p-3 md:p-4 bg-white dark:bg-slate-800 rounded-2xl disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        disabled={Array.isArray(slides) && currentSlide === slides.length - 1}
                        onClick={() => setCurrentSlide(s => s + 1)}
                        className="p-3 md:p-4 bg-brand-600 text-white rounded-2xl disabled:opacity-30 shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {format === 'quiz' && quizQuestions && (
                <div className="max-w-3xl mx-auto h-full flex flex-col justify-center py-2">
                  {!showResults ? (
                    <motion.div 
                      key={currentQuestionIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Question {currentQuestionIndex + 1} of {quizQuestions.length}
                        </span>
                        <div className="flex gap-1">
                          {Array.isArray(quizQuestions) && quizQuestions.map((_, i: number) => (
                            <div key={i} className={`w-6 h-1 rounded-full transition-colors ${i <= currentQuestionIndex ? 'bg-brand-500' : 'bg-slate-100 dark:bg-slate-700'}`} />
                          ))}
                        </div>
                      </div>

                      <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white leading-tight">
                        {quizQuestions[currentQuestionIndex]?.question}
                      </h3>

                      <div className="grid grid-cols-1 gap-2">
                        {Array.isArray(quizQuestions[currentQuestionIndex]?.options) && quizQuestions[currentQuestionIndex].options.map((option: string, i: number) => (
                          <button
                            key={i}
                            disabled={selectedAnswer !== null}
                            onClick={() => {
                              setSelectedAnswer(i);
                              if (i === quizQuestions[currentQuestionIndex].correctAnswer) {
                                setQuizScore(s => s + 1);
                              }
                            }}
                            className={`p-2 md:p-2.5 rounded-[10px] text-left text-[10px] md:text-[11px] font-semibold transition-all border-2 flex items-center justify-between group ${
                              selectedAnswer === null 
                                ? 'bg-slate-50 dark:bg-slate-900/40 border-transparent hover:border-brand-500 hover:bg-white dark:hover:bg-slate-800' 
                                : selectedAnswer === i 
                                  ? i === quizQuestions[currentQuestionIndex].correctAnswer 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-400'
                                  : i === quizQuestions[currentQuestionIndex].correctAnswer
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-slate-50 dark:bg-slate-900/40 border-transparent opacity-50'
                            }`}
                          >
                            {option}
                            {selectedAnswer !== null && i === quizQuestions[currentQuestionIndex].correctAnswer && (
                              <Trophy size={12} className="text-emerald-500" />
                            )}
                          </button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {selectedAnswer !== null && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 md:p-4 rounded-xl ${selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'}`}
                          >
                            <p className="font-bold flex items-center gap-2 mb-1 text-[11px]">
                              <Info size={14} /> {selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer ? 'Brilliant!' : 'Learning Opportunity'}
                            </p>
                            <p className="text-[10px] md:text-[10px] opacity-90">{quizQuestions[currentQuestionIndex]?.explanation}</p>
                            
                            <button 
                              onClick={() => {
                                if (Array.isArray(quizQuestions) && currentQuestionIndex < quizQuestions.length - 1) {
                                  setCurrentQuestionIndex(s => s + 1);
                                  setSelectedAnswer(null);
                                } else {
                                  if (quizScore === quizQuestions.length && onAwardBadge) {
                                    onAwardBadge({
                                      id: 'quiz-master-' + Date.now(),
                                      title: 'Quiz Master',
                                      description: `Perfect score on ${analysis.concept}!`,
                                      icon: Trophy,
                                      color: 'text-indigo-600',
                                      bg: 'bg-indigo-100',
                                      fill: true
                                    });
                                  }
                                  setShowResults(true);
                                }
                              }}
                              className="mt-4 w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:scale-[1.02] transition-transform text-sm"
                            >
                              {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Results'}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-6"
                    >
                      <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto">
                        <Trophy size={32} className="text-brand-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">Quiz Completed!</h3>
                        <p className="text-base text-slate-500">{"You've mastered"} {analysis.concept}</p>
                      </div>
                      <div className="text-5xl font-black text-brand-600">
                        {Array.isArray(quizQuestions) && quizQuestions.length > 0 ? Math.round((quizScore / quizQuestions.length) * 100) : 0}%
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
                        You got {quizScore} out of {Array.isArray(quizQuestions) ? quizQuestions.length : 0} questions correctly.
                      </p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            setCurrentQuestionIndex(0);
                            setQuizScore(0);
                            setShowResults(false);
                            setSelectedAnswer(null);
                          }}
                          className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-bold hover:bg-slate-200"
                        >
                          Retake Quiz
                        </button>
                        <button 
                          onClick={onNextChallenge}
                          className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-100 hover:bg-brand-700"
                        >
                          Next Challenge
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {format === 'voice' && content && (
                <motion.div 
                  key="voice-solution"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center space-y-12"
                >
                  <div className="w-56 h-56 bg-brand-50 dark:bg-brand-900/10 rounded-full flex items-center justify-center relative">
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute inset-0 bg-brand-200 dark:bg-brand-800 rounded-full"
                    />
                    <Mic size={72} className="text-brand-600 relative z-10" />
                  </div>
                  <div className="max-w-2xl text-center space-y-8">
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white">Listening to AI Tutor...</h3>
                    <div className="p-10 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 italic text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed shadow-xl">
                      {`"${textContent?.text?.substring(0, 250) || "Preparing personalized audio explanation..."}..."`}
                    </div>
                    <div className="flex flex-col md:flex-row justify-center gap-6">
                      <button 
                        disabled={isNarrating}
                        onClick={handleNarrate}
                        className={`flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all ${
                          isNarrating ? 'bg-rose-600' : 'bg-slate-900 dark:bg-slate-700 hover:scale-105'
                        } text-white`}
                      >
                        {isNarrating ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="white" />}
                        {isNarrating ? 'Reading to you...' : 'Play Audio Session'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Action Bar */}
        {!isLoading && (
          <div className="px-4 md:px-10 py-5 md:py-8 bg-white dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-800/50">
                <Trophy size={18} /> +50 XP
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold border border-blue-100 dark:border-blue-800/50">
                <Flame size={18} /> 7 Day Streak
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={onFollowUp}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 text-slate-500 hover:text-brand-600 font-bold transition-colors text-lg"
              >
                <MessageSquare size={22} /> Ask Follow-up
              </button>
              <button 
                onClick={onNextChallenge}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-brand-600 text-white rounded-2xl font-black text-lg hover:bg-brand-700 shadow-xl shadow-brand-500/20 hover:-translate-y-1 transition-all"
              >
                Next Challenge <ChevronRight size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
