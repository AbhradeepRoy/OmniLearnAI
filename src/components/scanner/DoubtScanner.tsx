import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Type, Mic, X, Loader2, Sparkles, Send } from 'lucide-react';
import { analyzeDoubt } from '../../services/geminiService';

interface ScannerProps {
  onAnalyze: (result: any) => void;
}

export default function DoubtScanner({ onAnalyze }: ScannerProps) {
  const [mode, setMode] = useState<'image' | 'text' | 'voice' | null>(null);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setMode('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInput(prev => finalTranscript || (prev + interimTranscript));
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleAnalyze = async () => {
    stopListening();
    setIsAnalyzing(true);
    try {
      let result;
      if (mode === 'image' && preview) {
        const base64Data = preview.split(',')[1];
        result = await analyzeDoubt({ mimeType: 'image/jpeg', data: base64Data });
      } else {
        result = await analyzeDoubt(input);
      }
      onAnalyze(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setMode(null);
    setInput('');
    setPreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="text-center mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-4 dark:text-white"
        >
          What are we learning today?
        </motion.h1>
        <p className="text-slate-500 text-lg">Upload a photo, type a question, or just talk to me.</p>
      </div>

      <AnimatePresence mode="wait">
        {!mode ? (
          <motion.div 
            key="selector"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { id: 'image', icon: Camera, label: 'Scan Image', color: 'bg-blue-500', action: () => fileInputRef.current?.click() },
              { id: 'text', icon: Type, label: 'Type Doubt', color: 'bg-indigo-500', action: () => setMode('text') },
              { id: 'voice', icon: Mic, label: 'Voice Input', color: 'bg-emerald-500', action: () => setMode('voice') },
              { id: 'upload', icon: Upload, label: 'Upload File', color: 'bg-amber-500', action: () => fileInputRef.current?.click() },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={btn.action}
                className="flex flex-col items-center justify-center p-8 student-card hover:-translate-y-1 group"
              >
                <div className={`p-4 rounded-2xl ${btn.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <btn.icon size={32} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{btn.label}</span>
              </button>
            ))}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="input-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="student-card p-6 md:p-10 relative overflow-hidden"
          >
            <button onClick={reset} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>

            {mode === 'text' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                  <Type size={24} />
                  <h3 className="font-bold text-xl uppercase tracking-tighter dark:text-indigo-400">Type your doubt</h3>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your question here or describe your doubt..."
                  className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-indigo-200 text-lg resize-none outline-none"
                />
              </div>
            )}

            {mode === 'image' && preview && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <Camera size={24} />
                  <h3 className="font-bold text-xl uppercase tracking-tighter dark:text-blue-400">Image captured</h3>
                </div>
                <div className="relative rounded-3xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-900 aspect-video md:aspect-auto md:max-h-96">
                  <img src={preview} alt="Doubt Preview" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {mode === 'voice' && (
              <div className="flex flex-col items-center justify-center space-y-8 py-10">
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`w-24 h-24 rounded-full flex items-center justify-center relative transition-all ${
                    isListening ? 'bg-rose-100 text-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.3)]' : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                   {isListening && (
                     <motion.div 
                       animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }} 
                       transition={{ repeat: Infinity, duration: 2 }}
                       className="absolute inset-0 bg-rose-200 dark:bg-rose-800 rounded-full"
                     />
                   )}
                   {isListening ? <X size={40} className="relative z-10" /> : <Mic size={40} className="relative z-10" />}
                </button>
                <div className="text-center w-full max-w-lg">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {isListening ? "Listening closely..." : "Tap the mic to start speaking"}
                  </h3>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Speak your doubt or type it here..."
                    className="w-full h-32 p-6 mt-4 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-lg outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm italic">
                    {isListening ? "Try saying: 'Explain the photosynthesis process'" : "Your voice will be transcribed in real-time."}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-end">
              <button
                id="analyze-button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (mode === 'text' && !input)}
                className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-200"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Solve with AI
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
