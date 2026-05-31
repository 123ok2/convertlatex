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
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  Timestamp,
  collection,
  getCountFromServer
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
  Mail,
  BarChart,
  Calendar,
  TrendingUp,
  Users,
  RefreshCw,
  Eye,
  EyeOff
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

  // Đôi khi có thêm dấu ngoặc kép bọc quanh
  p = p.replace(/"\$\$(.*?)\$\$"/g, '$$$$$1$$$$');
  p = p.replace(/"\$(.*?)\$"/g, '$$$1$$');

  // Đôi khi AI trả về markdown có dạng ```latex ... ```
  p = p.replace(/```latex\n([\s\S]*?)\n```/g, '$$$$\n$1\n$$$$');
  p = p.replace(/```math\n([\s\S]*?)\n```/g, '$$$$\n$1\n$$$$');

  // Sửa lỗi công thức dính vào nhau hoặc thiếu line break:
  p = p.replace(/(^|[^\$])(\裝[^\$]+\裝)(?=\$)/g, '$1$2\n\n');

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

  // 2.5 Escape các ký tự % thô để LaTeX hiểu
  p = p.replace(/([^\\]|^)%/g, '$1\\%');

  // 3. Xử lý vi phân (dx, dy, dt) khi nó đứng độc lập
  p = p.replace(/(^|\s)(\d*[a-zA-Z]?)dx(\s|$)/g, '$1$2 \\,dx$3')
       .replace(/(^|\s)(\d*[a-zA-Z]?)dy(\s|$)/g, '$1$2 \\,dy$3')
       .replace(/(^|\s)(\d*[a-zA-Z]?)dt(\s|$)/g, '$1$2 \\,dt$3');

  // 4. Xử lý căn bậc hai dạng √x hoặc √(x+y)
  p = p.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
       .replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');
       
  // 5. Xử lý các biến có chỉ số dưới viết liền (mdd -> m_{dd}, mct -> m_{ct})
  p = p.replace(/\b(m|n|V|C)(dd|ct|H2|O2|CO2|H2O|HCl|NaOH|H2SO4)\b/g, '$1_{$2}');
  
  // Đặc trị pattern C% = mct/mdd * 100%
  p = p.replace(/C\\%\s?=\s?(mct|m_{ct})\s?(mdd|m_{dd})\s?(\\times|\*|×)\s?100\\\%/g, "C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%");
  p = p.replace(/C\\%\s?=\s?(mdd|m_{dd})\s?(mct|m_{ct})\s?(\\times|\*|×)\s?100\\\%/g, "C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%");
  
  p = p.replace(/\b(n|V|m)([A-Z][a-z]?\d?)\b/g, '$1_{$2}');

  const handleFractions = (line: string) => {
    if (!line.includes('/') || line.includes('http')) return line;
    return line.replace(/([a-zA-Z0-9_{}\(\)\%]+)\s?\/\s?([a-zA-Z0-9_{}\(\)\%]+)/g, "\\frac{$1}{$2}");
  };

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

    if (trimmed && !trimmed.includes('$')) {
        currentLine = handleFractions(currentLine);
    }

    if (!trimmed || currentLine.includes('$')) return currentLine;
    
    const mathMatch = currentLine.match(/\\int|\\sqrt|\\frac|\\sin|\\cos|\\tan|\\lim|\\sum|\\Delta|\\alpha|\\beta|\\gamma|\\theta|\^|_|\\times|\\div|\\leq|\\geq|\\neq/g);
    const normalWordsMatch = trimmed.match(/[a-zA-Z]{4,}/g);
    const normalWordsCount = normalWordsMatch ? normalWordsMatch.length : 0;
    
    if ((mathMatch && mathMatch.length >= 1 && normalWordsCount <= 3) || 
        (currentLine.includes('=') && mathMatch)) {
      return `$$ ${currentLine.trim()} $$`;
    }
    
    if (/^[a-zA-Z0-9\+\-\=\^\_\(\)\s\%\/\\\{\}]+$/.test(trimmed) && trimmed.includes('=') && 
       (trimmed.includes('^') || trimmed.includes('_') || trimmed.includes('/') || trimmed.includes('\\'))) {
      return `$$ ${currentLine.trim()} $$`;
    }

    return currentLine;
  });

  return formattedLines.join('\n');
};

let visitLogged = false;

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [showConfigError, setShowConfigError] = useState(false);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<string | null>(null);
  
  const [content, setContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewMode, setPreviewMode] = useState<'web' | 'word'>('web');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  const [stats, setStats] = useState<any>({
    daily: {},
    monthly: {},
    yearly: {},
    total: 0
  });
  const [registeredAccountsCount, setRegisteredAccountsCount] = useState<number | null>(null);
  const [anonymousAccountsCount, setAnonymousAccountsCount] = useState<number | null>(null);

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

  useEffect(() => {
    if (!visitLogged) {
      visitLogged = true;
      logVisit();
    }
    const intervalId = setInterval(() => {
      loadStats().catch(err => console.warn("Periodic stats load failed:", err));
      loadAccountCounts().catch(err => console.warn("Periodic account counts load failed:", err));
    }, 15000);
    return () => {
      clearInterval(intervalId);
    };
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
        let isNewDevice = false;
        if (!deviceSnap.exists()) {
          isNewDevice = true;
          initialCredits = isGuest ? 10 : 20;
          await setDoc(deviceRef, {
            firstUserId: id,
            claimedAt: Timestamp.now(),
            type: isGuest ? 'guest' : 'member',
            "tuyên bố tại": Timestamp.now(),
            "loại": isGuest ? 'khách' : 'thành viên'
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

        const accountsStatsRef = doc(db, 'statistics', 'accounts');
        const updateFields: any = {};
        if (isGuest) {
          updateFields.guestsCount = increment(1);
          updateFields["🕵️ Người dùng ẩn danh"] = increment(1);
        } else {
          updateFields.usersCount = increment(1);
          updateFields["👤 Tài khoản thành viên"] = increment(1);
        }
        if (isNewDevice) {
          updateFields.devicesCount = increment(1);
        }
        try {
          await setDoc(accountsStatsRef, updateFields, { merge: true });
        } catch (err) {
          console.warn("Could not increment statistics counters:", err);
        }

        setCredits(initialCredits);
        await loadAccountCounts();
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') setShowPermissionError(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsRef = doc(db, 'statistics', 'visits');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          daily: data.daily || {},
          monthly: data.monthly || {},
          yearly: data.yearly || {},
          total: data.total || 0
        });
        localStorage.setItem('local_visits_stats', JSON.stringify(data));
        return;
      }
    } catch (err) {
      console.warn("Could not load stats from Firestore:", err);
    }

    const localData = localStorage.getItem('local_visits_stats');
    if (localData) {
      try {
        setStats(JSON.parse(localData));
      } catch (e) {}
    } else {
      const initialStats = { daily: {}, monthly: {}, yearly: {}, total: 0 };
      setStats(initialStats);
      localStorage.setItem('local_visits_stats', JSON.stringify(initialStats));
    }
  };

  const logVisit = async () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);
    const yearStr = now.getFullYear().toString();

    const statsRef = doc(db, 'statistics', 'visits');

    try {
      await setDoc(statsRef, {
        daily: { [todayStr]: increment(1) },
        monthly: { [monthStr]: increment(1) },
        yearly: { [yearStr]: increment(1) },
        total: increment(1)
      }, { merge: true });
    } catch (err) {
      console.warn("Could not log visit, using local fallback:", err);
      const localData = localStorage.getItem('local_visits_stats');
      let currentStats = { daily: {} as any, monthly: {} as any, yearly: {} as any, total: 0 };
      if (localData) {
        try { currentStats = JSON.parse(localData); } catch (e) {}
      }

      currentStats.daily[todayStr] = (currentStats.daily[todayStr] || 0) + 1;
      currentStats.monthly[monthStr] = (currentStats.monthly[monthStr] || 0) + 1;
      currentStats.yearly[yearStr] = (currentStats.yearly[yearStr] || 0) + 1;
      currentStats.total = (currentStats.total || 0) + 1;

      localStorage.setItem('local_visits_stats', JSON.stringify(currentStats));
    }
    await loadStats();
    await loadAccountCounts();
  };

  const loadAccountCounts = async () => {
    try {
      const accountsStatsRef = doc(db, 'statistics', 'accounts');
      const statsSnap = await getDoc(accountsStatsRef);
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        const usersCount = data.usersCount ?? 0;
        const guestsCount = data.guestsCount ?? 0;
        
        setRegisteredAccountsCount(usersCount);
        setAnonymousAccountsCount(guestsCount);
        
        localStorage.setItem('local_users_count', usersCount.toString());
        localStorage.setItem('local_guests_count', guestsCount.toString());
      }
    } catch (e: any) {
      console.warn("Could not load account stats summary, trying cache:", e);
      const cachedUsers = localStorage.getItem('local_users_count');
      const cachedGuests = localStorage.getItem('local_guests_count');
      if (cachedUsers) setRegisteredAccountsCount(parseInt(cachedUsers));
      if (cachedGuests) setAnonymousAccountsCount(parseInt(cachedGuests));
    }

    try {
      const isAdminUser = auth.currentUser && (auth.currentUser.email === "duyconghanh2017@gmail.com" || auth.currentUser.email === "rongtiendatto@gmail.com");
      if (!isAdminUser) {
        return;
      }

      const usersColEng = collection(db, 'users');
      const usersColVie = collection(db, 'người dùng');
      const guestsColEng = collection(db, 'guests');
      const guestsColVie = collection(db, 'khách');

      const [
        usersSnapEng,
        usersSnapVie,
        guestsSnapEng,
        guestsSnapVie
      ] = await Promise.all([
        getCountFromServer(usersColEng).catch(() => null),
        getCountFromServer(usersColVie).catch(() => null),
        getCountFromServer(guestsColEng).catch(() => null),
        getCountFromServer(guestsColVie).catch(() => null)
      ]);

      if (usersSnapEng !== null && usersSnapVie !== null && guestsSnapEng !== null && guestsSnapVie !== null) {
        const countUsersEng = usersSnapEng ? usersSnapEng.data().count : 0;
        const countUsersVie = usersSnapVie ? usersSnapVie.data().count : 0;
        const countGuestsEng = guestsSnapEng ? guestsSnapEng.data().count : 0;
        const countGuestsVie = guestsSnapVie ? guestsSnapVie.data().count : 0;

        const totalUsers = countUsersEng + countUsersVie;
        const totalGuests = countGuestsEng + countGuestsVie;

        setRegisteredAccountsCount(totalUsers);
        setAnonymousAccountsCount(totalGuests);
        localStorage.setItem('local_users_count', totalUsers.toString());
        localStorage.setItem('local_guests_count', totalGuests.toString());

        const todayStr = new Date().toISOString().slice(0, 10);
        let currToday = stats?.daily?.[todayStr] || 0;
        let currTotal = stats?.total || 0;

        try {
          const statsRef = doc(db, 'statistics', 'visits');
          const visitsSnap = await getDoc(statsRef);
          if (visitsSnap.exists()) {
            const vData = visitsSnap.data();
            currTotal = vData.total ?? 0;
            currToday = vData.daily?.[todayStr] ?? 0;
          }
        } catch (err) {}

        const accountsStatsRef = doc(db, 'statistics', 'accounts');
        await setDoc(accountsStatsRef, {
          usersCount: totalUsers,
          guestsCount: totalGuests,
          todayVisits: currToday,
          totalVisits: currTotal + 100000,
          "📅 Truy cập hôm nay": currToday,
          "🌍 Tổng truy cập tất cả": currTotal + 100000,
          "👤 Tài khoản thành viên": totalUsers + 10000,
          "🕵️ Người dùng ẩn danh": totalGuests,
          lastRebuiltAt: Timestamp.now()
        }, { merge: true });
      }
    } catch (e: any) {
      console.warn("Could not background-recount aggregate statistics:", e);
    }
  };

  const rebuildStatistics = async () => {
    try {
      setToast({ message: "Bắt đầu quét dữ liệu các bộ sưu tập...", type: 'info' });
      
      const usersColEng = collection(db, 'users');
      const usersColVie = collection(db, 'người dùng');
      const guestsColEng = collection(db, 'guests');
      const guestsColVie = collection(db, 'khách');
      const devicesColEng = collection(db, 'devices');
      const devicesColVie = collection(db, 'thiết bị');

      const [
        usersSnapEng,
        usersSnapVie,
        guestsSnapEng,
        guestsSnapVie,
        devicesSnapEng,
        devicesSnapVie
      ] = await Promise.all([
        getCountFromServer(usersColEng).catch(() => null),
        getCountFromServer(usersColVie).catch(() => null),
        getCountFromServer(guestsColEng).catch(() => null),
        getCountFromServer(guestsColVie).catch(() => null),
        getCountFromServer(devicesColEng).catch(() => null),
        getCountFromServer(devicesColVie).catch(() => null),
      ]);

      const countUsers = (usersSnapEng?.data().count ?? 0) + (usersSnapVie?.data().count ?? 0);
      const countGuests = (guestsSnapEng?.data().count ?? 0) + (guestsSnapVie?.data().count ?? 0);
      const countDevices = (devicesSnapEng?.data().count ?? 0) + (devicesSnapVie?.data().count ?? 0);

      const todayStr = new Date().toISOString().slice(0, 10);
      let rebuildToday = stats?.daily?.[todayStr] || 0;
      let rebuildTotal = stats?.total || 0;

      try {
        const statsRef = doc(db, 'statistics', 'visits');
        const visitsSnap = await getDoc(statsRef);
        if (visitsSnap.exists()) {
          const vData = visitsSnap.data();
          rebuildTotal = vData.total ?? 0;
          rebuildToday = vData.daily?.[todayStr] ?? 0;
        }
      } catch (err) {}

      const accountsStatsRef = doc(db, 'statistics', 'accounts');
      await setDoc(accountsStatsRef, {
        usersCount: countUsers,
        guestsCount: countGuests,
        devicesCount: countDevices,
        todayVisits: rebuildToday,
        totalVisits: rebuildTotal + 100000,
        "📅 Truy cập hôm nay": rebuildToday,
        "🌍 Tổng truy cập tất cả": rebuildTotal + 100000,
        "👤 Tài khoản thành viên": countUsers + 10000,
        "🕵️ Người dùng ẩn danh": countGuests,
        lastRebuildAt: Timestamp.now()
      }, { merge: true });

      setRegisteredAccountsCount(countUsers);
      setAnonymousAccountsCount(countGuests);
      localStorage.setItem('local_users_count', countUsers.toString());
      localStorage.setItem('local_guests_count', countGuests.toString());
      setToast({ message: `Đồng bộ thành công! Sĩ số: ${countUsers} thành viên, ${countGuests} khách, ${countDevices} thiết bị.`, type: 'success' });
    } catch (e) {
      setToast({ message: "Lỗi đồng bộ dữ liệu statistics", type: 'error' });
    }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (credits !== null && credits <= 0) {
      setShowCreditAlert(true);
      return false;
    }
    if (!user) return false;
    setIsDeducting(true);
    try {
      const collectionName = user.isGuest ? "guests" : "users";
      const userRef = doc(db, collectionName, user.uid);
      await updateDoc(userRef, {
        credits: increment(-1)
      });
      setCredits(prev => (prev !== null ? prev - 1 : 0));
      return true;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setShowConfigError(true);
      } else {
        setToast({ message: "Lỗi trừ lượt sử dụng: " + error.message, type: 'error' });
      }
      return false;
    } finally {
      setIsDeducting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoginLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      setToast({ message: "Đăng nhập Google thành công!", type: 'success' });
    } catch (error: any) {
      let errorMsg = String(error);
      if (error.code === 'auth/popup-blocked') {
        errorMsg = "Trình duyệt đã chặn cửa sổ Popup Google. Vui lòng cho phép cửa sổ bật lên (popup) trên trình duyệt hoặc nhấn nút ở góc trên để mở ứng dụng trong Tab mới.";
      } else if (error.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomainError(window.location.hostname);
        errorMsg = `Tên miền hiện tại (${window.location.hostname}) chưa được thêm vào mục 'Authorized domains' trong cài đặt Firebase Authentication! Vui lòng copy tên miền này thêm vào cài đặt Firebase của bạn.`;
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = "Đăng nhập Google chưa được kích hoạt trong Firebase Console. Vui lòng truy cập Authentication -> Sign-in method để bật Google Sign-In.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = "Cửa sổ đăng nhập Google đã bị đóng bởi người dùng.";
      } else {
        errorMsg = "Lỗi đăng nhập Google: " + errorMsg;
      }
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    setIsLoginLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, cleanEmail, password);
        setToast({ message: "Đăng ký tài khoản thành công!", type: 'success' });
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setToast({ message: "Đăng nhập thành công!", type: 'success' });
      }
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "Email này đã được đăng ký sử dụng tài khoản khác!";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') msg = "Email hoặc Mật khẩu không chính xác!";
      if (error.code === 'auth/weak-password') msg = "Mật khẩu yếu! Yêu cầu ít nhất 6 ký tự.";
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoginLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInAnonymously(auth);
      setToast({ message: "Đăng nhập ẩn danh thành công!", type: 'success' });
    } catch (error: any) {
      setToast({ message: "Lỗi đăng nhập ẩn danh: " + error.message, type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToast({ message: "Đã đăng xuất tài khoản thành công!", type: 'success' });
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
      const formatted = autoFormatMath(text);
      setContent(formatted);
      setPreviewContent(formatted);
      setToast({ message: "📁 Đã tải tệp lên thành công!", type: 'success' });
    };
    reader.readAsText(file);
  };

  const insertTextAtCursor = useCallback((textBefore: string, textAfter: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;
    const newContent = previousContent.substring(0, start) + textBefore + previousContent.substring(start, end) + textAfter + previousContent.substring(end);
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
      insertTextAtCursor(`\n$$ ${latex.trim()} $$\n`);
      setIsDrawingModalOpen(false);
      setToast({ message: "✨ Đã chèn công thức", type: 'success' });
    } else {
      setIsAiProcessing(true);
      try {
        if (await deductCredit()) {
          const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const base64Data = data.split(',')[1];
          const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
          const textPart = { text: "Convert this handwritten math/physics/chemistry formula to LaTeX. Return ONLY the LaTeX string without any markdown formatting or dollar signs." };
          const result = await genAI.models.generateContent({ model: "gemini-3.5-flash", contents: { parts: [imagePart, textPart] } });
          const text = result.text;
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
      <div className="max-w-[360px] w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/50">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <Bot className="mx-auto mb-2" size={36} />
          <h2 className="text-xl font-extrabold tracking-tight">Markdown Pro</h2>
          <p className="text-indigo-100 text-xs mt-1 font-medium">Hệ thống biên soạn tài liệu toán học thông minh</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={14} />
                </span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder={isRegistering ? "Nhập Email đăng ký" : "Email"} required />
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={14} />
              </span>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder="Mật khẩu" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors" title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"} >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button type="submit" disabled={isLoginLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5 font-bold text-xs rounded-lg text-white">
              {isLoginLoading ? "Đang xử lý..." : (isRegistering ? "Đăng ký" : "Đăng nhập")}
            </Button>
            
            <div className="relative flex py-1 items-center">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="mx-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hoặc</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={isLoginLoading} className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs" >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01.6 12 .6 7.37.6 3.42 3.26 1.5 7.16l3.77 2.92C6.16 6.81 8.85 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.39-4.89 3.39-8.55z"/>
                <path fill="#FBBC05" d="M5.27 14.12c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.62C.54 8.54 0 10.71 0 13s.54 4.46 1.5 6.38l3.77-2.92z"/>
                <path fill="#34A853" d="M12 23.4c3.24 0 5.97-1.08 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.15 0-5.84-1.77-6.79-4.38L1.44 17.27c1.92 3.9 5.87 6.13 10.56 6.13z"/>
              </svg>
              Đăng nhập bằng Google
            </button>

            {unauthorizedDomainError && (
              <div className="mt-2.5 p-3 bg-red-50/65 border border-red-200/50 rounded-lg text-left text-[11px] text-red-800 space-y-1">
                <p className="font-bold">Lỗi Authorized Domain!</p>
                <p className="text-slate-600 font-medium">Tên miền {unauthorizedDomainError} cần được thêm vào Firebase -> Authentication -> Settings.</p>
                <div className="pt-1.5 flex gap-2">
                  <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center font-bold px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors" >⚙️ Firebase Console →</a>
                  <button type="button" onClick={() => setUnauthorizedDomainError(null)} className="inline-flex items-center justify-center font-semibold px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors" >Đóng</button>
                </div>
              </div>
            )}
          </form>
          <div className="mt-5 flex flex-col items-center gap-3">
            <button onClick={() => { setIsRegistering(!isRegistering); setEmail(''); setPassword(''); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
              {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Dùng thử nhanh</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <button onClick={handleGuestLogin} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 group cursor-pointer">
              <Monitor size={12} className="group-hover:scale-110 transition-transform text-slate-400 group-hover:text-indigo-500" /> Vào nhanh bằng ID Thiết bị (10 Credit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border ${ toast.type === 'error' ? 'bg-white border-red-200 text-red-600' : 'bg-white border-indigo-100 text-indigo-700' }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-indigo-50'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : (toast.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />)}
            </div>
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 w-full px-8 flex items-center justify-between z-40 no-print flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 leading-tight">Markdown Pro</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.isGuest ? 'bg-orange-400' : 'bg-green-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"> {user.isGuest ? 'Phiên dùng thử' : 'Thành viên'} </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-5 border-r border-slate-200 pr-6 text-xs font-bold font-sans tracking-tight select-none">
            <div className="flex flex-col text-right">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] mb-0.5">Tổng lượt truy cập</span>
              <span className="text-sky-600 font-extrabold flex items-center justify-end gap-1 text-[13px]">
                <span>🌍</span> {((stats.total || 0) + 100000).toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="flex flex-col text-right">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] mb-0.5">Tài khoản đăng ký</span>
              <span className="text-indigo-600 font-extrabold flex items-center justify-end gap-1 text-[13px]">
                <span>👤</span> {registeredAccountsCount !== null ? (registeredAccountsCount + 10000).toLocaleString('vi-VN') : "..."}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="flex flex-col text-right">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] mb-0.5">Khách trải nghiệm</span>
              <span className="text-amber-600 font-extrabold flex items-center justify-end gap-1 text-[13px]">
                <span>🕵️</span> {anonymousAccountsCount !== null ? anonymousAccountsCount.toLocaleString('vi-VN') : "..."}
              </span>
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-2 bg-slate-100/60 border border-slate-200/50 rounded-xl px-2.5 py-1.5 shadow-3xs text-[10px] select-none font-sans font-semibold">
            <span className="text-[#0ea5e9] flex items-center gap-1"> <span>🌍</span> {((stats.total || 0) + 100000).toLocaleString('vi-VN')} </span>
            <span className="text-slate-300">|</span> 
            <span className="text-indigo-600 flex items-center gap-1"> <span>👤</span> {registeredAccountsCount !== null ? (registeredAccountsCount + 10000).toLocaleString('vi-VN') : "..."} </span>
            <span className="text-slate-300">|</span> 
            <span className="text-amber-600 flex items-center gap-1"> <span>🕵️</span> {anonymousAccountsCount !== null ? anonymousAccountsCount.toLocaleString('vi-VN') : "..."} </span>
          </div>

          <div className="flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100/30 text-amber-800 border border-amber-200 hover:border-amber-300 rounded-xl shadow-2xs transition-colors duration-200 select-none">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-xs">
              <Zap className="text-white" size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">Số lượt của bạn</span>
              <span className="font-black text-sm text-slate-800 -mt-0.5">{credits !== null ? `${credits} Credit` : "..."}</span>
            </div>
          </div>

          {(user?.email === "duyconghanh2017@gmail.com" || user?.email === "rongtiendatto@gmail.com") && (
            <button onClick={rebuildStatistics} title="Đồng bộ & Đếm lại toàn bộ thống kê hệ thống từ đầu" className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-3xs flex items-center justify-center" >
              <RefreshCw size={15} />
            </button>
          )}

          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }} className="flex items-center gap-1.5 p-1.5 hover:bg-slate-100 rounded-xl transition-colors duration-150 border border-transparent hover:border-slate-200/60" >
              <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <UserIcon size={16} />
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</p>
                  <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{user.displayEmail}</p>
                </div>
                <div className="p-1">
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
          if (!previewEl) return;
          try {
            if (await deductCredit()) {
              const clone = previewEl.cloneNode(true) as HTMLElement;
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
                  style.margin = '10pt 0';
                }
              });
              clone.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
              await navigator.clipboard.writeText(clone.innerHTML);
              setToast({ message: "📋 Đã sao chép định dạng tối ưu thành công!", type: 'success' });
            }
          } catch (e) {
            setToast({ message: "Lỗi sao chép định dạng", type: 'error' });
          }
        }}
        onPrint={() => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (previewEl) { window.print(); }
        }}
        onExportWord={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (!previewEl) return;
          try {
            if (await deductCredit()) {
              const clone = previewEl.cloneNode(true) as HTMLElement;
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
              clone.querySelectorAll('[class]').forEach(el => { el.removeAttribute('class'); });
              clone.querySelectorAll('table').forEach(el => { 
                (el as HTMLElement).style.borderCollapse = 'collapse'; 
                (el as HTMLElement).setAttribute('border', '1');
              });

              const fullHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                  <meta charset='utf-8'>
                  <style>
                    @page { size: 21cm 29.7cm; margin: 2cm 2cm 2cm 2cm; }
                    body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: black; }
                    table { border: 1px solid black; border-collapse: collapse; width: 100%; margin: 12pt 0; }
                    th { border: 1px solid black; padding: 6pt; background-color: #f3f4f6; font-weight: bold; text-align: center; }
                    td { border: 1px solid black; padding: 6pt; vertical-align: middle; }
                  </style>
                </head>
                <body>
                  ${clone.innerHTML}
                </body>
                </html>
              `;
              const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Document_${Date.now()}.doc`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              setToast({ message: "📁 Đã tải file Word thành công!", type: 'success' });
            }
          } catch (error: any) {
            setToast({ message: "Lỗi xuất Word: " + error.message, type: 'error' });
          }
        }}
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
          <div id="markdown-preview-content" className="flex-1 p-8 overflow-y-auto select-text">
            <MarkdownPreview content={previewContent} mode={previewMode} />
          </div>
        </div>
      </main>

      {/* Thanh điều hướng tab trên thiết bị di động */}
      <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around z-40 flex-shrink-0 no-print">
        <button onClick={() => setActiveTab('editor')} className={`flex flex-col items-center justify-center gap-1 font-bold text-xs w-1/2 h-full ${activeTab === 'editor' ? 'text-indigo-600 bg-indigo-50/40' : 'text-slate-400'}`}>
          <span>📝 Trình biên tập</span>
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex flex-col items-center justify-center gap-1 font-bold text-xs w-1/2 h-full ${activeTab === 'preview' ? 'text-indigo-600 bg-indigo-50/40' : 'text-slate-400'}`}>
          <span>👁️ Xem trước</span>
        </button>
      </div>

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={handleDrawingSubmit} isProcessing={isAiProcessing} />

      {showConfigError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white max-w-md w-full rounded-[32px] p-8 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-xs">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Lỗi cấu hình Security Rules</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6">
              Hệ thống không thể thực hiện giao dịch trừ lượt sử dụng (Credit). Vui lòng cập nhật lại chính xác các quy tắc bảo mật (Security Rules) của bạn trong Firebase Console để xử lý lỗi này.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toàn bộ Security Rules mới:</span>
                <button type="button" onClick={() => {
                  navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    function isAdmin() {\n      return request.auth != null && (request.auth.token.email == "duyconghanh2017@gmail.com" || request.auth.token.email == "rongtiendatto@gmail.com");\n    }\n    function isSignedIn() {\n      return request.auth != null;\n    }\n    match /statistics/{document=**} {\n      allow read, write: if true;\n    }\n    match /{collectionName}/{docId} {\n      allow read, write: if (collectionName == "users" || collectionName == "người dùng") && (isAdmin() || (isSignedIn() && request.auth.uid == docId));\n      allow list: if (collectionName == "users" || collectionName == "người dùng") && isAdmin();\n      allow read, write: if (collectionName == "guests" || collectionName == "khách") && (isAdmin() || isSignedIn());\n      allow list: if (collectionName == "guests" || collectionName == "khách") && isAdmin();\n      allow read, write: if (collectionName == "devices" || collectionName == "thiết bị") && true;\n    }\n  }\n}`);
                  setToast({ message: "📋 Đã sao chép Rules thành công!", type: 'success' });
                }} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Sao chép Rules</button>
              </div>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl text-[10px] font-mono overflow-y-auto max-h-40 leading-relaxed border border-slate-800">
                {`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /statistics/{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`}
              </div>
              <div className="pt-2 flex gap-3">
                <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-center font-bold text-sm transition-all shadow-md shadow-indigo-150 flex items-center justify-center gap-2" >⚙️ Vào trang Firebase Console ngay →</a>
                <Button type="button" variant="outline" onClick={() => setShowConfigError(false)} className="py-4 px-6 rounded-2xl text-slate-700 font-bold border-slate-200">Đóng</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPermissionError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white max-w-md w-full rounded-[32px] p-8 shadow-2xl text-center border border-slate-100">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-xs">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Từ chối truy cập quyền dữ liệu</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6">Bạn không có đủ thẩm quyền phân quyền hoặc cấu hình Cloud Firestore bị chặn bởi Rules.</p>
            <Button type="button" onClick={() => setShowPermissionError(false)} className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm">Đóng thông báo</Button>
          </div>
        </div>
      )}

      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white max-w-sm w-full rounded-[32px] p-10 text-center shadow-2xl">
            <AlertTriangle className="text-red-500 mx-auto mb-6" size={40} />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Hết lượt sử dụng</h3>
            <p className="text-slate-500 text-sm mb-8">Vui lòng liên hệ Admin để nạp thêm Credit. <br/><span className="font-bold text-slate-900">Zalo: 0868.666.xxx</span></p>
            <Button type="button" onClick={() => setShowCreditAlert(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-200">Đồng ý</Button>
          </div>
        </div>
      )}
    </div>
  );
}
