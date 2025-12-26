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
  Copy as CopyIcon
} from 'lucide-react';

/**
 * HỆ THỐNG ĐỊNH DANH THIẾT BỊ
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
 * BỘ LỌC TOÁN HỌC TỰ ĐỘNG (KHÔNG CẦN AI)
 * Hỗ trợ Sách giáo khoa 2018: Tích phân, Căn thức, Vectơ, Góc.
 */
const autoFormatMath = (text: string): string => {
  let p = text;
  // 1. Tích phân: ∫ab -> \int_{a}^{b}
  p = p.replace(/∫(\w)(\w)\s?([^=\n]+)/g, "\\int_{${1}}^{${2}} $3");
  // 2. Căn thức: √x hoặc √(x+1) -> \sqrt{x}
  p = p.replace(/√(\w)/g, "\\sqrt{$1}").replace(/√\(([^)]+)\)/g, "\\sqrt{$1}");
  // 3. Vectơ: vtAB -> \overrightarrow{AB}
  p = p.replace(/vt([A-Z]{1,2})/g, "\\overrightarrow{$1}");
  // 4. Góc: gABC -> \widehat{ABC}
  p = p.replace(/g([A-Z]{3})/g, "\\widehat{$1}");
  
  // Tự động bao quanh bằng $$ nếu chứa ký hiệu toán học đặc biệt nhưng chưa có định dạng
  const lines = p.split('\n');
  const formattedLines = lines.map(line => {
    const hasMath = /\\int|\\sqrt|\\overrightarrow|\\widehat|\^|_/.test(line);
    if (hasMath && !line.includes('$$') && line.trim().length > 0) {
      return `$$ ${line.trim()} $$`;
    }
    return line;
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

  // LOGIC TRỪ CREDIT
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
      setToast({ message: "Lỗi kết nối máy chủ!", type: 'error' });
      return false;
    } finally {
      setIsDeducting(false);
    }
  };

  // HỆ THỐNG BẢO VỆ CHỐNG COPY VÀ TRỪ CREDIT KHI VI PHẠM
  useEffect(() => {
    const handleIllegalCopy = async (e: ClipboardEvent | KeyboardEvent) => {
      const isCopyKey = (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey) && e.key === 'c');
      const isCopyEvent = (e.type === 'copy');

      if (isCopyKey || isCopyEvent) {
        const selection = window.getSelection()?.toString();
        // Nếu bôi đen trên 5 ký tự thì chặn và trừ credit
        if (selection && selection.length > 5) {
          e.preventDefault();
          const success = await deductCredit();
          if (success) {
            setToast({ message: "Copy bôi đen bị trừ 1 credit!", type: 'error' });
            alert("Hành động copy bị hạn chế để bảo vệ nội dung. Hệ thống đã trừ 1 Credit phí bản quyền.");
          }
        }
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      if (activeTab === 'preview') e.preventDefault();
    };

    document.addEventListener('copy', handleIllegalCopy);
    document.addEventListener('keydown', handleIllegalCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    return () => {
      document.removeEventListener('copy', handleIllegalCopy);
      document.removeEventListener('keydown', handleIllegalCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [user, credits, activeTab]);

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
        await syncUserCredits(docId, isGuest);
      } else {
        setUser(null);
        setCredits(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncUserCredits = async (id: string, isGuest: boolean) => {
    try {
      const collectionName = isGuest ? "guests" : "users";
      const userRef = doc(db, collectionName, id);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setCredits(snap.data().credits ?? 0);
      } else {
        const initialCredits = isGuest ? 10 : 20;
        await setDoc(userRef, {
          email: isGuest ? `guest-${id}@device.local` : email,
          credits: initialCredits,
          activatedAt: Timestamp.now(),
          deviceId: id,
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

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      setShowConfigError(true);
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
      setToast({ message: error.message, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
    } catch (error: any) {
      setToast({ message: "Lỗi đăng xuất", type: 'error' });
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
    };
    reader.readAsText(file);
  };

  const handleAIEnhance = useCallback(async () => {
    if (!content.trim()) return;
    const canProceed = await deductCredit();
    if (!canProceed) return;

    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: content,
        config: { 
          systemInstruction: "Bạn là chuyên gia định dạng Markdown và LaTeX. Hãy làm đẹp nội dung toán học và bảng biểu. Trả về Markdown thuần.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      if (response.text) {
        setContent(response.text);
        setPreviewContent(response.text);
        setToast({ message: "✨ Đã tối ưu hóa nội dung", type: 'success' });
      }
    } catch (error) {
      setToast({ message: "Lỗi AI: " + error, type: 'error' });
    } finally {
      setIsAiProcessing(false);
    }
  }, [content, user, credits]);

  const insertTextAtCursor = useCallback((textBefore: string, textAfter: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;
    const newContent = previousContent.substring(0, start) + textBefore + previousContent.substring(start, end) + textAfter + previousContent.substring(end);
    
    // Áp dụng autoFormat ngay khi chèn ký tự đặc biệt
    const formattedContent = autoFormatMath(newContent);
    setContent(formattedContent);
    setPreviewContent(formattedContent);

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
      insertTextAtCursor(`$$ ${latex} $$`);
      setIsDrawingModalOpen(false);
    } else {
      setIsAiProcessing(true);
      try {
        if (await deductCredit()) {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const base64Data = data.split(',')[1];
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ inlineData: { mimeType: 'image/png', data: base64Data } }, { text: "Convert to LaTeX. Return ONLY string." }] },
          });
          if (response.text) {
            insertTextAtCursor(`$$ ${response.text.trim()} $$`);
            setIsDrawingModalOpen(false);
          }
        }
      } catch (error) {
        setToast({ message: "Lỗi nhận diện", type: 'error' });
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
          <Bot className="w-16 h-16 text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-extrabold text-white mb-1 relative z-10">LLM Markdown Pro</h1>
          <p className="text-indigo-100 text-sm opacity-80 relative z-10">Dành cho Giáo viên Phổ thông</p>
        </div>
        <div className="p-10">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="Mật khẩu" required />
            <Button type="submit" disabled={isLoginLoading} className="w-full py-4 text-lg font-bold rounded-xl">
              {isLoginLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Đăng ký' : 'Đăng nhập')}
            </Button>
          </form>
          <div className="mt-8 flex flex-col items-center gap-4">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-semibold text-indigo-600">
              {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
            <button onClick={handleGuestLogin} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2">
              <Monitor size={14} /> Xác thực ID Thiết bị (10 Credit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none"> {/* select-none chặn bôi đen toàn trang */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border bg-white ${toast.type === 'success' ? 'text-green-700' : 'text-indigo-700'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 leading-tight text-lg">Markdown Pro</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {user.isGuest ? 'Phiên dùng thử' : 'Thành viên Pro'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-5 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl">
             <Zap className="text-yellow-500" size={16} fill="currentColor" />
             <p className="text-lg font-black leading-none">{credits ?? 0} Credits</p>
           </div>
           <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
               {user.email?.[0].toUpperCase() || 'G'}
             </div>
             <ChevronDown size={16} className="text-slate-400 mr-2" />
           </button>
        </div>
      </header>

      <Toolbar 
        onInsert={insertTextAtCursor} 
        onVoiceInput={() => {}} 
        isListening={false} 
        onOpenDrawing={() => setIsDrawingModalOpen(true)} 
        onFileUpload={handleFileUpload} 
        fileInputRef={fileInputRef}
        onManualPreview={() => {setPreviewContent(content); setActiveTab('preview');}} 
        onAIEnhance={handleAIEnhance} isAiProcessing={isAiProcessing} isDeducting={isDeducting}
        onCopyFormatted={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (previewEl && await deductCredit()) {
             const blob = new Blob([previewEl.innerHTML], { type: "text/html" });
             await navigator.clipboard.write([new ClipboardItem({ ["text/html"]: blob })]);
             setToast({ message: "✅ Đã sao chép định dạng (-1 Credit)", type: 'success' });
          }
        }} 
        onPrint={async () => { if (await deductCredit()) window.print(); }} 
        onExportWord={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (previewEl && await deductCredit()) {
             const fullHtml = `<html><head><meta charset='utf-8'></head><body>${previewEl.innerHTML}</body></html>`;
             const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
             const link = document.createElement('a');
             link.href = URL.createObjectURL(blob);
             link.download = `Doc_${Date.now()}.doc`;
             link.click();
          }
        }} 
        onClear={() => { if (confirm('Xóa hết nội dung?')) { setContent(''); setPreviewContent(''); } }}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col flex-1 border-r border-slate-200 bg-slate-50/50 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <textarea 
            ref={textareaRef} 
            value={content} 
            onChange={(e) => {
              const rawValue = e.target.value;
              // Tự động định dạng toán học không cần AI
              const formatted = autoFormatMath(rawValue);
              setContent(formatted);
              setPreviewContent(formatted);
            }} 
            className="flex-1 p-8 mono text-base leading-relaxed resize-none outline-none bg-transparent text-slate-800 placeholder:text-slate-300 select-text" 
            placeholder="Dán nội dung vào đây. Ví dụ: ∫ab, √x, vtAB, gABC..." 
          />
        </div>
        {/* VÙNG PREVIEW - CHẶN CHUỘT ĐỂ CHỐNG COPY */}
        <div className={`flex flex-col flex-1 bg-white overflow-y-auto pointer-events-none ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           <div className="flex-1 py-12 px-8 md:px-16 max-w-4xl mx-auto w-full">
              <MarkdownPreview content={previewContent || content} />
           </div>
        </div>
      </main>

      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-sm w-full rounded-[32px] p-10 text-center shadow-2xl border border-white">
            <AlertTriangle className="text-red-500 mx-auto mb-6" size={40} />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Hết lượt sử dụng</h3>
            <p className="text-slate-500 text-sm mb-8 px-2">Bạn cần nạp thêm credit hoặc đăng nhập tài khoản Pro để tiếp tục.</p>
            <Button onClick={() => setShowCreditAlert(false)} className="w-full py-4 rounded-2xl">Đã hiểu</Button>
          </div>
        </div>
      )}

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={handleDrawingSubmit} isProcessing={isAiProcessing} />
    </div>
  );
}
