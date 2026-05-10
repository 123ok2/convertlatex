import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MarkdownPreview } from './components/MarkdownPreview';
import { Button } from './components/Button';
import { DrawingModal } from './components/DrawingModal';
import { Toolbar } from './components/Toolbar';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { 
  Bot, 
  Loader2, 
  LogOut, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  X,
  User as UserIcon,
  ChevronDown,
  Fingerprint,
  Monitor,
  ShieldAlert,
  Lock,
  Copy as CopyIcon,
  ShieldCheck,
  Mail
} from 'lucide-react';

/**
 * HỆ THỐNG ĐỊNH DANH THIẾT BỊ (DEVICE FINGERPRINTING)
 */
const generateFingerprint = () => {
  const { userAgent, language, hardwareConcurrency, deviceMemory } = navigator as any;
  const { width, height, colorDepth } = window.screen;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  let canvasData = '';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 100;
      canvas.height = 30;
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(10, 5, 50, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("LLM-PRO", 2, 2);
      canvasData = canvas.toDataURL().slice(-100);
    }
  } catch (e) {}

  const raw = [userAgent, language, hardwareConcurrency, deviceMemory, width, height, colorDepth, timezone, canvasData].join('###');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash = hash & hash;
  }
  return 'dev-' + Math.abs(hash).toString(36);
};

/**
 * BỘ LỌC TOÁN HỌC TỰ ĐỘNG (DÀNH CHO NHẬP LIỆU TRỰC TIẾP)
 */
const autoFormatMath = (text: string): string => {
  const lines = text.split('\n');
  let inMathBlock = false;
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      return line;
    }
    if (trimmed === '$$') {
      inMathBlock = !inMathBlock;
      return line;
    }
    if (inMathBlock) return line;
    if (line.includes('$')) return line;
    
    let p = line;
    
    // Xử lý các tiền tố hóa học/toán học phổ biến
    p = p.replace(/∫(\w)(\w)\s?([^=\n]+)/g, "\\int_{$1}^{$2} $3");
    p = p.replace(/√(\w)/g, "\\sqrt{$1}").replace(/√\(([^)]+)\)/g, "\\sqrt{$1}");
    p = p.replace(/vt([A-Z]{1,2})/g, "\\overrightarrow{$1}");
    p = p.replace(/g([A-Z]{3})/g, "\\widehat{$1}");
    
    // Nhận diện các biểu thức dạng phân số đơn giản: C% = mct/mdd * 100%
    if (p.includes('/') && !p.includes('http') && p.includes('=')) {
        // Thử chuyển đổi x/y thành \frac{x}{y}
        p = p.replace(/([a-zA-Z0-9_{}\(\)]+)\/([a-zA-Z0-9_{}\(\)]+)/g, "\\frac{$1}{$2}");
    }

    const hasLatexCommand = /\\int|\\sqrt|\\overrightarrow|\\widehat|\\frac|\^|_/.test(p);
    if (hasLatexCommand && !p.includes('$$') && p.trim().length > 0) {
      return `$$ ${p.trim()} $$`;
    }
    return p;
  });
  return formattedLines.join('\n');
};

/**
 * TỰ ĐỘNG DỊCH VÀ CHUẨN HÓA VĂN BẢN TOÁN HỌC (TỪ AI HOẶC TEXT THÔ)
 */
const formatAiPastedContent = (text: string): string => {
  let p = text;

  // 1. Chuẩn hóa định dạng của AI: \( \) -> $ $ và \[ \] -> $$ $$
  p = p.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  p = p.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Đôi khi có thêm dấu ngoặc kép bọc quanh: "\(...\)" -> $...$ 
  p = p.replace(/"\$\$(.*?)\$\$"/g, '$$$$$1$$$$');
  p = p.replace(/"\$(.*?)\$"/g, '$$$1$$');

  // Đôi khi AI trả về markdown có dạng ```latex ... ```
  p = p.replace(/```latex\n([\s\S]*?)\n```/g, '$$$$\n$1\n$$$$');
  p = p.replace(/```math\n([\s\S]*?)\n```/g, '$$$$\n$1\n$$$$');

  // Sửa lỗi công thức dính vào nhau hoặc thiếu line break:
  p = p.replace(/(^|[^\$])(\$\$[^\$]+\$\$)(?=\$)/g, '$1$2\n\n');

  // 2. Chuyển đổi các ký hiệu toán học unicode thô thành LaTeX
  p = p.replace(/∫/g, '\\int ')
       .replace(/∞/g, '\\infty ')
       .replace(/π/g, '\\pi ')
       .replace(/α/g, '\\alpha ')
       .replace(/β/g, '\\beta ')
       .replace(/γ/g, '\\gamma ')
       .replace(/θ/g, '\\theta ')
       .replace(/Δ/g, '\\Delta ')
       .replace(/Ω/g, '\\Omega ')
       .replace(/±/g, '\\pm ')
       .replace(/≤/g, '\\le ')
       .replace(/≥/g, '\\ge ')
       .replace(/≠/g, '\\neq ')
       .replace(/≈/g, '\\approx ')
       .replace(/×/g, '\\times ')
       .replace(/÷/g, '\\div ')
       .replace(/′/g, "'")
       .replace(/→/g, '\\rightarrow ')
       .replace(/⇔/g, '\\Leftrightarrow ')
       .replace(/⇒/g, '\\Rightarrow ');

  // 2.5 Escape các ký tự % thô để LaTeX hiểu (tránh biến thành comment trong math block)
  p = p.replace(/([^\\]|^)%/g, '$1\\%');

  // 3. Xử lý vi phân (dx, dy, dt) khi nó đứng độc lập
  p = p.replace(/(^|\s)(\d*[a-zA-Z]?)dx(\s|$)/g, '$1$2 \\,dx$3')
       .replace(/(^|\s)(\d*[a-zA-Z]?)dy(\s|$)/g, '$1$2 \\,dy$3')
       .replace(/(^|\s)(\d*[a-zA-Z]?)dt(\s|$)/g, '$1$2 \\,dt$3');

  // 4. Xử lý căn bậc hai dạng √x hoặc √(x+y)
  p = p.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
       .replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');
       
  // 5. Xử lý các biến có chỉ số dưới viết liền (mdd -> m_{dd}, mct -> m_{ct})
  // Thường thấy trong hóa học: mct, mdd, nH2, Vdd, CM, C%
  p = p.replace(/\b(m|n|V|C)(dd|ct|H2|O2|CO2|H2O|HCl|NaOH|H2SO4)\b/g, '$1_{$2}');
  
  // Đặc trị pattern C% = mct/mdd * 100% khi bị mất dấu phân số hoặc dính chữ
  p = p.replace(/C\\%\s?=\s?(mct|m_{ct})\s?(mdd|m_{dd})\s?(\\times|\*|×)\s?100\\\%/g, "C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%");
  p = p.replace(/C\\%\s?=\s?(mdd|m_{dd})\s?(mct|m_{ct})\s?(\\times|\*|×)\s?100\\\%/g, "C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%"); // Đôi khi bị đảo
  
  // Xử lý n và V cho các chất khí/lỏng phổ biến
  p = p.replace(/\b(n|V|m)([A-Z][a-z]?\d?)\b/g, '$1_{$2}');

  // 6. Xử lý phân số dạng a/b thành \frac{a}{b} nếu nằm trong dòng có vẻ là toán
  const handleFractions = (line: string) => {
    if (!line.includes('/') || line.includes('http')) return line;
    // Tìm x/y trong đó x, y là cụm ký tự toán học
    return line.replace(/([a-zA-Z0-9_{}\(\)\%]+)\s?\/\s?([a-zA-Z0-9_{}\(\)\%]+)/g, "\\frac{$1}{$2}");
  };

  // 7. Tự động bọc $$ cho các dòng toán học nếu AI quên
  const lines = p.split('\n');
  let inAiMathBlock = false;
  const formattedLines = lines.map(line => {
    let currentLine = line;
    const trimmed = currentLine.trim();
    
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      return currentLine;
    }
    if (trimmed === '$$') {
      inAiMathBlock = !inAiMathBlock;
      return currentLine;
    }
    if (inAiMathBlock) return currentLine;

    // Áp dụng xử lý phân số cho dòng không phải block
    if (trimmed && !trimmed.includes('$')) {
        currentLine = handleFractions(currentLine);
    }

    // Nếu dòng trống hoặc đã có ký hiệu latex block inline
    if (!trimmed || currentLine.includes('$')) return currentLine;
    
    // Nhận diện dòng chứa biểu thức toán
    const mathMatch = currentLine.match(/\\int|\\sqrt|\\frac|\\sin|\\cos|\\tan|\\lim|\\sum|\\Delta|\\alpha|\\beta|\\gamma|\\theta|\^|_|\\times|\\div|\\leq|\\geq|\\neq/g);
    
    // Đếm số lượng từ thông thường để xét xem đây là câu văn hay phương trình
    const normalWordsMatch = trimmed.match(/[a-zA-Z]{4,}/g);
    const normalWordsCount = normalWordsMatch ? normalWordsMatch.length : 0;
    
    // Nếu có ít nhất 1 ký hiệu toán và ít từ bình thường, hoặc có dấu = và ký hiệu toán
    if ((mathMatch && mathMatch.length >= 1 && normalWordsCount <= 3) || 
        (currentLine.includes('=') && mathMatch)) {
      return `$$ ${currentLine.trim()} $$`;
    }
    
    // Nếu chỉ là một phương trình đơn giản như x^2 + y^2 = 1 hoặc C% = ...
    if (/^[a-zA-Z0-9\+\-\=\^\_\(\)\s\%\/\\\{\}]+$/.test(trimmed) && trimmed.includes('=') && 
       (trimmed.includes('^') || trimmed.includes('_') || trimmed.includes('/') || trimmed.includes('\\'))) {
      return `$$ ${currentLine.trim()} $$`;
    }

    return currentLine;
  });

  return formattedLines.join('\n');
};

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showConfigError, setShowConfigError] = useState(false);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  
  const [content, setContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);





  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleOutsideClick = () => setShowProfileMenu(false);
    if (showProfileMenu) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [showProfileMenu]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const fingerprint = generateFingerprint();
      if (currentUser) {
        const isGuest = currentUser.isAnonymous;
        const docId = isGuest ? fingerprint : currentUser.uid;
        setUser({
          ...currentUser,
          uid: docId,
          isGuest,
          fingerprint,
          displayEmail: isGuest ? "Chế độ dùng thử" : currentUser.email
        });
        await syncUserCredits(docId, isGuest, fingerprint);
      } else {
        setUser(null);
        setCredits(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncUserCredits = async (id: string, isGuest: boolean, fingerprint: string) => {
    try {
      const collectionName = isGuest ? "guests" : "users";
      const userRef = doc(db, collectionName, id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setCredits(snap.data().credits ?? 0);
      } else {
        const deviceRef = doc(db, "devices", fingerprint);
        const deviceSnap = await getDoc(deviceRef);
        let initialCredits = 0;
        if (!deviceSnap.exists()) {
          initialCredits = isGuest ? 10 : 20;
          await setDoc(deviceRef, {
            firstUserId: id,
            claimedAt: Timestamp.now(),
            type: isGuest ? 'guest' : 'member'
          });
        } else {
          initialCredits = 0;
          setToast({ message: "Thiết bị này đã từng nhận Credit miễn phí trước đó!", type: 'error' });
        }
        await setDoc(userRef, {
          email: isGuest ? `guest-${id}@device.local` : (auth.currentUser?.email || email),
          credits: initialCredits,
          activatedAt: Timestamp.now(),
          deviceId: fingerprint,
          isGuest
        });
        setCredits(initialCredits);
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') setShowPermissionError(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user || credits === null) return false;
    if (credits <= 0) {
      setShowCreditAlert(true);
      return false;
    }
    setIsDeducting(true);
    try {
      const collectionName = user.isGuest ? "guests" : "users";
      const userRef = doc(db, collectionName, user.uid);
      await updateDoc(userRef, { credits: increment(-1) });
      setCredits(prev => (prev !== null ? prev - 1 : 0));
      return true;
    } catch (error: any) {
      if (error.code === 'permission-denied') setShowPermissionError(true);
      else setToast({ message: "Lỗi kết nối máy chủ!", type: 'error' });
      return false;
    } finally {
      setIsDeducting(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    try {
      await signInAnonymously(auth);
      setToast({ message: "Đang nhận diện thiết bị...", type: 'info' });
    } catch (error: any) {
      if (error.code === 'auth/admin-restricted-operation') setShowConfigError(true);
      else setToast({ message: "Lỗi: " + error.message, type: 'error' });
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setToast({ message: "Lỗi: " + error.message, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToast({ message: "Đã đăng xuất thành công", type: 'success' });
      setShowProfileMenu(false);
    } catch (error: any) {
      setToast({ message: "Lỗi đăng xuất: " + error.message, type: 'error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setPreviewContent(text);
      setToast({ message: "Đã tải nội dung tệp tin", type: 'success' });
    };
    reader.readAsText(file);
  };

  const handleOfflineEnhance = useCallback(() => {
    if (!content.trim()) return;
    try {
      const formatted = formatAiPastedContent(content);
      setContent(formatted);
      setPreviewContent(formatted);
      setToast({ message: "✨ Đã tối ưu hóa định dạng (Offline)", type: 'success' });
    } catch (error) {
      setToast({ message: "Lỗi xử lý: " + error, type: 'error' });
    }
  }, [content]);

  const insertTextAtCursor = useCallback((textBefore: string, textAfter: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;
    const newContent = previousContent.substring(0, start) + textBefore + previousContent.substring(start, end) + textAfter + previousContent.substring(end);
    
    // Áp dụng autoFormat (logic có sẵn của bạn)
    const formatted = autoFormatMath(newContent);
    setContent(formatted);
    setPreviewContent(formatted);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + textBefore.length, end + textBefore.length);
      }
    }, 0);
  }, [content]);

  const handleDrawingSubmit = async (data: string) => {
    if (data.startsWith('LATEX_RAW:')) {
      const latex = data.replace('LATEX_RAW:', '');
      if (!latex.trim()) {
        setIsDrawingModalOpen(false);
        return;
      }
      // Chèn có xuống dòng để autoFormatMath nhận diện đúng là block
      insertTextAtCursor(`\n$$ ${latex.trim()} $$\n`);
      setIsDrawingModalOpen(false);
      setToast({ message: "✨ Đã chèn công thức", type: 'success' });
    } else {
      setIsAiProcessing(true);
      try {
        if (await deductCredit()) {
          const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
          const base64Data = data.split(',')[1];
          
          const result = await model.generateContent([
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            },
            {
              text: "Convert this handwritten math/physics/chemistry formula to LaTeX. Return ONLY the LaTeX string without any markdown formatting or dollar signs."
            }
          ]);
          
          const text = result.response.text();
          if (text) {
            insertTextAtCursor(`\n$$ ${text.trim()} $$\n`);
            setToast({ message: "✨ Đã nhận diện công thức", type: 'success' });
            setIsDrawingModalOpen(false);
          }
        }
      } catch (error: any) {
        setToast({ message: "Lỗi nhận diện: " + error.message, type: 'error' });
      } finally {
        setIsAiProcessing(false);
      }
    }
  };

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <span className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest">Đang kiểm tra bảo mật...</span>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white">
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <Bot className="w-16 h-16 text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-extrabold text-white mb-1 relative z-10">LLM Markdown Pro</h1>
          <p className="text-indigo-100 text-sm opacity-80 relative z-10">Mỗi thiết bị nhận 20 Credits khi đăng ký</p>
        </div>
        <div className="p-10">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" placeholder="Mật khẩu" required />
            <Button type="submit" disabled={isLoginLoading} className="w-full py-4 text-lg font-bold rounded-xl shadow-indigo-200 shadow-xl">
              {isLoginLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Đăng ký' : 'Đăng nhập')}
            </Button>
          </form>
          <div className="mt-8 flex flex-col items-center gap-4">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">Dùng thử nhanh</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <button onClick={handleGuestLogin} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 group">
              <Monitor size={14} className="group-hover:scale-110 transition-transform" /> 
              Vào nhanh bằng ID Thiết bị (10 Credit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border ${
            toast.type === 'error' ? 'bg-white border-red-200 text-red-600' : 'bg-white border-indigo-100 text-indigo-700'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-indigo-50'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : (toast.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />)}
            </div>
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-40 no-print flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 leading-tight">Markdown Pro</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.isGuest ? 'bg-orange-400' : 'bg-green-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {user.isGuest ? 'Phiên dùng thử' : 'Thành viên Pro'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-5 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl shadow-sm">
             <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="text-white" size={16} fill="white" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Số dư</p>
                <p className="text-lg font-black leading-none">{credits ?? 0} Credits</p>
             </div>
           </div>

           <div className="relative" onClick={(e) => e.stopPropagation()}>
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 hover:bg-white transition-all">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${user.isGuest ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                 {user.isGuest ? <Monitor size={20} /> : (user.email?.[0].toUpperCase() || 'U')}
               </div>
               <ChevronDown size={16} className={`text-slate-400 mr-2 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
             </button>
             
             {showProfileMenu && (
               <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-indigo-50/50 border-b border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${user.isGuest ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                        {user.isGuest ? <Fingerprint size={24} /> : (user.email?.[0].toUpperCase() || 'U')}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-900 truncate">{user.isGuest ? "Người dùng Khách" : "Thành viên Pro"}</h4>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={10}/> Đã xác thực</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ID Tài khoản</label>
                          <div onClick={() => { navigator.clipboard.writeText(user.uid); setToast({ message: "Đã copy ID", type: 'success' }); }} className="flex items-center justify-between gap-2 text-slate-600 text-[11px] font-mono bg-white p-2 rounded-xl border border-indigo-50 cursor-pointer hover:bg-indigo-100/50 transition-colors">
                            <span className="truncate">{user.uid}</span>
                            <CopyIcon size={12} className="text-slate-400" />
                          </div>
                       </div>
                       <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
                          <div className="flex items-center gap-2 text-slate-500 text-xs bg-white/80 p-2 rounded-xl border border-indigo-50">
                            <Mail size={12}/> <span className="truncate">{user?.displayEmail}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors font-bold text-sm">
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </div>
               </div>
             )}
           </div>
        </div>
      </header>

      <Toolbar 
        onInsert={insertTextAtCursor} 
        onOpenDrawing={() => setIsDrawingModalOpen(true)} 
        onFileUpload={handleFileUpload} 
        fileInputRef={fileInputRef}
        onCopyFormatted={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (previewEl && await deductCredit()) {
             try {
                const clone = previewEl.cloneNode(true) as HTMLElement;
                
                // 1. Dọn dẹp: Xóa phần KaTeX HTML thừa
                clone.querySelectorAll('.katex-html').forEach(el => el.remove());
                
                // 2. Tối ưu MathML cho Word: Phân biệt inline và block
                clone.querySelectorAll('.katex-mathml').forEach(el => {
                  const isBlock = el.closest('.katex-display') !== null;
                  const style = (el as HTMLElement).style;
                  style.display = isBlock ? 'block' : 'inline';
                  style.clip = 'auto';
                  style.height = 'auto';
                  style.width = 'auto';
                  style.overflow = 'visible';
                  if (isBlock) {
                    style.textAlign = 'center';
                    style.margin = '10pt 0';
                  }
                });

                // 3. Xóa các class Tailwind để tránh Word bị rối (giữ cấu trúc trần)
                const allElements = clone.querySelectorAll('*');
                allElements.forEach(el => {
                    el.removeAttribute('class');
                    // Word ưu tiên thuộc tính style trực tiếp
                    if (el.tagName === 'TABLE') {
                        (el as HTMLElement).style.borderCollapse = 'collapse';
                        (el as HTMLElement).style.width = '100%';
                        (el as HTMLElement).style.border = '1px solid black';
                    }
                    if (el.tagName === 'TD' || el.tagName === 'TH') {
                        (el as HTMLElement).style.border = '1px solid black';
                        (el as HTMLElement).style.padding = '5pt';
                    }
                });
                
                const fullHtml = `
                  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                  <head>
                    <meta charset='utf-8'>
                    <!--[if gte mso 9]>
                    <xml>
                      <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:DoNotOptimizeForBrowser/>
                      </w:WordDocument>
                    </xml>
                    <![endif]-->
                    <style>
                      body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: black; }
                      h1 { font-size: 18pt; color: #1e40af; font-weight: bold; }
                      h2 { font-size: 16pt; color: #1e40af; font-weight: bold; }
                      h3 { font-size: 14pt; color: #1e40af; font-weight: bold; }
                      p { margin-bottom: 10pt; }
                      table { margin-bottom: 15pt; }
                    </style>
                  </head>
                  <body>
                    ${clone.innerHTML}
                  </body>
                  </html>
                `;
                
                const blob = new Blob([fullHtml], { type: "text/html" });
                const textBlob = new Blob([clone.innerText], { type: "text/plain" });
                
                window.focus();
                
                await navigator.clipboard.write([
                  new ClipboardItem({ 
                    ["text/html"]: blob,
                    ["text/plain"]: textBlob
                  })
                ]);
                setToast({ message: "✅ Đã sao chép định dạng tối ưu cho Word", type: 'success' });
             } catch (err: any) {
                console.error('Clipboard error:', err);
                setToast({ message: "❌ Lỗi clipboard: Hãy click vào trang web trước khi nhấn Copy", type: 'error' });
             }
          }
        }} 
        onPrint={async () => { if (await deductCredit()) window.print(); }} 
        onExportWord={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (previewEl && await deductCredit()) {
             const clone = previewEl.cloneNode(true) as HTMLElement;
             
             // 1. Dọn dẹp tương tự copy
             clone.querySelectorAll('.katex-html').forEach(el => el.remove());
             clone.querySelectorAll('.katex-mathml').forEach(el => {
                const isBlock = el.closest('.katex-display') !== null;
                const style = (el as HTMLElement).style;
                style.display = isBlock ? 'block' : 'inline';
                style.clip = 'auto';
                style.height = 'auto';
                style.width = 'auto';
                style.overflow = 'visible';
                if (isBlock) {
                    style.textAlign = 'center';
                    style.margin = '12pt 0';
                }
             });

             const allElements = clone.querySelectorAll('*');
             allElements.forEach(el => {
                 el.removeAttribute('class');
                 if (el.tagName === 'TABLE') (el as HTMLElement).style.borderCollapse = 'collapse';
             });

             const fullHtml = `
               <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
               <head>
                 <meta charset='utf-8'>
                 <!--[if gte mso 9]>
                 <xml>
                   <w:WordDocument>
                     <w:View>Print</w:View>
                   </w:WordDocument>
                 </xml>
                 <![endif]-->
                 <style>
                   body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: black; }
                   table { border: 1px solid black; border-collapse: collapse; width: 100%; }
                   th, td { border: 1px solid black; padding: 5pt; }
                   h1, h2, h3 { color: #1e40af; font-weight: bold; }
                 </style>
               </head>
               <body>
                 ${clone.innerHTML}
               </body>
               </html>
             `;
             const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
             const link = document.createElement('a');
             link.href = URL.createObjectURL(blob);
             link.download = `Document_${Date.now()}.doc`;
             link.click();
             setToast({ message: "📁 Đã xuất file Word thành công", type: 'success' });
          }
        }} 
        onClear={() => { if (confirm('Xóa toàn bộ nội dung?')) setContent(''); }}
        onOptimize={handleOfflineEnhance}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col flex-1 border-r border-slate-200 bg-slate-50/50 transition-all ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <textarea 
            ref={textareaRef} 
            value={content} 
            onChange={(e) => {
               const val = e.target.value;
               const formatted = autoFormatMath(val);
               setContent(formatted);
               setPreviewContent(formatted);
            }}
            // TỰ ĐỘNG DỊCH LATEX KHI DÁN KỂ CẢ TỪ AI (KHÔNG TỐN CREDIT)
            onPaste={(e) => {
              const pastedData = e.clipboardData.getData('text');
              const aiAiMathRegex = /[∫√∞πΔ±≤≥≠≈×÷′\\]|\\\[|\\\(|\$\$/;
              if (aiAiMathRegex.test(pastedData) || pastedData.includes('\\[') || pastedData.includes('\\(')) {
                e.preventDefault();
                const formatted = formatAiPastedContent(pastedData);
                insertTextAtCursor(formatted);
                setToast({ message: "⚡ Tự động tối ưu định dạng từ AI (Offline)", type: 'success' });
              }
            }}
            className="flex-1 p-8 mono text-base leading-relaxed resize-none outline-none bg-transparent text-slate-800 select-text overflow-y-auto custom-scrollbar" 
            placeholder="Dán nội dung vào đây..." 
          />
        </div>
        <div className={`flex flex-col flex-1 bg-white overflow-y-auto custom-scrollbar transition-all ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           <div className="flex-1 py-12 px-8 md:px-16 max-w-4xl mx-auto w-full">
              <MarkdownPreview content={previewContent || content} />
           </div>
        </div>
      </main>

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={handleDrawingSubmit} isProcessing={isAiProcessing} />

      {showPermissionError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-2xl w-full rounded-[32px] overflow-hidden shadow-2xl">
            <div className="bg-amber-50 p-8 flex items-center gap-4 border-b border-amber-100">
              <Lock size={32} className="text-amber-600" />
              <h3 className="text-2xl font-black text-slate-900">Lỗi phân quyền Firestore</h3>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm">Cần bổ sung Collection <b>'devices'</b> vào Security Rules:</p>
              <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto">
{`match /devices/{deviceId} {
  allow read, write: if request.auth != null;
}`}
              </pre>
              <Button onClick={() => setShowPermissionError(false)} className="w-full py-4 rounded-2xl">Đã cập nhật</Button>
            </div>
          </div>
        </div>
      )}

      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white max-sm w-full rounded-[32px] p-10 text-center shadow-2xl">
            <AlertTriangle className="text-red-500 mx-auto mb-6" size={40} />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Hết lượt sử dụng</h3>
            <p className="text-slate-500 text-sm mb-8">Vui lòng liên hệ Admin để nạp thêm Credit. <br/><span className="font-bold text-slate-900">Zalo: 0868.640.898</span></p>
            <Button onClick={() => setShowCreditAlert(false)} className="w-full py-4 rounded-2xl">Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}
