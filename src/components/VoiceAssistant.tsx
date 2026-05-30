
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Play, Square, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceAssistantProps {
  onInsert: (text: string) => void;
  onClose: () => void;
}

// Vietnamese keywords to math mapping
const mathVocabulary: Record<string, string> = {
  'cộng': '+',
  'trừ': '-',
  'nhân': '*',
  'chia': '/',
  'bằng': '=',
  'mở ngoặc': '(',
  'đóng ngoặc': ')',
  'mũ': '^',
  'bình phương': '^2',
  'lập phương': '^3',
  'căn bậc hai': '\\sqrt{',
  'căn': '\\sqrt{',
  'phân số': '\\frac{',
  'trên': '/',
  'phần': '/',
  'sin': '\\sin',
  'cos': '\\cos',
  'tan': '\\tan',
  'cot': '\\cot',
  'pi': '\\pi',
  'vô cùng': '\\infty',
  'tổng': '\\sum',
  'tích phân': '\\int',
  'alpha': '\\alpha',
  'beta': '\\beta',
  'delta': '\\Delta',
  'độ': '^\\circ',
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onInsert, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          processTranscript(final.toLowerCase());
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const processTranscript = (text: string) => {
    setTranscript(text);
    
    // 1. Check for command: "Tính ..."
    if (text.includes('tính')) {
      const expression = text.split('tính')[1].trim();
      handleCalculation(expression);
    } 
    // 2. Check for command: "Chèn ..."
    else if (text.includes('chèn')) {
      const content = text.split('chèn')[1].trim();
      onInsert(content);
      setFeedback(`Đã chèn: ${content}`);
      speak(`Đã chèn nội dung`);
    }
    // 3. Check for command: "Xóa"
    else if (text.includes('xóa hết') || text.includes('xóa sạch')) {
       // Note: App.tsx handles state, maybe just speak feedback
       setFeedback("Yêu cầu xóa toàn bộ");
       speak("Bạn có thể nhấn nút xóa trên thanh công cụ");
    }
    // 4. Default: Convert math words to symbols and insert
    else {
      let mathText = text;
      Object.entries(mathVocabulary).forEach(([word, symbol]) => {
        const regex = new RegExp(word, 'g');
        mathText = mathText.replace(regex, symbol);
      });
      
      // Basic heuristic: if it looks like math, wrap in $$
      if (/[+\-*/=^\\{]/.test(mathText)) {
        onInsert(`$${mathText.trim()}$`);
      } else {
        onInsert(mathText);
      }
    }
  };

  const handleCalculation = (expr: string) => {
    try {
      // Basic normalization for Vietnamese words
      let cleanExpr = expr
        .replace(/cộng/g, '+')
        .replace(/trừ/g, '-')
        .replace(/nhân/g, '*')
        .replace(/chia/g, '/')
        .replace(/x/g, '*')
        .replace(/,/g, '.')
        .replace(/[^0-9+\-*/().]/g, '');

      // Simple eval for basic arithmetic
      // Warning: In production, use a library like mathjs
      const result = eval(cleanExpr);
      const output = `${expr} = ${result}`;
      onInsert(output);
      setFeedback(output);
      speak(`Kết quả là ${result}`);
    } catch (e) {
      setFeedback("Không thể tính toán biểu thức này");
      speak("Tôi không hiểu phép tính này");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setInterimTranscript('');
      setFeedback(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3"
    >
      <AnimatePresence>
        {(transcript || interimTranscript || feedback) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="bg-white p-4 rounded-3xl shadow-2xl border border-indigo-100 max-w-xs w-64 mb-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trợ lý Giọng nói</span>
            </div>
            
            <p className="text-sm text-slate-700 italic min-h-[3rem]">
              {feedback || interimTranscript || transcript || "Đang nghe..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-lg border border-slate-100 hover:text-red-500 transition-colors"
        >
          <X size={18} />
        </button>
        
        <button
          onClick={toggleListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative overflow-hidden ${
            isListening ? 'bg-red-500 scale-110 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {isListening && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-white/20 rounded-full" 
            />
          )}
          {isListening ? <MicOff className="text-white relative z-10" /> : <Mic className="text-white relative z-10" />}
        </button>
      </div>
    </motion.div>
  );
};
