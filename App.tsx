
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
  Copy, 
  CheckCircle2, 
  Info,
  X
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
  const [rememberMe, setRememberMe] = useState(true);

  // App State
  const [content, setContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef('');

  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  // Toast auto-hide
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
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setToast({ message: "Lỗi: " + error.message, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setUser({ uid: 'guest', email: 'guest@llm.com', displayName: 'Khách' } as any);
    setCredits(50);
    setToast({ message: "Đã vào với tư cách Khách (50 Credits)", type: 'info' });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setToast({ message: "Đã đăng xuất", type: 'info' });
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
          systemInstruction: "Bạn là chuyên gia định dạng Markdown và Toán học. Hãy chuẩn hóa nội dung, sửa lỗi LaTeX (như dấu phẩy trong công thức) và làm đẹp các bảng biểu. Trả về kết quả Markdown thuần túy." 
        }
      });
      if (response.text) {
        setContent(response.text);
        setPreviewContent(response.text);
        setToast({ message: "✨ Đã tối ưu hóa nội dung (-1 Credit)", type: 'success' });
      }
    } catch (error) {
      setToast({ message: "Lỗi AI: " + error, type: 'error' });
    } finally {
      setIsAiProcessing(false);
    }
  }, [content, user, credits]);

  const handlePaste = (e: React.ClipboardEvent) => {
    setToast({ message: "📋 Đã dán nội dung! Bạn có thể xem trước miễn phí.", type: 'success' });
  };

  const insertTextAtCursor = useCallback((textBefore: string, textAfter: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
        setContent(prev => prev + textBefore + textAfter);
        return;
    }
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

  const handleDrawingSubmit = useCallback(async (data: string) => {
    if (data.startsWith("LATEX_RAW:")) {
        insertTextAtCursor(data.replace("LATEX_RAW:", ""));
        setIsDrawingModalOpen(false);
        return;
    }
    // Hành động vẽ tay được coi là miễn phí (Offline MathType) theo yêu cầu mới nhất 
    // Nếu bạn muốn trừ điểm AI Vision cho vẽ tay, hãy bỏ comment deductCredit dưới đây:
    // const canProceed = await deductCredit();
    // if (!canProceed) return;

    setIsAiProcessing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: data.split(',')[1], mimeType: 'image/png' } },
                    { text: "Chuyển đổi hình ảnh vẽ tay này sang mã LaTeX chuẩn. Chỉ trả về mã LaTeX." }
                ]
            }
        });
        if (response.text) {
            insertTextAtCursor(response.text.trim());
            setIsDrawingModalOpen(false);
            setToast({ message: "🎨 Đã nhận diện công thức", type: 'success' });
        }
    } catch (error) {
        setToast({ message: "Lỗi nhận diện: " + error, type: 'error' });
    } finally {
        setIsAiProcessing(false);
    }
  }, [user, credits, insertTextAtCursor]);

  const handleCopyFormatted = useCallback(async () => {
    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl) return;

    const canProceed = await deductCredit();
    if (!canProceed) return;

    try {
      const blob = new Blob([previewEl.innerHTML], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ ["text/html"]: blob })]);
      setToast({ message: "✅ Đã sao chép thành công (-1 Credit)", type: 'success' });
    } catch (err) { 
      setToast({ message: "Lỗi sao chép định dạng!", type: 'error' });
    }
  }, [user, credits]);

  const handleManualPreview = useCallback(() => {
    // Xem trước giờ đã MIỄN PHÍ
    setPreviewContent(content);
    setActiveTab('preview');
    setToast({ message: "👁️ Đã cập nhật xem trước", type: 'info' });
  }, [content]);

  const handlePrint = useCallback(async () => {
    const canProceed = await deductCredit();
    if (!canProceed) return;

    setActiveTab('preview');
    setTimeout(() => {
      window.print();
      setToast({ message: "🖨️ Đã thực hiện lệnh in (-1 Credit)", type: 'success' });
    }, 500);
  }, [user, credits]);

  const handleExportWord = useCallback(async () => {
    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl) return;

    const canProceed = await deductCredit();
    if (!canProceed) return;

    const contentHtml = previewEl.innerHTML;
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Exported Document</title></head>
      <body>${contentHtml}</body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({ message: "📂 Đã xuất file Word (-1 Credit)", type: 'success' });
  }, [user, credits]);

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  if (!user) return (
    <div className="h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center"><Bot className="w-16 h-16 text-white mx-auto mb-4" /><h1 className="text-2xl font-bold text-white mb-2">LLM Markdown Viewer</h1></div>
        <div className="p-8">
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Mật khẩu" required />
            <Button type="submit" disabled={isLoginLoading} className="w-full justify-center">{isRegistering ? 'Đăng ký' : 'Đăng nhập'}</Button>
          </form>
          <div className="flex flex-col gap-3 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-indigo-600 font-medium">{isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
            <div className="flex items-center gap-2"><div className="flex-1 h-px bg-slate-200"></div><span className="text-xs text-slate-400 uppercase">Hoặc</span><div className="flex-1 h-px bg-slate-200"></div></div>
            <button onClick={handleGuestLogin} className="text-sm text-slate-500 hover:text-indigo-600 font-bold transition-colors">Dùng thử với tư cách Khách</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
            toast.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm z-20 no-print">
        <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl"><Bot /><span>LLM Viewer</span></div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-50 text-yellow-700 border rounded-full text-sm font-bold border-yellow-200 shadow-sm transition-all">
             {isDeducting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-yellow-500" />}
             <span>{credits ?? 0} Credits</span>
           </div>
           <div className="relative">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase hover:bg-indigo-200 transition-colors">{user?.email?.[0]}</button>
             {showProfileMenu && (
               <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border p-4 z-50">
                  <p className="font-bold text-slate-900 text-sm truncate mb-1">{user?.email}</p>
                  <p className="text-xs text-slate-400 mb-4">ID: {user?.uid}</p>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-lg px-2"><LogOut className="w-4 h-4" /> Đăng xuất</button>
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
        <div className={`${activeTab === 'editor' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/2 border-r bg-slate-50 relative`}>
          <textarea 
            ref={textareaRef} 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            onPaste={handlePaste}
            className="flex-1 p-6 font-mono text-sm leading-relaxed resize-none outline-none bg-transparent" 
            placeholder="Dán nội dung từ ChatGPT vào đây..." 
          />
          <div className="h-8 bg-white border-t px-4 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {content.length} ký tự
          </div>
        </div>
        <div className={`${activeTab === 'preview' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/2 bg-white overflow-y-auto`}>
           <div className="p-8 max-w-3xl mx-auto w-full"><MarkdownPreview content={previewContent || content} /></div>
        </div>
      </main>

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={handleDrawingSubmit} isProcessing={isAiProcessing} />

      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 text-center shadow-2xl relative">
            <button onClick={() => setShowCreditAlert(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Hết lượt sử dụng</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">Hành động này tốn 1 Credit. Vui lòng liên hệ Admin Duy Hạnh: <b>0868 640 898</b> để nạp thêm.</p>
            <Button onClick={() => setShowCreditAlert(false)} className="w-full">Đã hiểu</Button>
          </div>
        </div>
      )}
    </div>
  );
}
