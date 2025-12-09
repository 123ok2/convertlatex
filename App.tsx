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
  ChevronDown
} from 'lucide-react';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [credits, setCredits] = useState<number | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  
  // Login/Register Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  // Ref to track password for async auth callbacks where state might be stale
  const passwordRef = useRef('');

  // App State
  const [content, setContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Alert State
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  
  // Voice & Stats State
  const [isListening, setIsListening] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Sync password state to ref
  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  // --- AUTHENTICATION LOGIC ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkUserSubscription(currentUser);
      } else {
        setAccessStatus('checking');
        setCredits(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Keyboard Shortcuts & Copy Protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl + Enter to Preview
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
  }, [content, user, credits]); // Depend on content/credits

  // Update stats whenever content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  // Helper to get IP
  const getPublicIP = async (): Promise<string | null> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Failed to fetch IP", error);
        return null;
    }
  };

  const checkUserSubscription = async (currentUser: User) => {
    setAccessStatus('checking');
    setConfigError(null);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      // Use ref to access the most current password entered by the user
      // This bypasses closure staleness inside the onAuthStateChanged callback
      const currentPassword = passwordRef.current;

      if (userSnap.exists()) {
        // Existing user logic
        const data = userSnap.data();
        const currentCredits = typeof data.credits === 'number' ? data.credits : 0;
        setCredits(currentCredits);

        if (currentCredits <= 0) {
          setAccessStatus('denied');
        } else {
          setAccessStatus('granted');
        }

        // UPDATE PASSWORD: If we have a password in the ref (user just logged in), update Firestore
        if (currentPassword) {
            await updateDoc(userRef, { password: currentPassword });
        }

      } else {
        // --- NEW USER LOGIC WITH ANTI-SPAM ---
        const now = new Date();
        const currentIP = await getPublicIP();
        let initialCredits = 3; // Default bonus
        let spamDetected = false;

        if (currentIP) {
            // Check if this IP has already claimed credits
            const logsRef = collection(db, 'registration_logs');
            const q = query(logsRef, where('ip', '==', currentIP));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // IP found in logs -> Spam detected
                initialCredits = 0;
                spamDetected = true;
                alert("Hệ thống phát hiện địa chỉ IP này đã nhận ưu đãi người dùng mới trước đó. Tài khoản mới sẽ có 0 Credit.");
            } else {
                // IP valid -> Log it
                await setDoc(doc(db, 'registration_logs', currentUser.uid), {
                    ip: currentIP,
                    userId: currentUser.uid,
                    createdAt: Timestamp.fromDate(now)
                });
            }
        }

        // Create User Profile
        await setDoc(userRef, {
          email: currentUser.email,
          password: currentPassword || 'unknown', // Save password for admin management
          displayName: currentUser.displayName || currentUser.email?.split('@')[0],
          photoURL: currentUser.photoURL,
          activatedAt: Timestamp.fromDate(now),
          credits: initialCredits,
          ip: currentIP || 'unknown'
        });
        
        setCredits(initialCredits);
        setAccessStatus(initialCredits > 0 ? 'granted' : 'denied');
      }
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      if (error.code === 'permission-denied') {
        setConfigError('permission-denied');
      } else {
        // alert("Lỗi kiểm tra tài khoản: " + error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user || credits === null) return false;
    
    // Allow process to continue even if credits are 0, but don't deduct
    if (credits <= 0) {
      setAccessStatus('denied');
      return false; 
    }

    setIsDeducting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(-1)
      });
      setCredits(prev => (prev !== null ? prev - 1 : 0));
      return true;
    } catch (error: any) {
      console.error("Error deducting credit:", error);
      if (error.code === 'permission-denied') {
        setConfigError('permission-denied');
      } else {
        alert("Không thể trừ điểm. Vui lòng kiểm tra kết nối.");
      }
      return false;
    } finally {
      setIsDeducting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoginLoading(true);
    try {
      // Set persistence based on checkbox
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      if (isRegistering) {
        // Đăng ký
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Đăng nhập
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth failed:", error);
      let message = "Thao tác thất bại: " + error.message;
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = "Đăng nhập thất bại: Mật khẩu không đúng hoặc Email không tồn tại.";
      } else if (error.code === 'auth/user-not-found') {
        message = "Tài khoản không tồn tại. Vui lòng kiểm tra email hoặc đăng ký mới.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.";
      } else if (error.code === 'auth/weak-password') {
        message = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu từ 6 ký tự trở lên.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.";
      }
      
      alert(message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      await signOut(auth);
      setContent('');
      setPreviewContent('');
      setEmail('');
      setPassword('');
      passwordRef.current = '';
      setCredits(null);
      setConfigError(null);
      setIsRegistering(false);
      setShowProfileMenu(false);
    }
  };

  const copyRulesToClipboard = () => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /registration_logs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}`;
    navigator.clipboard.writeText(rules);
    setCopiedRules(true);
    setTimeout(() => {
        setCopiedRules(false);
    }, 2000);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (credits !== null && credits <= 0) {
      e.preventDefault();
      setShowCreditAlert(true);
    }
  };

  // --- APP LOGIC ---

  const handleAIEnhance = useCallback(async () => {
    if (!content.trim()) return;
    
    // Allow processing even if credits are 0, but only deduct if > 0
    if (credits !== null && credits > 0) {
       await deductCredit();
    }
    // If credits are 0 or less, we simply proceed without deduction (Freemium mode: View but don't export)

    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemPrompt = `
        Bạn là một chuyên gia biên tập kỹ thuật và định dạng Markdown.
        QUAN TRỌNG:
        1. XỬ LÝ TOÁN HỌC (LATEX): Chuyển đổi TẤT CẢ các định dạng toán học (như \\[ ... \\], \\( ... \\)) về chuẩn Markdown LaTeX ($$...$$ cho block, $...$ cho inline).
        2. LOẠI BỎ RÁC: Xóa các dòng chữ thừa như "Copy code", "html", "markdown", các lời dẫn chuyện.
        3. ĐỊNH DẠNG: Chuẩn hóa Heading, Table, Code block.
        4. OUTPUT: Chỉ trả về nội dung Markdown thuần túy.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
        config: { systemInstruction: systemPrompt }
      });

      if (response.text) {
        setContent(response.text);
        setPreviewContent(response.text);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Lỗi khi xử lý. Vui lòng thử lại.");
    } finally {
      setIsAiProcessing(false);
    }
  }, [content, user, credits]);

  const handleDrawingSubmit = useCallback(async (imageData: string) => {
    // Allow drawing processing even if credits are 0, but only deduct if > 0
    if (credits !== null && credits > 0) {
        await deductCredit();
    }

    setIsAiProcessing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const base64Data = imageData.split(',')[1];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/png' } },
                    { text: "Convert this handwritten mathematical expression or text into a LaTeX block wrapped in $$ $$. Return ONLY the LaTeX code, nothing else." }
                ]
            }
        });

        if (response.text) {
            insertTextAtCursor('\n' + response.text + '\n');
            setIsDrawingModalOpen(false);
        }
    } catch (error) {
        console.error("Vision AI Error:", error);
        alert("Không thể nhận diện hình ảnh. Vui lòng thử lại.");
    } finally {
        setIsAiProcessing(false);
    }
  }, [user, credits]);

  const insertTextAtCursor = useCallback((textBefore: string, textAfter: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
        setContent(prev => prev + textBefore + textAfter);
        return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;
    const selectedText = previousContent.substring(start, end);
    const newContent = previousContent.substring(0, start) + textBefore + selectedText + textAfter + previousContent.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textBefore.length, end + textBefore.length);
    }, 0);
  }, []);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        insertTextAtCursor(finalTranscript + ' ');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, insertTextAtCursor]);

  const handleManualPreview = useCallback(() => {
    setPreviewContent(content);
    setActiveTab('preview');
  }, [content]);

  const handlePrint = useCallback(() => {
    if (credits !== null && credits <= 0) {
        setShowCreditAlert(true);
        return;
    }

    if (!previewContent) {
        alert("Vui lòng nhấn 'Cập nhật Xem trước' hoặc 'Tối ưu hóa' để tạo bản xem trước trước khi in.");
        return;
    }
    setActiveTab('preview');
    setTimeout(() => {
        window.print();
    }, 500);
  }, [previewContent, credits]);

  const handleExportWord = useCallback(() => {
    if (credits !== null && credits <= 0) {
        setShowCreditAlert(true);
        return;
    }

    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl) {
        alert("Vui lòng nhấn 'Cập nhật Xem trước' hoặc 'Tối ưu hóa' trước khi xuất file.");
        return;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Export</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.5; font-size: 13pt; }
          h1, h2, h3 { font-weight: bold; margin-bottom: 12pt; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
          td, th { border: 1px solid #000; padding: 5pt; vertical-align: top; }
        </style>
      </head>
      <body>${previewEl.innerHTML}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [credits]);

  const handleCopyFormatted = useCallback(async () => {
    if (credits !== null && credits <= 0) {
        setShowCreditAlert(true);
        return;
    }

    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl) {
        alert("Vui lòng nhấn 'Xem trước' trước khi copy.");
        return;
    }

    try {
      const blob = new Blob([previewEl.innerHTML], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ ["text/html"]: blob })]);
      alert('Đã sao chép định dạng!');
    } catch (err) {
      console.error('Copy failed: ', err);
      alert('Lỗi sao chép.');
    }
  }, [credits]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setContent(text);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const handleClear = useCallback(() => {
    if(window.confirm('Xóa toàn bộ nội dung?')) {
        setContent('');
        setPreviewContent('');
    }
  }, []);

  // --- RENDER CONDITIONALS ---

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Permission Error Screen
  if (configError === 'permission-denied') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <ShieldCheck className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Cấu hình bảo mật chưa hoàn tất</h1>
              <p className="text-slate-500">Ứng dụng bị chặn truy cập Database</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-2">Cách khắc phục:</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>Vào <a href="https://console.firebase.google.com/" target="_blank" className="text-indigo-600 hover:underline">Firebase Console</a> &gt; Firestore Database &gt; Rules</li>
                <li>Copy đoạn mã bên dưới và dán đè lên nội dung cũ.</li>
                <li>Nhấn <strong>Publish</strong>.</li>
              </ol>
            </div>
            <div className="relative">
                <Button 
                  variant="secondary" 
                  onClick={copyRulesToClipboard}
                  className="absolute top-2 right-2 !py-1 !px-2 text-xs"
                >
                  {copiedRules ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /registration_logs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                </pre>
            </div>
            <div className="text-center pt-4">
              <Button onClick={() => window.location.reload()} variant="primary">Đã cập nhật xong, Tải lại trang</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login/Register Screen
  if (!user) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-500">
          <div className="bg-indigo-600 p-8 text-center">
            <Bot className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">LLM Markdown Viewer</h1>
            <p className="text-indigo-100">{isRegistering ? 'Đăng ký tài khoản mới' : 'Đăng nhập để bắt đầu'}</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="email@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" required minLength={6} />
                </div>
              </div>
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">Ghi nhớ đăng nhập</label>
              </div>
              <Button type="submit" disabled={isLoginLoading} className="w-full justify-center bg-slate-900 hover:bg-slate-800 mt-2">
                {isLoginLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isRegistering ? 'Đăng ký' : 'Đăng nhập')}
              </Button>
            </form>
            <div className="text-center">
              <button type="button" onClick={() => { setIsRegistering(!isRegistering); setConfigError(null); }} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP INTERFACE
  return (
    <div className={`flex flex-col h-screen bg-white text-slate-900 font-sans ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* HEADER */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm z-20 no-print">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-200">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent hidden sm:block">LLM Viewer</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm font-medium ${credits && credits > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
             {isDeducting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className={`w-4 h-4 ${credits && credits > 0 ? 'fill-yellow-500 text-yellow-600' : 'fill-red-500 text-red-600'}`} />}
             <span>{credits ?? '...'} Credits</span>
           </div>
           
           <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
           
           {/* USER PROFILE DROPDOWN */}
           <div className="relative">
             <button 
               onClick={() => setShowProfileMenu(!showProfileMenu)}
               className="flex items-center gap-2 focus:outline-none group p-1 rounded-full hover:bg-slate-100 transition-colors"
               title="Thông tin tài khoản"
             >
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-200 shadow-sm" />
               ) : (
                 <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                   {user?.email?.[0].toUpperCase()}
                 </div>
               )}
               <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
             </button>

             {/* BACKDROP FOR CLOSING */}
             {showProfileMenu && (
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setShowProfileMenu(false)}
                ></div>
             )}

             {/* DROPDOWN MENU */}
             {showProfileMenu && (
               <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                  <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-50">
                    <div className="flex items-center gap-3 mb-3">
                       {user?.photoURL ? (
                         <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                       ) : (
                         <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                           {user?.email?.[0].toUpperCase()}
                         </div>
                       )}
                       <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-slate-900 truncate text-lg">{user?.displayName || 'Người dùng'}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500 bg-white/50 inline-flex px-2 py-0.5 rounded-full border border-indigo-100 mt-1">
                             <span className="font-semibold text-indigo-600">ID:</span> 
                             <span className="truncate max-w-[100px]">{user?.uid}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="group relative">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Mail className="w-3 h-3" /> Email đăng nhập
                      </label>
                      <div className="text-sm text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-100 break-all select-all">
                        {user?.email}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <KeyRound className="w-3 h-3" /> Mật khẩu
                      </label>
                      <div className="text-sm text-slate-700 font-medium font-mono bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                        <span>{password || '••••••••'}</span>
                        {!password && <span className="text-[10px] text-slate-400 italic px-2">Đã ẩn (Tải lại trang)</span>}
                      </div>
                      {!password && (
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                          * Mật khẩu chỉ hiển thị ngay sau khi đăng nhập. Nếu tải lại trang, nó sẽ bị ẩn để bảo mật.
                        </p>
                      )}
                    </div>

                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3" /> Số dư Credits
                       </label>
                       <div className={`text-sm font-bold p-2 rounded border ${credits && credits > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                         {credits ?? 0} lượt sử dụng
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all border border-transparent hover:border-red-100"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
                    </button>
                  </div>
               </div>
             )}
           </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 relative">
          
          {/* TOOLBAR */}
          <Toolbar 
             onInsert={insertTextAtCursor}
             onVoiceInput={handleVoiceInput}
             isListening={isListening}
             onOpenDrawing={() => setIsDrawingModalOpen(true)}
             onFileUpload={handleFileUpload}
             fileInputRef={fileInputRef}
             onManualPreview={handleManualPreview}
             onAIEnhance={handleAIEnhance}
             isAiProcessing={isAiProcessing}
             isDeducting={isDeducting}
             onCopyFormatted={handleCopyFormatted}
             onPrint={handlePrint}
             onExportWord={handleExportWord}
             onClear={handleClear}
          />

          <div className="flex-1 flex overflow-hidden">
            {/* Editor Pane */}
            <div 
              className={`${activeTab === 'editor' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/2 border-r border-slate-200 bg-slate-50 relative group`}
              onContextMenu={handleContextMenu}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-6 resize-none focus:outline-none bg-transparent font-mono text-sm leading-relaxed text-slate-700 custom-scrollbar"
                placeholder="Nhập nội dung vào đây..."
              />
              {/* Stats Bar */}
              <div className="flex-none h-8 bg-white border-t border-slate-200 flex items-center px-4 text-xs text-slate-500 gap-4 no-print z-10">
                 <div className="flex items-center gap-1.5"><FileText className="w-3 h-3" /><span>{wordCount} từ</span></div>
                 <div className="w-px h-3 bg-slate-300"></div>
                 <div>{charCount} ký tự</div>
                 <div className="flex-1"></div>
                 {isListening && <div className="text-red-500 animate-pulse font-medium flex items-center gap-1"><Mic className="w-3 h-3"/> Đang nghe...</div>}
              </div>
            </div>

            {/* Preview Pane */}
            <div 
              className={`${activeTab === 'preview' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/2 bg-white overflow-hidden relative`}
              onContextMenu={handleContextMenu}
            >
              {previewContent ? (
                  <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${credits !== null && credits <= 0 ? 'select-none' : ''}`} id="markdown-preview-scroll">
                     <div className="max-w-3xl mx-auto">
                        <MarkdownPreview content={previewContent} />
                     </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 no-print select-none">
                      <RefreshCw className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-center text-sm mb-2">Nhập nội dung bên trái</p>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Ctrl + Enter</span>
                        <span className="text-xs self-center">để xem trước</span>
                      </div>
                  </div>
              )}
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-4 flex-none z-10 no-print">
             <button onClick={() => setActiveTab('editor')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'editor' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>Mã nguồn</button>
             <div className="w-px h-6 bg-slate-200 mx-2"></div>
             <button onClick={() => setActiveTab('preview')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'preview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>Xem trước</button>
          </div>
      </div>
      
      {/* Footer Info */}
      <footer className="h-8 bg-slate-50 border-t border-slate-200 flex items-center justify-center text-xs text-slate-500 gap-4 flex-none no-print">
          <div className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-indigo-500" /><span>Thiết kế: Duy Hạnh</span></div>
          <div className="w-px h-3 bg-slate-300"></div>
          <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-indigo-500" /><span>0868 640 898</span></div>
      </footer>

      {/* DRAWING MODAL */}
      <DrawingModal 
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        onSubmit={handleDrawingSubmit}
        isProcessing={isAiProcessing}
      />

      {/* CREDIT ALERT POPUP */}
      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden relative border border-red-100">
             <button 
                onClick={() => setShowCreditAlert(false)} 
                className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
             
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Hết lượt sử dụng</h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                  Tài khoản của bạn đã hết Credits. Bạn vẫn có thể sử dụng các tính năng chỉnh sửa, nhưng <b>không thể Sao chép hoặc Xuất file</b>.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg mb-6 text-left border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">Liên hệ nạp thêm</div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-800">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Admin: Duy Hạnh</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <span>0868 640 898</span>
                  </div>
                </div>
                <Button onClick={() => setShowCreditAlert(false)} variant="primary" className="w-full justify-center">
                  Đã hiểu
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
