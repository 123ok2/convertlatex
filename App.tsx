
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
  signOut,
  User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
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
  ChevronDown
} from 'lucide-react';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // App State
  const [content, setContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserSubscription(currentUser);
      } else {
        setUser(null);
        setCredits(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkUserSubscription = async (currentUser: User) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setCredits(data.credits ?? 0);
      } else {
        const initialCredits = 10;
        await setDoc(userRef, {
          email: currentUser.email,
          activatedAt: Timestamp.now(),
          credits: initialCredits
        });
        setCredits(initialCredits);
      }
    } catch (error) {
      console.error("Auth error:", error);
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
      if (user.uid === 'guest') {
        setCredits(prev => (prev !== null ? prev - 1 : 0));
        return true;
      }
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { credits: increment(-1) });
      setCredits(prev => (prev !== null ? prev - 1 : 0));
      return true;
    } catch (error) {
      setToast({ message: "Lỗi kết nối khi trừ điểm!", type: 'error' });
      return false;
    } finally {
      setIsDeducting(false);
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

  const handleGuestLogin = () => {
    setUser({ uid: 'guest', email: 'khach@viewer.pro', displayName: 'Khách' } as any);
    setCredits(50);
    setToast({ message: "Đã vào với tư cách Khách", type: 'info' });
  };

  const handleAIEnhance = useCallback(async () => {
    if (!content.trim()) return;
    const canProceed = await deductCredit();
    if (!canProceed) return;

    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: content,
        config: { 
          systemInstruction: "Bạn là chuyên gia định dạng Markdown và Toán học. Hãy chuẩn hóa nội dung, sửa lỗi LaTeX và làm đẹp các bảng biểu. Trả về kết quả Markdown thuần túy." 
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
      textarea.focus();
      textarea.setSelectionRange(start + textBefore.length, end + textBefore.length);
    }, 0);
  }, []);

  const handleManualPreview = useCallback(() => {
    setPreviewContent(content);
    setActiveTab('preview');
    setToast({ message: "👁️ Chế độ xem trước", type: 'info' });
  }, [content]);

  const handleCopyFormatted = useCallback(async () => {
    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl) return;
    const canProceed = await deductCredit();
    if (!canProceed) return;

    try {
      const blob = new Blob([previewEl.innerHTML], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ ["text/html"]: blob })]);
      setToast({ message: "✅ Đã sao chép định dạng", type: 'success' });
    } catch (err) { 
      setToast({ message: "Lỗi sao chép!", type: 'error' });
    }
  }, [user, credits]);

  const handlePrint = useCallback(async () => {
    const canProceed = await deductCredit();
    if (!canProceed) return;
    window.print();
  }, [user, credits]);

  const handleExportWord = useCallback(async () => {
    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl || !content) return;
    const canProceed = await deductCredit();
    if (!canProceed) return;

    const fullHtml = `<html><head><meta charset='utf-8'></head><body>${previewEl.innerHTML}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Document_${Date.now()}.doc`;
    link.click();
    setToast({ message: "📂 Đã xuất file Word", type: 'success' });
  }, [user, credits, content]);

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <span className="text-slate-500 font-medium">Đang khởi tạo hệ thống...</span>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white">
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <Bot className="w-16 h-16 text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-extrabold text-white mb-1 relative z-10">LLM Markdown Pro</h1>
          <p className="text-indigo-100 text-sm opacity-80 relative z-10">Chuyển đổi tài liệu AI chuyên nghiệp</p>
        </div>
        <div className="p-10">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" placeholder="Địa chỉ Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" placeholder="Mật khẩu" required />
            <Button type="submit" disabled={isLoginLoading} className="w-full py-4 text-lg font-bold rounded-xl shadow-indigo-200 shadow-xl">
              {isLoginLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Tham gia ngay' : 'Đăng nhập')}
            </Button>
          </form>
          <div className="mt-8 flex flex-col items-center gap-4">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">Hoặc trải nghiệm</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <button onClick={handleGuestLogin} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Vào nhanh với tư cách Khách</button>
          </div>
        </div>
      </div>
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

      {/* Modern Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-40 no-print flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 leading-tight">Markdown Pro</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ thống sẵn sàng</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-5 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-default">
             <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="text-white" size={16} fill="white" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Số dư lượt dùng</p>
                <p className="text-lg font-black leading-none">{credits ?? 0} Credits</p>
             </div>
           </div>

           <div className="relative">
             <button 
               onClick={() => setShowProfileMenu(!showProfileMenu)} 
               className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 hover:bg-white transition-all"
             >
               <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">{user?.email?.[0].toUpperCase()}</div>
               <ChevronDown size={16} className="text-slate-400 mr-2" />
             </button>
             {showProfileMenu && (
               <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><UserIcon size={24} /></div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 truncate">{user?.email}</p>
                      <p className="text-xs text-slate-400">Gói cá nhân</p>
                    </div>
                  </div>
                  <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors">
                    <LogOut size={18} /> Đăng xuất
                  </button>
               </div>
             )}
           </div>
        </div>
      </header>

      <Toolbar 
        onInsert={insertTextAtCursor} onVoiceInput={() => {}} isListening={false} 
        onOpenDrawing={() => setIsDrawingModalOpen(true)} onFileUpload={() => {}} fileInputRef={fileInputRef}
        onManualPreview={handleManualPreview} onAIEnhance={handleAIEnhance} isAiProcessing={isAiProcessing} isDeducting={isDeducting}
        onCopyFormatted={handleCopyFormatted} onPrint={handlePrint} onExportWord={handleExportWord} onClear={() => setContent('')}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className={`flex flex-col flex-1 border-r border-slate-200 bg-slate-50/50 transition-all duration-300 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 relative">
            <textarea 
              ref={textareaRef} 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              onPaste={() => setToast({message: "Đã dán nội dung", type: 'info'})}
              className="absolute inset-0 w-full h-full p-8 mono text-base leading-relaxed resize-none outline-none bg-transparent text-slate-800 placeholder:text-slate-300" 
              placeholder="Dán nội dung Markdown từ ChatGPT vào đây..." 
            />
          </div>
          <div className="h-10 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">
            <span>{content.length} ký tự</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Chế độ: Soạn thảo</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> UTF-8</span>
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        <div className={`flex flex-col flex-1 bg-white overflow-y-auto custom-scrollbar transition-all duration-300 ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           <div className="flex-1 py-12 px-8 md:px-16 max-w-4xl mx-auto w-full">
              {activeTab === 'preview' && (
                <button 
                  onClick={() => setActiveTab('editor')} 
                  className="md:hidden mb-6 flex items-center gap-2 text-indigo-600 font-bold"
                >
                  <X size={18} /> Đóng xem trước
                </button>
              )}
              <MarkdownPreview content={previewContent || content} />
           </div>
        </div>
      </main>

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={(data) => {}} isProcessing={false} />

      {/* Credit Alert Modal */}
      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-sm w-full rounded-[32px] p-10 text-center shadow-2xl border border-white">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
               <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Hết lượt sử dụng</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">Vui lòng nạp thêm lượt dùng để tiếp tục. <br/><span className="font-bold text-slate-900">Zalo Admin: 0868.640.898</span></p>
            <Button onClick={() => setShowCreditAlert(false)} className="w-full py-4 text-lg font-bold rounded-2xl">Tôi đã hiểu</Button>
          </div>
        </div>
      )}
    </div>
  );
}
