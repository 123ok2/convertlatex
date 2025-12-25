
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
 * HỆ THỐNG ĐỊNH DANH THIẾT BỊ (DEVICE FINGERPRINTING)
 * Tạo ID duy nhất dựa trên phần cứng và trình duyệt để quản lý Credit khách.
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

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Modals for errors/alerts
  const [showConfigError, setShowConfigError] = useState(false);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);

  // App Content State
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

  // Auth Observer & Credit Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const fingerprint = generateFingerprint();
      
      if (currentUser) {
        const isGuest = currentUser.isAnonymous;
        // Document ID cho khách là vân tay thiết bị để chống reset credit
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
        // Cấp 10 credit cho thiết bị khách mới, 20 cho tài khoản đăng ký
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
      console.error("Firestore sync error:", error);
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        setShowPermissionError(true);
      }
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
      setToast({ message: error.message, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Fix: Added handleLogout function to fix the reference error on line 380
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToast({ message: "Đã đăng xuất thành công", type: 'success' });
      setShowProfileMenu(false);
    } catch (error: any) {
      setToast({ message: "Lỗi đăng xuất: " + error.message, type: 'error' });
    }
  };

  // Fix: Implemented file upload handler
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

  const handleAIEnhance = useCallback(async () => {
    if (!content.trim()) return;
    const canProceed = await deductCredit();
    if (!canProceed) return;

    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Upgraded to gemini-3-pro-preview for high-quality mathematical and STEM formatting
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: content,
        config: { 
          systemInstruction: "Bạn là chuyên gia định dạng Markdown và LaTeX. Hãy làm đẹp nội dung toán học và bảng biểu. Đảm bảo mọi công thức phức tạp được trình bày chuẩn xác trong block $$ hoặc inline $. Trả về Markdown thuần.",
          thinkingConfig: { thinkingBudget: 0 } // Disabling thinking for formatting tasks to reduce latency
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
    setContent(newContent);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + textBefore.length, end + textBefore.length);
      }
    }, 0);
  }, []);

  // Fix: Implemented formula recognition from drawing or direct LaTeX input
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
          const imagePart = {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data,
            },
          };
          const textPart = {
            text: "Convert this handwritten mathematical, physical or chemical formula into standard LaTeX. Return ONLY the LaTeX string without delimiters like $ or $$. If there are multiple lines, separate them with double newlines."
          };
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, textPart] },
          });
          
          if (response.text) {
            insertTextAtCursor(`$$ ${response.text.trim()} $$`);
            setToast({ message: "✨ Đã nhận diện công thức", type: 'success' });
            setIsDrawingModalOpen(false);
          }
        }
      } catch (error) {
        setToast({ message: "Lỗi nhận diện: " + error, type: 'error' });
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
          <p className="text-indigo-100 text-sm opacity-80 relative z-10">Chuyển đổi tài liệu AI nâng cao</p>
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
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">Dùng thử miễn phí</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <button onClick={handleGuestLogin} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 group">
              <Monitor size={14} className="group-hover:scale-110 transition-transform" /> 
              Xác thực ID Thiết bị (10 Credit)
            </button>
          </div>
        </div>
      </div>
      
      {/* ERROR MODAL: Firebase Config */}
      {showConfigError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-lg w-full rounded-[32px] overflow-hidden shadow-2xl">
            <div className="bg-red-50 p-8 border-b border-red-100 flex items-center gap-4">
              <ShieldAlert className="text-red-500" size={32} />
              <h3 className="text-xl font-black text-slate-900">Auth chưa kích hoạt</h3>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-slate-600 text-sm">Admin cần vào <b>Firebase Console > Authentication > Sign-in method</b> và bật <b>Anonymous</b>.</p>
              <Button onClick={() => setShowConfigError(false)} className="w-full py-4 rounded-2xl">Tôi đã hiểu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border glass ${
            toast.type === 'success' ? 'border-green-100 text-green-700' : 'border-indigo-100 text-indigo-700'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-indigo-100'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
            </div>
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
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

           <div className="relative">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 hover:bg-white transition-all">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${user.isGuest ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                 {user.isGuest ? <Monitor size={20} /> : (user.email?.[0].toUpperCase() || 'U')}
               </div>
               <ChevronDown size={16} className="text-slate-400 mr-2" />
             </button>
             {showProfileMenu && (
               <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                      {user.isGuest ? <Fingerprint size={24} /> : <UserIcon size={24} />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 truncate text-sm leading-tight">{user.displayEmail}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-1">ID: {user.uid}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors">
                    <LogOut size={18} /> Đăng xuất
                  </button>
               </div>
             )}
           </div>
        </div>
      </header>

      <Toolbar 
        onInsert={insertTextAtCursor} 
        onVoiceInput={() => { setToast({ message: "Tính năng nhập giọng nói đang phát triển", type: 'info' }) }} 
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
             setToast({ message: "✅ Đã sao chép định dạng", type: 'success' });
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
             setToast({ message: "📂 Đã xuất file Word", type: 'success' });
          }
        }} 
        onClear={() => {
          if (confirm('Bạn có chắc chắn muốn xóa toàn bộ nội dung?')) {
            setContent('');
            setPreviewContent('');
          }
        }}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col flex-1 border-r border-slate-200 bg-slate-50/50 transition-all ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 p-8 mono text-base leading-relaxed resize-none outline-none bg-transparent text-slate-800 placeholder:text-slate-300" placeholder="Dán nội dung từ ChatGPT vào đây..." />
        </div>
        <div className={`flex flex-col flex-1 bg-white overflow-y-auto custom-scrollbar transition-all ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           <div className="flex-1 py-12 px-8 md:px-16 max-w-4xl mx-auto w-full">
              <MarkdownPreview content={previewContent || content} />
           </div>
        </div>
      </main>

      <DrawingModal 
        isOpen={isDrawingModalOpen} 
        onClose={() => setIsDrawingModalOpen(false)} 
        onSubmit={handleDrawingSubmit} 
        isProcessing={isAiProcessing} 
      />

      {/* ERROR MODAL: Firestore Permissions */}
      {showPermissionError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-2xl w-full rounded-[32px] overflow-hidden shadow-2xl">
            <div className="bg-amber-50 p-8 flex items-center gap-4 border-b border-amber-100 text-amber-600">
              <Lock size={32} />
              <h3 className="text-2xl font-black text-slate-900">Lỗi phân quyền Firestore</h3>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm leading-relaxed">Admin cần cập nhật <b>Security Rules</b> trong Firebase Console:</p>
              <div className="relative">
                <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }
    match /guests/{fingerprintId} { allow read, write: if request.auth != null; }
  }
}`}
                </pre>
                <button onClick={() => { navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n    match /guests/{fingerprintId} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}`); setToast({ message: "Đã sao chép Rules", type: 'success' }); }} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"><CopyIcon size={16} /></button>
              </div>
              <Button onClick={() => setShowPermissionError(false)} className="w-full py-4 rounded-2xl">Tôi đã cập nhật Rules</Button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Alert */}
      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white max-sm w-full rounded-[32px] p-10 text-center shadow-2xl border border-white">
            <AlertTriangle className="text-red-500 mx-auto mb-6" size={40} />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Hết lượt dùng thử</h3>
            <p className="text-slate-500 text-sm mb-8 px-2">ID thiết bị của bạn đã hết 10 lượt dùng miễn phí. <br/><span className="font-bold text-slate-900">Zalo Admin: 0868.640.898</span></p>
            <Button onClick={() => setShowCreditAlert(false)} className="w-full py-4 text-lg font-bold rounded-2xl">Tôi đã hiểu</Button>
          </div>
        </div>
      )}
    </div>
  );
}
