
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
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  Bot, 
  Loader2, 
  Phone,
  UserCheck,
  LogOut,
  ShieldCheck,
  Mail,
  KeyRound,
  Zap,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  RefreshCw,
  Mic,
  X,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [credits, setCredits] = useState<number | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const passwordRef = useRef('');

  const [content, setContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
          setUser((prev: any) => (prev?.uid === 'guest' ? prev : null));
          if (user?.uid !== 'guest') {
              setAccessStatus('checking');
              setCredits(null);
          }
          setAuthLoading(false);
          return;
      }
      setUser(currentUser);
      await checkUserSubscription(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleManualPreview();
        }
    };
    const handleCopyCut = (e: ClipboardEvent) => {
      if (user && credits !== null && credits <= 0) {
        e.preventDefault();
        setShowCreditAlert(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (user) {
      document.addEventListener('copy', handleCopyCut);
      document.addEventListener('cut', handleCopyCut);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
    };
  }, [content, user, credits]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  const getPublicIP = async (): Promise<string | null> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return null;
    }
  };

  const generateDeviceFingerprint = async (): Promise<string> => {
    try {
        const parts = [navigator.userAgent, navigator.language, new Date().getTimezoneOffset().toString(), window.screen.width + 'x' + window.screen.height];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = 200; canvas.height = 50;
            ctx.fillText("LLM_FP", 2, 15);
            parts.push(canvas.toDataURL());
        }
        const str = parts.join("###");
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    } catch (e) {
        return "unknown_" + Math.random().toString(36);
    }
  };

  const checkUserSubscription = async (currentUser: User) => {
    if ((currentUser as any).uid === 'guest') return;
    setAccessStatus('checking');
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setCredits(data.credits);
        setAccessStatus(data.credits > 0 ? 'granted' : 'denied');
      } else {
        const ip = await getPublicIP();
        const fp = await generateDeviceFingerprint();
        const initialCredits = 10;
        await setDoc(userRef, {
          email: currentUser.email,
          credits: initialCredits,
          activatedAt: Timestamp.now(),
          ip, fingerprint: fp
        });
        setCredits(initialCredits);
        setAccessStatus('granted');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user || credits === null || credits <= 0) return false;
    if (user.uid === 'guest') {
        setCredits(prev => (prev! > 0 ? prev! - 1 : 0));
        return true;
    }
    setIsDeducting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { credits: increment(-1) });
      setCredits(prev => (prev! - 1));
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsDeducting(false);
    }
  };

  const normalizeContent = (text: string): string => {
    if (!text) return '';
    let processed = text;

    // 1. Chuyển đổi Block Math \[ ... \] -> $$ ... $$ có dấu cách và xuống dòng
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, p1) => `\n\n$$ ${p1.trim()} $$\n\n`);
    
    // 2. Chuyển đổi Inline Math \( ... \) -> $ ... $ có dấu cách
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, p1) => `$ ${p1.trim()} $`);

    // 3. Tách các công thức inline dính liền
    processed = processed.replace(/([^\s\$])\$\$([^\s\$])/g, '$1$ $ $2');
    processed = processed.replace(/(\$)([^\$]+)(\$)\s*(\$)([^\$]+)(\$)/g, '$1 $2 $3 $4 $5 $6');

    // 4. Đảm bảo mọi cặp $...$ có khoảng trắng bên trong
    processed = processed.replace(/(^|[^\$])\$([^\$\n]+?)\$([^\$]|$)/g, (match, p1, p2, p3) => {
        return `${p1}$ ${p2.trim()} $${p3}`;
    });

    // 5. Tách các dấu $$ block liền nhau
    processed = processed.replace(/\$\$\s*\$\$/g, '$$ \n\n $$');

    const lines = processed.split('\n').filter(line => !["Copy code", "markdown", "latex", "html"].includes(line.trim()));
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  };

  const insertTextAtCursor = useCallback((textBefore: string, textAfter: string = '', replace: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) {
        setContent(prev => prev + textBefore + textAfter);
        return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    
    // Nếu replace = true (khi dán), vùng chọn [start, end] sẽ bị xóa bỏ
    // Nếu replace = false (khi nhấn Bold/Italic), vùng chọn sẽ được kẹp giữa textBefore và textAfter
    const middle = replace ? '' : val.substring(start, end);
    
    const newContent = val.substring(0, start) + textBefore + middle + textAfter + val.substring(end);
    setContent(newContent);
    
    // Cập nhật vị trí con trỏ sau khi chèn
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textBefore.length + middle.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
     const pastedData = e.clipboardData.getData('text');
     const formattedData = normalizeContent(pastedData);
     
     // Luôn can thiệp vào hành động dán để xử lý việc "Bôi đen -> Thay thế" chuẩn xác
     e.preventDefault();
     insertTextAtCursor(formattedData, '', true);
  }, [insertTextAtCursor]);

  const handleAIEnhance = useCallback(async () => {
    if (!content.trim()) return;
    if (credits && credits > 0) await deductCredit();
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
        config: { systemInstruction: "Bạn là chuyên gia định dạng Markdown Toán học. Hãy chuẩn hóa toán học sang LaTeX chuẩn ($ cho inline, $$ cho block), thêm dấu cách vào trong dấu $, đảm bảo các công thức block nằm trên dòng riêng biệt." }
      });
      if (response.text) {
        setContent(response.text);
        setPreviewContent(response.text);
      }
    } catch (error) {
      alert("Lỗi AI");
    } finally {
      setIsAiProcessing(false);
    }
  }, [content, credits]);

  const handleManualPreview = useCallback(() => {
    const clean = normalizeContent(content);
    setContent(clean);
    setPreviewContent(clean);
    setActiveTab('preview');
  }, [content]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setUser({ uid: 'guest', email: 'guest@llm.com' });
    setCredits(50);
    setAccessStatus('granted');
  };

  const handleLogout = async () => { if (user?.uid !== 'guest') await signOut(auth); setUser(null); setCredits(null); };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center"><Bot className="w-12 h-12 text-white mx-auto mb-2"/><h1 className="text-xl font-bold text-white">DuyHanhMath</h1></div>
        <div className="p-8">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="Email" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="Mật khẩu" required />
            <Button type="submit" disabled={isLoginLoading} className="w-full">{isRegistering ? 'Đăng ký' : 'Đăng nhập'}</Button>
          </form>
          <button onClick={handleGuestLogin} className="w-full mt-4 text-indigo-600 text-sm">Dùng thử không tài khoản</button>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-2 text-slate-500 text-xs">{isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-16 border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-2"><Bot className="text-indigo-600"/><span className="font-bold">DuyHanhMath</span></div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full">{credits} Credits</div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-600"><LogOut className="w-5 h-5"/></button>
        </div>
      </header>
      <Toolbar 
        onInsert={insertTextAtCursor} onVoiceInput={() => {}} isListening={false} onOpenDrawing={() => setIsDrawingModalOpen(true)}
        onFileUpload={() => {}} fileInputRef={fileInputRef} onManualPreview={handleManualPreview}
        onAIEnhance={handleAIEnhance} isAiProcessing={isAiProcessing} isDeducting={isDeducting}
        onCopyFormatted={() => {}} onPrint={() => window.print()} onExportWord={() => {}} onClear={() => setContent('')}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r bg-slate-50 flex flex-col">
          <textarea 
            ref={textareaRef} value={content} onChange={e => setContent(e.target.value)} onPaste={handlePaste}
            className="flex-1 p-6 font-mono text-sm resize-none outline-none bg-transparent"
            placeholder="Dán nội dung từ ChatGPT vào đây..."
          />
        </div>
        <div className="w-1/2 p-8 overflow-y-auto">
          <MarkdownPreview content={previewContent} />
        </div>
      </div>
      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={(data) => {
        if(data.startsWith("LATEX_RAW:")) insertTextAtCursor(data.replace("LATEX_RAW:", ""), '', true);
        setIsDrawingModalOpen(false);
      }} isProcessing={false} />
    </div>
  );
}
