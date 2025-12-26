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
  ChevronDown,
  Monitor,
  ShieldCheck,
  Mail,
  Fingerprint as IDIcon,
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
      canvas.width = 100; canvas.height = 30;
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
 * BỘ LỌC TOÁN HỌC TỰ ĐỘNG
 */
const autoFormatMath = (text: string): string => {
  let p = text;
  p = p.replace(/∫(\w)(\w)\s?([^=\n]+)/g, "\\int_{$1}^{$2} $3");
  p = p.replace(/√(\w)/g, "\\sqrt{$1}").replace(/√\(([^)]+)\)/g, "\\sqrt{$1}");
  p = p.replace(/vt([A-Z]{1,2})/g, "\\overrightarrow{$1}");
  p = p.replace(/g([A-Z]{3})/g, "\\widehat{$1}");
  
  return p.split('\n').map(line => {
    const hasMath = /\\int|\\sqrt|\\overrightarrow|\\widehat|\^|_/.test(line);
    return (hasMath && !line.includes('$$') && line.trim().length > 0) ? `$$ ${line.trim()} $$` : line;
  }).join('\n');
};

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // LOGIC TRỪ CREDIT
  const deductCredit = async (): Promise<boolean> => {
    if (!user || credits === null || credits <= 0) {
      setShowCreditAlert(true); return false;
    }
    setIsDeducting(true);
    try {
      const collectionName = user.isGuest ? "guests" : "users";
      await updateDoc(doc(db, collectionName, user.uid), { credits: increment(-1) });
      setCredits(prev => (prev !== null ? prev - 1 : 0));
      return true;
    } catch (e) { return false; } finally { setIsDeducting(false); }
  };

  // CHỐNG COPY
  useEffect(() => {
    const handleIllegalCopy = async (e: ClipboardEvent | KeyboardEvent) => {
      const isCopyKey = (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey) && e.key === 'c');
      if (isCopyKey || e.type === 'copy') {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 5) {
          e.preventDefault();
          if (await deductCredit()) {
            setToast({ message: "Phát hiện copy bôi đen! -1 Credit", type: 'error' });
          }
        }
      }
    };
    document.addEventListener('copy', handleIllegalCopy);
    document.addEventListener('keydown', handleIllegalCopy);
    return () => {
      document.removeEventListener('copy', handleIllegalCopy);
      document.removeEventListener('keydown', handleIllegalCopy);
    };
  }, [user, credits]);

  // ĐÓNG MENU KHI NHẤP RA NGOÀI
  useEffect(() => {
    const closeMenu = () => setShowProfileMenu(false);
    if (showProfileMenu) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [showProfileMenu]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const f = generateFingerprint();
      if (currentUser) {
        const isGuest = currentUser.isAnonymous;
        const docId = isGuest ? f : currentUser.uid;
        setUser({ ...currentUser, uid: docId, isGuest, displayEmail: isGuest ? "Chế độ dùng thử" : currentUser.email });
        const snap = await getDoc(doc(db, isGuest ? "guests" : "users", docId));
        if (snap.exists()) setCredits(snap.data().credits);
        else {
          const init = isGuest ? 10 : 20;
          await setDoc(doc(db, isGuest ? "guests" : "users", docId), { credits: init, deviceId: docId, isGuest });
          setCredits(init);
        }
      } else { setUser(null); }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAIEnhance = useCallback(async () => {
    if (!content.trim() || !(await deductCredit())) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: content,
        config: { systemInstruction: "Định dạng Markdown và LaTeX chuyên nghiệp." }
      });
      if (response.text) {
        setContent(response.text);
        setPreviewContent(response.text);
      }
    } catch (e) { setToast({message: "Lỗi AI", type: 'error'}); }
    finally { setIsAiProcessing(false); }
  }, [content, user, credits]);

  if (authLoading) return <div className="h-screen flex items-center justify-center font-mono">XÁC THỰC...</div>;

  if (!user) return (
    <div className="h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        <Bot className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-6">Đăng nhập Markdown Pro</h1>
        <form onSubmit={async (e) => {
          e.preventDefault(); setIsLoginLoading(true);
          try {
            if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
            else await signInWithEmailAndPassword(auth, email, password);
          } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
          finally { setIsLoginLoading(false); }
        }} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl outline-none" placeholder="Email" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl outline-none" placeholder="Mật khẩu" required />
          <Button type="submit" disabled={isLoginLoading} className="w-full py-4 rounded-xl">{isLoginLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Đăng ký' : 'Đăng nhập')}</Button>
        </form>
        <button onClick={() => signInAnonymously(auth)} className="mt-6 text-slate-500 font-bold hover:text-indigo-600 flex items-center gap-2 mx-auto"><Monitor size={16}/> Xác thực thiết bị</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl bg-white border flex items-center gap-3 animate-in slide-in-from-top-4">
          {toast.type === 'error' ? <AlertTriangle className="text-red-500" size={18}/> : <CheckCircle2 className="text-green-500" size={18}/>}
          <span className="font-bold text-sm text-slate-800">{toast.message}</span>
        </div>
      )}

      <header className="h-20 bg-white border-b px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Bot className="text-white" size={20} /></div>
          <h2 className="font-bold text-slate-900">Markdown Pro</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl">
            <Zap className="text-yellow-500" size={16} fill="currentColor" />
            <span className="font-black">{credits ?? 0} Credits</span>
          </div>

          {/* AVATAR & DROPDOWN MENU */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 hover:bg-slate-200"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                {user?.email ? user.email[0].toUpperCase() : 'G'}
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in zoom-in-95">
                <div className="p-6 bg-indigo-50/50 border-b border-indigo-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                      {user?.email ? user.email[0].toUpperCase() : 'G'}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-900 truncate">{user?.isGuest ? "Người dùng Khách" : "Thành viên Pro"}</h4>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={10}/> Đã xác thực</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* HIỂN THỊ ID TÀI KHOẢN */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ID Tài khoản</label>
                      <div 
                        onClick={() => {
                          navigator.clipboard.writeText(user.uid);
                          setToast({ message: "Đã copy ID", type: 'success' });
                        }}
                        className="flex items-center justify-between gap-2 text-slate-600 text-[11px] font-mono bg-white p-2 rounded-xl border border-indigo-50 cursor-pointer hover:bg-indigo-100/50 transition-colors"
                      >
                        <span className="truncate">{user.uid}</span>
                        <CopyIcon size={12} className="text-slate-400" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Liên hệ</label>
                      <div className="flex items-center gap-2 text-slate-500 text-xs bg-white/80 p-2 rounded-xl border border-indigo-50">
                        <Mail size={12}/> <span className="truncate">{user?.displayEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors font-bold text-sm">
                    <LogOut size={18} /> Đăng xuất tài khoản
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <Toolbar 
        onInsert={(t1, t2) => {
          const start = textareaRef.current?.selectionStart || 0;
          const end = textareaRef.current?.selectionEnd || 0;
          const val = content.substring(0, start) + t1 + content.substring(start, end) + (t2 || '') + content.substring(end);
          const formatted = autoFormatMath(val);
          setContent(formatted); setPreviewContent(formatted);
        }} 
        onAIEnhance={handleAIEnhance} isAiProcessing={isAiProcessing} isDeducting={isDeducting}
        onCopyFormatted={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (previewEl && (await deductCredit())) {
             const blob = new Blob([previewEl.innerHTML], { type: "text/html" });
             await navigator.clipboard.write([new ClipboardItem({ ["text/html"]: blob })]);
             setToast({ message: "Đã sao chép định dạng (-1 Credit)", type: 'success' });
          }
        }}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-slate-200 bg-slate-50/50">
          <textarea 
            ref={textareaRef} value={content} 
            onChange={e => {
              const formatted = autoFormatMath(e.target.value);
              setContent(formatted); setPreviewContent(formatted);
            }} 
            className="w-full h-full p-8 mono text-base outline-none bg-transparent select-text" 
            placeholder="Gõ: ∫ab, √x, vtAB, gABC..." 
          />
        </div>
        <div className="flex-1 bg-white overflow-y-auto pointer-events-none p-12">
           <MarkdownPreview content={previewContent || content} />
        </div>
      </main>

      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-white max-w-sm w-full rounded-[32px] p-10 text-center shadow-2xl">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-black mb-2">Hết Credit</h3>
            <p className="text-slate-500 mb-8 px-2 text-sm">Vui lòng nạp thêm lượt dùng để tiếp tục sử dụng.</p>
            <Button onClick={() => setShowCreditAlert(false)} className="w-full py-4 rounded-xl">Đã hiểu</Button>
          </div>
        </div>
      )}

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={() => {}} isProcessing={isAiProcessing} />
    </div>
  );
}
