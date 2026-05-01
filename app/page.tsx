'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '@/components/layout/Navbar';
import DoubtScanner from '@/components/scanner/DoubtScanner';
import SolutionRenderer from '@/components/workspace/SolutionRenderer';
import { TUTORS } from '@/lib/constants';
import { Sparkles, BrainCircuit, Star, Clock, ArrowRight, BookOpen, Presentation, MessageSquare, Send, Trophy, User, Settings, Flame, Loader2, X, Layers, Mic } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import type { AnalysisResult, Tutor } from '@/lib/types';

function getUIMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return '';
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListeningChat, setIsListeningChat] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatRecognitionRef = useRef<any>(null);

  const startChatListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    chatRecognitionRef.current = new SpeechRecognition();
    chatRecognitionRef.current.continuous = false;
    chatRecognitionRef.current.interimResults = true;

    chatRecognitionRef.current.onstart = () => setIsListeningChat(true);
    chatRecognitionRef.current.onend = () => setIsListeningChat(false);
    chatRecognitionRef.current.onerror = () => setIsListeningChat(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chatRecognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setChatInput(transcript);
    };

    chatRecognitionRef.current.start();
  };

  const [studentName, setStudentName] = useState('Alex Johnson');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [chatInput, setChatInput] = useState("");

  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [achievements, setAchievements] = useState<{ id: string; title: string; icon: typeof Trophy; color: string; bg: string; fill?: boolean }[]>([
    { id: '1', title: '7 Day Streak', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-100', fill: true },
    { id: '2', title: 'Math Wizard', icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: '3', title: 'Fast Learner', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/chat',
      body: { tutor: selectedTutor }
    }),
  });

  const isChatLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: "Hey there! I'm OmniBuddy. Need some motivation or have a quick question? I'm here to help you study better!" }],
        createdAt: new Date(),
      }]);
    }
  }, [messages.length, setMessages]);

  const handleAwardBadge = (badge: { id: string; title: string; icon: typeof Trophy; color: string; bg: string; fill?: boolean }) => {
    if (!achievements.find(a => a.id === badge.id || a.title === badge.title)) {
      setAchievements(prev => [badge, ...prev]);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput("");
    sendMessage({ text: msg }, { body: { tutor: selectedTutor } });
  };

  const handleAnalyze = (result: AnalysisResult) => {
    setActiveAnalysis(result);
  };

  const startTutorSession = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setActiveTab('chat');
  };

  const handleFollowUp = () => {
    if (activeAnalysis) {
      setChatInput(`I have a follow-up question about ${activeAnalysis.concept}. Can you explain more?`);
      setActiveTab('chat');
      setActiveAnalysis(null);
    }
  };

  const handleNextChallenge = () => {
    setActiveAnalysis(null);
    setActiveTab('scanner');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-20 md:pb-0 md:pt-20`}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="fixed top-6 right-6 z-[60] md:top-auto md:bottom-24 flex flex-col gap-3">
         <button 
           onClick={toggleTheme}
           className="p-4 rounded-2xl glass-card backdrop-blur-xl border border-white/20 shadow-2xl hover:scale-110 transition-transform text-brand-600"
         >
           {isDarkMode ? '☀️' : '🌙'}
         </button>
      </div>

      {/* Profile Editor Modal */}
      <AnimatePresence>
        {showProfileEditor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileEditor(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold dark:text-white">Edit Profile</h3>
                  <button onClick={() => setShowProfileEditor(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 text-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Academic Goal</label>
                    <input 
                      type="text"
                      placeholder="e.g. Master Science & Math"
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                    />
                  </div>

                  <button 
                    onClick={() => setShowProfileEditor(false)}
                    className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight dark:text-white">Good morning, {studentName}!</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Ready to conquer your goals today?</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="student-card px-6 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Star fill="currentColor" size={20} />
                    </div>
                    <div>
                      <div className="font-bold">2,450 XP</div>
                      <div className="text-xs text-slate-400 font-medium tracking-wider uppercase">Level 12 Scholar</div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Quick Start Card */}
                  <div className="bg-brand-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-brand-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10 max-w-md">
                      <h2 className="text-3xl font-bold mb-4 leading-tight text-white">{"Stuck on a problem?"}<br />OmniLearn is here.</h2>
                      <p className="text-brand-100 text-lg mb-8 opacity-90 leading-relaxed uppercase tracking-tighter">
                        Get instant presentation or text solutions for any subject. Just click the scanner below.
                      </p>
                      <button 
                        onClick={() => setActiveTab('scanner')}
                        className="bg-white text-brand-600 px-8 py-4 rounded-2xl font-bold hover:bg-brand-50 transition-colors flex items-center gap-2 group shadow-xl"
                      >
                        Start Scanning <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 right-10 hidden lg:block opacity-20">
                       <BrainCircuit size={200} />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="student-card p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold dark:text-white">Recent Solutions</h3>
                      <button className="text-brand-600 font-bold hover:underline text-sm uppercase tracking-tighter">View All</button>
                    </div>
                    <div className="space-y-4">
                      {[
                        { title: 'Photosynthesis Deep Dive', concept: 'Photosynthesis', subject: 'Biology', complexity: 'intermediate' as const, icon: Presentation, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { title: 'Quadratic Equations Guide', concept: 'Quadratic Equations', subject: 'Mathematics', complexity: 'intermediate' as const, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { title: 'Shakespearean Literary Devices', concept: 'Shakespearean Literary Devices', subject: 'English Literature', complexity: 'advanced' as const, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleAnalyze({
                            concept: item.concept,
                            subject: item.subject,
                            complexity: item.complexity,
                            suggestedFormat: 'slides',
                            initialExplanation: `Detailed guide about ${item.title}.`
                          })}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl cursor-pointer group"
                        >
                           <div className={`w-12 h-12 ${item.bg} ${item.color} dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <item.icon size={24} />
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold dark:text-white">{item.title}</h4>
                              <p className="text-sm text-slate-400 flex items-center gap-1">
                                <Clock size={12} /> {i === 0 ? '2 hours ago' : i === 1 ? 'Yesterday' : '3 days ago'}
                              </p>
                           </div>
                           <ArrowRight size={20} className="text-slate-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Tutors Quick List */}
                  <div className="student-card p-8">
                    <h3 className="text-xl font-bold mb-6">Expert Tutors</h3>
                    <div className="space-y-6">
                      {TUTORS.map((tutor) => (
                        <div key={tutor.id} className="flex items-center gap-4 group cursor-pointer">
                           <div className="relative">
                              <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-brand-200 transition-all" />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold leading-tight">{tutor.name}</h4>
                              <p className="text-xs text-brand-600 font-bold tracking-tight mb-1">{tutor.subject}</p>
                           </div>
                           <button 
                              onClick={() => startTutorSession(tutor)}
                              className="p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all"
                           >
                              <MessageSquare size={18} />
                           </button>
                        </div>
                      ))}
                    </div>
                    <button 
                       onClick={() => setActiveTab('tutors')}
                       className="w-full mt-8 py-3 bg-slate-100 rounded-xl text-slate-500 font-bold hover:bg-brand-50 hover:text-brand-600 transition-all text-sm uppercase tracking-tighter"
                    >
                      Browse All Tutors
                    </button>
                  </div>

                  {/* Streaks */}
                  <div className="student-card p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                          <Flame size={28} fill="currentColor" />
                       </div>
                       <div>
                          <div className="text-2xl font-black">7 Day Streak!</div>
                          <p className="text-slate-500 text-sm font-medium">{"Keep it up! You're in the top 5%."}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DoubtScanner onAnalyze={handleAnalyze} />
            </motion.div>
          )}

          {activeTab === 'tutors' && (
             <motion.div
                key="tutors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-6xl mx-auto py-10"
             >
                <div className="text-center mb-16">
                   <h2 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Meet Your Mentors</h2>
                   <p className="text-xl text-slate-500">Pick an expert and start learning in real-time.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {TUTORS.map((tutor) => (
                    <motion.div 
                      key={tutor.id} 
                      whileHover={{ y: -10 }}
                      className="student-card overflow-hidden group shadow-xl shadow-slate-200/50"
                    >
                       <div className="h-48 relative overflow-hidden bg-slate-900">
                          <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-contain mix-blend-overlay opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                          <div className="absolute bottom-6 left-6">
                             <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest mb-2 border border-white/20">
                                {tutor.subject}
                             </div>
                             <h3 className="text-3xl font-bold text-white">{tutor.name}</h3>
                          </div>
                       </div>
                       <div className="p-8">
                          <p className="text-slate-500 leading-relaxed mb-8 italic">{`"${tutor.personality}"`}</p>
                          <div className="flex flex-wrap gap-2 mb-10">
                             {tutor.description.split(',').map((tag, i) => (
                               <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {tag.trim()}
                               </span>
                             ))}
                          </div>
                          <button 
                             onClick={() => startTutorSession(tutor)}
                             className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                          >
                             Learn with {tutor.name.split(' ')[1]} <ArrowRight size={18} />
                          </button>
                       </div>
                    </motion.div>
                  ))}
                </div>
             </motion.div>
          )}

          {activeTab === 'chat' && (
             <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-2xl mx-auto py-10 h-[calc(100vh-160px)] flex flex-col"
             >
                <div className="student-card flex-1 flex flex-col overflow-hidden shadow-2xl">
                   <div className="p-6 bg-indigo-600 text-white flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md overflow-hidden">
                         {selectedTutor ? (
                           <img src={selectedTutor.avatar} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <MessageSquare size={24} />
                         )}
                      </div>
                      <div>
                         <h3 className="font-bold text-xl">{selectedTutor ? selectedTutor.name : 'OmniBuddy'}</h3>
                         <p className="text-xs text-indigo-100 font-medium tracking-wide uppercase">
                           {selectedTutor ? `${selectedTutor.subject} Expert` : 'Your Friendly Learning Companion'}
                         </p>
                      </div>
                      {selectedTutor && (
                        <button 
                          onClick={() => setSelectedTutor(null)}
                          className="ml-auto p-2 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-widest"
                        >
                          Switch to Bot
                        </button>
                      )}
                   </div>
                   
                   <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900/10">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                            msg.role === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-sm border max-w-[80%] ${
                            msg.role === 'user' 
                              ? 'bg-brand-600 text-white border-brand-500 rounded-tr-none' 
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-tl-none'
                          }`}>
                            <p className="text-sm md:text-base whitespace-pre-wrap">{getUIMessageText(msg)}</p>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">
                              <Sparkles size={16} />
                           </div>
                           <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 rounded-tl-none flex items-center gap-2">
                              <Loader2 size={16} className="animate-spin text-brand-600" />
                              <span className="text-sm text-slate-400 italic">Tutor is thinking...</span>
                           </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                   </div>

                   <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                      <button 
                        onClick={startChatListening}
                        className={`p-3 rounded-xl transition-all ${isListeningChat ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-brand-600'}`}
                      >
                        <Mic size={20} />
                      </button>
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isChatLoading}
                        placeholder={selectedTutor ? `Ask ${selectedTutor.name}...` : "Say hello to OmniBuddy..."}
                        className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 dark:text-white disabled:opacity-50"
                      />
                      <button 
                        disabled={!chatInput.trim() || isChatLoading}
                        onClick={handleSendMessage}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isChatLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                      </button>
                   </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'profile' && (
             <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto py-10"
             >
                <div className="student-card p-10 flex flex-col items-center text-center">
                   <div className="flex-1">
                      {isEditingName ? (
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <input 
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                            autoFocus
                            className="text-4xl font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-center outline-none"
                          />
                        </div>
                      ) : (
                        <h2 
                          onClick={() => setIsEditingName(true)}
                          className="text-4xl font-black text-slate-800 dark:text-white mb-2 cursor-pointer hover:text-brand-600 transition-colors"
                        >
                          {studentName}
                        </h2>
                      )}
                      <p className="text-slate-400 font-bold tracking-widest uppercase mb-6">Master Science & Math</p>
                      
                      <div className="flex justify-center mb-8">
                        <button 
                          onClick={() => setShowProfileEditor(true)}
                          className="flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Settings size={18} /> Edit Profile & Preferences
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-8">
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Total Doubts</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">124</div>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="text-slate-400 text-[10px] font-black uppercase mb-1">XP Points</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">2.4k</div>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Ranking</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">#12</div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Trophy size={18} className="text-amber-500" /> Recent Achievements
                         </h4>
                         <div className="flex gap-4 flex-wrap justify-center">
                            {achievements.map((a) => (
                              <div 
                                key={a.id} 
                                className={`w-12 h-12 ${a.bg} rounded-xl flex items-center justify-center ${a.color}`} 
                                title={a.title}
                              >
                                 <a.icon size={20} fill={a.fill ? "currentColor" : "none"} />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {activeAnalysis && (
          <SolutionRenderer 
            analysis={activeAnalysis} 
            onClose={() => setActiveAnalysis(null)} 
            onFollowUp={handleFollowUp}
            onNextChallenge={handleNextChallenge}
            onAwardBadge={handleAwardBadge}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
