import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MarkdownPreview } from './components/MarkdownPreview';
import { Button } from './components/Button';
import { DrawingModal } from './components/DrawingModal';
import { Toolbar } from './components/Toolbar';
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
  EyeOff,
  Puzzle
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
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  
  const increaseZoom = () => {
    setPreviewZoom(prev => Math.min(prev + 10, 200));
  };

  const decreaseZoom = () => {
    setPreviewZoom(prev => Math.max(prev - 10, 50));
  };

  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [wordExportState, setWordExportState] = useState<'idle' | 'preparing' | 'packaging' | 'success'>('idle');

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
    // Tự động cập nhật số liệu công khai định kỳ mỗi 15 giây
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
            // Also write fields in Vietnamese for backward compatibility
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

        // Tự động cập nhật tài liệu thống kê tổng hợp tại statistics/accounts bằng atomic increment
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
        // Tự động load lại thống kê thực tế để hiển thị con số chính xác tức thì
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
      } catch (e) {
        // defaults if error
      }
    } else {
      const initialStats = {
        daily: {},
        monthly: {},
        yearly: {},
        total: 0
      };
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
    // 1. Thử lấy nhanh dữ liệu đã lưu từ 'statistics/accounts' để hiển thị tức thì trên UI
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

    // 2. Chạy đếm thực tế (recount) trực tiếp từ các collection để cập nhật số liệu chính xác tuyệt đối
    try {
      // 2. Chỉ chạy đếm thực tế (recount) trực tiếp nếu là Admin để tiết kiệm tài nguyên và bảo mật tuyệt đối, tránh bị ghi đè dữ liệu
      const isAdminUser = auth.currentUser && (auth.currentUser.email === "duyconghanh2017@gmail.com" || auth.currentUser.email === "rongtiendatto@gmail.com");
      if (!isAdminUser) {
        return; // Người dùng thường chỉ đọc dữ liệu tổng hợp ở bước 1, không tự đếm tránh bị rules chặn
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

      // Chỉ cập nhật đồng bộ nếu TẤT CẢ các truy vấn đếm trực tiếp thành công (tránh ghi đè khi bị ném lỗi null)
      if (usersSnapEng !== null && usersSnapVie !== null && guestsSnapEng !== null && guestsSnapVie !== null) {
        const countUsersEng = usersSnapEng ? usersSnapEng.data().count : 0;
        const countUsersVie = usersSnapVie ? usersSnapVie.data().count : 0;
        const countGuestsEng = guestsSnapEng ? guestsSnapEng.data().count : 0;
        const countGuestsVie = guestsSnapVie ? guestsSnapVie.data().count : 0;

        const totalUsers = countUsersEng + countUsersVie;
        const totalGuests = countGuestsEng + countGuestsVie;

        // Cập nhật state UI và cache ngay lập tức
        setRegisteredAccountsCount(totalUsers);
        setAnonymousAccountsCount(totalGuests);
        localStorage.setItem('local_users_count', totalUsers.toString());
        localStorage.setItem('local_guests_count', totalGuests.toString());

        // Lấy thông tin lượt truy cập hiện tại từ Firestore hoặc State để đồng bộ đầy đủ các trường
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
        } catch (err) {
          console.warn("Could not get visits doc for combined stats:", err);
        }

        // Đồng bộ dữ liệu thực tế vừa đếm được lên Firestore để làm dữ liệu chuẩn cho các lượt truy cập khác
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
        }, { merge: true }).catch(err => {
          console.warn("Could not write sync statistics back to firestore:", err);
        });
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

      // Lấy thông tin lượt truy cập mới nhất từ Firestore
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
      } catch (err) {
        console.warn("Could not get visits doc during rebuild:", err);
      }

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

      setToast({ message: `Đồng bộ thành công! Sĩ số: ${countUsers} thành viên, ${countGuests} khách, ${countDevices} thiết bị`, type: 'success' });
    } catch (e: any) {
      console.error("Rebuild stats error:", e);
      setToast({ message: "Lỗi đồng bộ: " + e.message, type: 'error' });
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
      console.error("Device login error:", error);
      if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
        setShowConfigError(true);
      } else {
        setToast({ message: "Lỗi đăng nhập thiết bị: " + error.message, type: 'error' });
      }
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setToast({ message: "Đăng nhập tài khoản Google thành công!", type: 'success' });
    } catch (error: any) {
      console.error("Google login error detail:", error);
      let errorMsg = error.message || String(error);
      
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
      }
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
          const base64Data = data.split(',')[1];
          
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              prompt: "Convert this handwritten math/physics/chemistry formula to LaTeX. Return ONLY the LaTeX string without any markdown formatting or dollar signs."
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned error: ${response.status}`);
          }

          const responseData = await response.json();
          const text = responseData.text;

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
        <div className="bg-slate-50/80 px-6 py-5 text-center border-b border-slate-100 relative">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Bot className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">LLM Markdown Pro</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            {isRegistering ? "Đăng ký tài khoản nhận ngay 20 Credits" : "Mỗi thiết bị nhận 20 Credits khi đăng ký"}
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={14} />
                </span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                  placeholder={isRegistering ? "Nhập Email đăng ký" : "Email"} 
                  required 
                />
              </div>
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={14} />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                placeholder="Mật khẩu" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <Button type="submit" disabled={isLoginLoading} className="w-full py-2 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs">
              {isLoginLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mx-auto" /> : (isRegistering ? 'Đăng ký tài khoản thủ công' : 'Đăng nhập')}
            </Button>

            <div className="flex items-center gap-2.5 py-1">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Hoặc</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin} 
              disabled={isLoginLoading}
              className="w-full py-2 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs text-[11px] font-bold text-slate-700 hover:text-slate-800 hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="font-extrabold text-[13px] select-none">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </span>
              <span>Đăng nhập qua Google</span>
            </button>

            {unauthorizedDomainError && (
              <div className="mt-2.5 p-3 bg-red-50/65 border border-red-200/50 rounded-lg text-left text-[11px] text-red-800 space-y-2 animate-in fade-in duration-300">
                <div className="font-bold flex items-center gap-1.5 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping"></span>
                  Lỗi: Tên miền chưa xác thực!
                </div>
                <p className="leading-relaxed opacity-90 text-[10px]">
                  Vui lòng thêm tên miền hiện tại vào danh sách Authorized domains trong cấu hình Authentication của Firebase Console.
                </p>
                <div className="bg-white p-1.5 border border-red-100 rounded-md flex items-center justify-between gap-1.5 shadow-3xs">
                  <code className="text-red-600 font-mono select-all font-semibold overflow-x-auto truncate text-[10px] block max-w-[180px]">{unauthorizedDomainError}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unauthorizedDomainError);
                      setToast({ message: "Đã sao chép tên miền!", type: 'success' });
                    }}
                    className="shrink-0 bg-slate-100 hover:bg-slate-200 text-[9px] font-extrabold px-2 py-1 rounded text-slate-700 active:scale-95 transition-all"
                  >
                    Sao chép
                  </button>
                </div>
                <div className="pt-0.5 flex gap-1.5 text-[9px]">
                  <a 
                    href="https://console.firebase.google.com/project/okoko-807c1/authentication/providers"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center font-bold px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-sm"
                  >
                    ⚙️ Firebase Console →
                  </a>
                  <button
                    type="button"
                    onClick={() => setUnauthorizedDomainError(null)}
                    className="inline-flex items-center justify-center font-semibold px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
                  >
                    Đóng
                  </button>
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
              <Monitor size={12} className="group-hover:scale-110 transition-transform text-slate-400 group-hover:text-indigo-500" /> 
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

      <header className="h-20 bg-slate-100/95 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-40 no-print flex-shrink-0">
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
          {/* Thống kê công khai và tự động cập nhật trực tiếp trên thanh công cụ */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/60 border border-slate-200/50 rounded-2xl p-1 shrink-0 select-none shadow-2xs font-sans">
            {/* Truy cập hôm nay */}
            <div className="flex items-center gap-2 py-1 px-2.5 bg-white rounded-xl border border-slate-200/40 shadow-3xs hover:bg-slate-50/50 transition-colors">
              <span className="text-sm select-none">📅</span>
              <div>
                <p className="text-[8px] font-extrabold text-slate-400 hover:text-indigo-500 uppercase tracking-widest leading-none">Hôm nay</p>
                <p className="font-extrabold text-slate-900 mt-1 leading-none text-[11px]">
                  {(stats.daily?.[new Date().toISOString().slice(0, 10)] || 0).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Tổng truy cập */}
            <div className="flex items-center gap-2 py-1 px-2.5 bg-white rounded-xl border border-slate-200/40 shadow-3xs hover:bg-slate-50/50 transition-colors">
              <span className="text-sm select-none">🌍</span>
              <div>
                <p className="text-[8px] font-extrabold text-slate-400 hover:text-emerald-500 uppercase tracking-widest leading-none">Tổng truy cập</p>
                <p className="font-extrabold text-sky-600 mt-1 leading-none text-[11px]">
                  {((stats.total || 0) + 100000).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Thành viên */}
            <div className="flex items-center gap-2 py-1 px-2.5 bg-white rounded-xl border border-slate-200/40 shadow-3xs hover:bg-slate-50/50 transition-colors">
              <span className="text-sm select-none">👤</span>
              <div>
                <p className="text-[8px] font-extrabold text-slate-400 hover:text-blue-500 uppercase tracking-widest leading-none">Thành viên</p>
                <p className="font-extrabold text-indigo-600 mt-1 leading-none text-[11px]">
                  {registeredAccountsCount !== null ? (registeredAccountsCount + 10000).toLocaleString('vi-VN') : "..."}
                </p>
              </div>
            </div>

            {/* Khách ẩn danh */}
            <div className="flex items-center gap-2 py-1 px-2.5 bg-white rounded-xl border border-slate-200/40 shadow-3xs hover:bg-slate-50/50 transition-colors">
              <span className="text-sm select-none">🕵️</span>
              <div>
                <p className="text-[8px] font-extrabold text-slate-400 hover:text-amber-500 uppercase tracking-widest leading-none">Khách</p>
                <p className="font-extrabold text-amber-600 mt-1 leading-none text-[11px]">
                  {anonymousAccountsCount !== null ? anonymousAccountsCount.toLocaleString('vi-VN') : "..."}
                </p>
              </div>
            </div>
          </div>

          {/* Thống kê rút gọn trên thiết bị di động */}
          <div className="flex lg:hidden items-center gap-2 bg-slate-100/60 border border-slate-200/50 rounded-xl px-2.5 py-1.5 shadow-3xs text-[10px] select-none font-sans font-semibold">
            <span className="text-[#0ea5e9] flex items-center gap-1">
              <span>🌍</span> {((stats.total || 0) + 100000).toLocaleString('vi-VN')}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 flex items-center gap-1">
              <span>👤</span> {registeredAccountsCount !== null ? (registeredAccountsCount + 10000).toLocaleString('vi-VN') : "..."}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 flex items-center gap-1">
              <span>🕵️</span> {anonymousAccountsCount !== null ? anonymousAccountsCount.toLocaleString('vi-VN') : "..."}
            </span>
          </div>

           <a 
             href="https://drive.google.com/file/d/1rrC39rto8-4erhY7NLSIzCQQdyK6adej/view?usp=drive_link"
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-violet-50 to-violet-100/30 text-violet-800 border border-violet-200 hover:border-violet-300 rounded-xl shadow-2xs transition-colors duration-200 select-none cursor-pointer group"
           >
             <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
                <Puzzle className="text-white group-hover:rotate-12 transition-transform duration-200" size={15} />
             </div>
             <div className="hidden sm:block text-left animate-pulse">
                <p className="text-xs font-black text-violet-950 mt-1 leading-none">Cài Extension</p>
             </div>
           </a>

           <div className="flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100/30 text-amber-800 border border-amber-200 hover:border-amber-300 rounded-xl shadow-2xs transition-colors duration-200 select-none">
             <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-xs">
                <Zap className="text-white" size={15} fill="white" />
             </div>
             <div>
                <p className="text-[8px] font-black text-amber-600 tracking-wider uppercase leading-none">Số dư</p>
                <p className="text-sm font-black text-amber-950 mt-1 leading-none">{credits ?? 0} Credits</p>
             </div>
           </div>

           <div className="relative" onClick={(e) => e.stopPropagation()}>
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 hover:bg-white transition-all shadow-3xs cursor-pointer">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs transition-all duration-200 ${user.isGuest ? 'bg-gradient-to-br from-orange-400 to-orange-500' : 'bg-gradient-to-br from-indigo-550 to-indigo-600'}`}>
                 {user.isGuest ? <Monitor size={16} /> : (user.email?.[0].toUpperCase() || 'U')}
               </div>
               <ChevronDown size={14} className={`text-slate-400 mr-1 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
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
          if (!previewEl) return;
          try {
             if (await deductCredit()) {
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

                // 3. Xóa các class Tailwind hiệu năng cao bằng cách chỉ nhắm mục tiêu phần tử có class
                clone.querySelectorAll('[class]').forEach(el => {
                    el.removeAttribute('class');
                });
                
                // Word ưu tiên thuộc tính style trực tiếp
                clone.querySelectorAll('table').forEach(el => {
                    const tableEl = el as HTMLElement;
                    tableEl.style.borderCollapse = 'collapse';
                    tableEl.style.width = '100%';
                    tableEl.style.border = '1px solid black';
                });
                
                clone.querySelectorAll('td, th').forEach(el => {
                    const cellEl = el as HTMLElement;
                    cellEl.style.border = '1px solid black';
                    cellEl.style.padding = '5pt';
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
                setToast({ message: "✅ Đã sao chép định dạng tối ưu cho Word!", type: 'success' });
             }
          } catch (err: any) {
             console.error('Clipboard error:', err);
             setToast({ message: "❌ Lỗi sao chép: Vui lòng tương tác với trang web trước khi nhấn Copy", type: 'error' });
          }
        }} 
        onExportWord={async () => {
          const previewEl = document.getElementById('markdown-preview-content');
          if (!previewEl) return;
          try {
             // 1. Chuyển trạng thái sang Đang định dạng
             setWordExportState('preparing');
             
             if (await deductCredit()) {
                // Tăng nhẹ thời gian chờ để người dùng cảm thấy có tiến trình xử lý thực sự
                await new Promise(resolve => setTimeout(resolve, 800));

                const clone = previewEl.cloneNode(true) as HTMLElement;
                
                // Dọn dẹp MathJax/KaTeX
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

                // Xóa Tailwind classes
                clone.querySelectorAll('[class]').forEach(el => {
                    el.removeAttribute('class');
                });
                clone.querySelectorAll('table').forEach(el => {
                    (el as HTMLElement).style.borderCollapse = 'collapse';
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

                // 2. Chuyển sang đóng gói dữ liệu
                setWordExportState('packaging');
                await new Promise(resolve => setTimeout(resolve, 900));

                const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `Document_${Date.now()}.doc`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cho trình duyệt thời gian đẩy tệp thực sự lên đĩa/hiển thị thanh công cụ tải xuống
                setTimeout(() => {
                   URL.revokeObjectURL(url);
                   setWordExportState('success');
                }, 1400);
             } else {
                setWordExportState('idle');
             }
          } catch (error) {
             console.error('Export Word error:', error);
             setWordExportState('idle');
             setToast({ message: "❌ Gặp lỗi trong quá trình kết xuất Word", type: 'error' });
          }
        }} 
        onClear={() => {
          setContent('');
          setPreviewContent('');
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
        <div className={`flex flex-col flex-1 bg-white overflow-hidden transition-all ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           {/* Thanh công cụ zoom xem trước */}
           <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200/60 no-print select-none shrink-0 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Xem trước tài liệu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={decreaseZoom}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-200/40 active:scale-90 transition-all font-bold text-xs border border-slate-200/80 bg-white shadow-xs cursor-pointer"
                  title="Giảm kích thước chữ/hình ảnh (A-)"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono font-bold text-indigo-600 px-2 min-w-[48px] text-center bg-indigo-50/50 py-1 rounded-lg border border-indigo-100/50">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={increaseZoom}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-200/40 active:scale-90 transition-all font-bold text-xs border border-slate-200/80 bg-white shadow-xs cursor-pointer"
                  title="Tăng kích thước chữ/hình ảnh (A+)"
                >
                  A+
                </button>
                
                <div className="w-[1px] h-3.5 bg-slate-200/80 mx-1"></div>
                
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 active:scale-95 transition-all text-center cursor-pointer uppercase tracking-wider border border-slate-200/40 bg-white"
                  title="Đưa về kích thước mặc định"
                >
                  Mặc định
                </button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div 
               style={{ '--preview-zoom': `${previewZoom}%` } as React.CSSProperties}
               className="preview-zoom-container flex-1 py-4 md:py-6 px-4 md:px-8 max-w-4xl mx-auto w-full"
             >
                <MarkdownPreview content={previewContent || content} previewMode="web" />
             </div>
           </div>
        </div>
      </main>

      {/* Thanh Chân Trang Bản Quyền & Liên Hệ */}
      <footer className="bg-slate-950 text-slate-300 text-[11px] px-8 py-2 flex items-center justify-between no-print z-50 select-none border-t border-slate-900 shrink-0">
        <style>{`
          @keyframes glow-author {
            0%, 100% {
              text-shadow: 0 0 4px rgba(99, 102, 241, 0.8), 0 0 12px rgba(99, 102, 241, 0.4);
              color: #ffffff;
            }
            50% {
              text-shadow: 0 0 1px rgba(99, 102, 241, 0.1);
              color: #cbd5e1;
            }
          }
          @keyframes glow-zalo {
            0%, 100% {
              box-shadow: 0 0 8px rgba(14, 165, 233, 0.4), inset 0 0 3px rgba(14, 165, 233, 0.2);
              border-color: rgba(56, 189, 248, 0.6);
              background-color: rgba(15, 23, 42, 0.85);
            }
            50% {
              box-shadow: 0 0 2px rgba(14, 165, 233, 0.1), inset 0 0 1px rgba(14, 165, 233, 0.05);
              border-color: rgba(56, 189, 248, 0.2);
              background-color: rgba(15, 23, 42, 0.4);
            }
          }
          .animate-glow-author {
            animation: glow-author 2.5s ease-in-out infinite;
          }
          .animate-glow-zalo {
            animation: glow-zalo 3s ease-in-out infinite;
          }
        `}</style>
        <div className="flex items-center gap-2 font-medium">
          <span className="text-indigo-400 animate-pulse">©</span>
          <span>Bản quyền thuộc về tác giả: <strong className="font-extrabold ml-1 tracking-wide animate-glow-author">Duy Hạnh</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-850">|</span>
          <a 
            href="https://zalo.me/0868640898" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 transition-all duration-300 text-[11px] border px-2.5 py-1 rounded-lg animate-glow-zalo hover:scale-[1.02] cursor-pointer"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400"></span>
            </span>
            <span>Zalo hỗ trợ: <strong className="text-sky-300 font-extrabold ml-0.5 tracking-wide">0868.640.898</strong></span>
          </a>
        </div>
      </footer>

      {wordExportState !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-305 select-none">
          {/* Backdrop bọc mờ */}
          <div 
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer transition-opacity" 
            onClick={() => {
              if (wordExportState === 'success') {
                setWordExportState('idle');
              }
            }}
          />
          
          {/* Card Popup */}
          <div className="relative bg-white max-w-[420px] w-full rounded-[30px] overflow-hidden shadow-2xl border border-slate-100 p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 z-10 transition-all">
            {/* Vùng phát sáng thẩm mỹ góc trên */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl -z-10 pointer-events-none transition-all duration-500 ${
              wordExportState === 'success' ? 'bg-gradient-to-b from-indigo-500/15 to-transparent' : 'bg-gradient-to-b from-sky-400/15 to-transparent'
            }`} />

            {/* Nút X Góc Trên Bên Phải (Chỉ xuất hiện khi hoàn thành thành công) */}
            {wordExportState === 'success' && (
              <button
                onClick={() => setWordExportState('idle')}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 p-2 rounded-full transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200/50"
                aria-label="Đóng"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            )}

            {/* Vòng quay / Biểu tượng trạng thái */}
            <div className="relative mb-6 mt-3">
              {wordExportState === 'preparing' && (
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 bg-indigo-50/50 rounded-full flex items-center justify-center border-2 border-dashed border-indigo-400 animate-spin">
                    <Loader2 size={24} className="text-indigo-600 animate-pulse" />
                  </div>
                </div>
              )}
              {wordExportState === 'packaging' && (
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-sky-500/15 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 bg-sky-50/50 rounded-full flex items-center justify-center border-2 border-dashed border-sky-405 animate-spin">
                    <Loader2 size={24} className="text-sky-600" />
                  </div>
                </div>
              )}
              {wordExportState === 'success' && (
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-500/20 shadow-inner">
                    <CheckCircle2 size={34} className="text-emerald-500 stroke-[2.2]" />
                  </div>
                </div>
              )}
            </div>

            {/* Tiêu đề Pop-up */}
            <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 tracking-tight">
              {wordExportState === 'preparing' && "Đang Định Dạng... 📝"}
              {wordExportState === 'packaging' && "Đang Kết Xuất... ⚡"}
              {wordExportState === 'success' && "Kết Xuất Thành Công! 🎉"}
            </h3>

            {/* Nội dung thông điệp ngắn gọn tạo cảm hứng */}
            <p className="text-slate-600 text-[13px] leading-relaxed mb-6 max-w-[340px] px-2 font-medium">
              {wordExportState === 'preparing' && "🚀 Đang thiết kế và định dạng file Word siêu chuẩn cho bạn..."}
              {wordExportState === 'packaging' && "⚡ Sắp xong rồi! Đang đóng gói dữ liệu chất lượng cao gửi tới bạn..."}
              {wordExportState === 'success' && "Tệp Word siêu chất lượng đã được định dạng chuẩn hóa hoàn hảo và đang trên đường tải xuống máy tính của bạn!"}
            </p>

            {/* Các bước kết xuất động (Visual Checklist) */}
            <div className="w-full space-y-2 px-3 pb-4 mb-6 border-b border-slate-100 text-left text-xs font-semibold">
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  wordExportState !== 'preparing' ? 'bg-emerald-50 text-emerald-500 border border-emerald-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse'
                }`}>
                  {wordExportState !== 'preparing' ? "✓" : "📝"}
                </span>
                <span className={wordExportState === 'preparing' ? 'text-indigo-600 font-bold' : 'text-slate-400 line-through'}>
                  1. Chuẩn hóa & thiết kế bố cục Word
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  wordExportState === 'success' ? 'bg-emerald-50 text-emerald-500 border border-emerald-200' : 
                  wordExportState === 'packaging' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-slate-50 text-slate-300 border border-slate-100'
                }`}>
                  {wordExportState === 'success' ? "✓" : "⚡"}
                </span>
                <span className={wordExportState === 'packaging' ? 'text-sky-600 font-bold' : wordExportState === 'success' ? 'text-slate-400 line-through' : 'text-slate-300 font-normal'}>
                  2. Đóng gói mã nguồn & tối ưu Math
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  wordExportState === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100'
                }`}>
                  📥
                </span>
                <span className={wordExportState === 'success' ? 'text-emerald-600 font-extrabold' : 'text-slate-300 font-normal'}>
                  3. Hoàn tất và truyền dữ liệu file Word
                </span>
              </div>
            </div>

            {/* Hướng dẫn tải xuống (Chỉ hiển thị khi đã thành công) */}
            {wordExportState === 'success' ? (
              <>
                <div className="w-full bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/40 text-left mb-6 flex gap-3.5 items-start">
                  <div className="bg-white rounded-xl p-2 h-9 w-9 flex items-center justify-center border border-indigo-100/60 shrink-0 text-[16px] shadow-sm">
                    📥
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-widest">Mẹo nhỏ khi download</h4>
                    <p className="text-slate-500 text-[10.5px] leading-relaxed">
                      Nếu trình duyệt không tự tải, hãy xem <b>Thanh công cụ</b> hoặc mục <b>Quản lý tải xuống</b> (phím tắt <code>Ctrl + J</code>) của trình duyệt nhé!
                    </p>
                  </div>
                </div>

                {/* Nút hành động */}
                <button
                  onClick={() => setWordExportState('idle')}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.01]"
                >
                  <span>Tuyệt vời, tôi đã rõ</span>
                </button>
              </>
            ) : (
              <div className="text-[11px] text-slate-400 font-bold bg-slate-50 rounded-xl px-4 py-2 w-full flex items-center justify-center gap-2 animate-pulse">
                <span>Vui lòng không đóng trình duyệt lúc này ☕</span>
              </div>
            )}
          </div>
        </div>
      )}

      <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSubmit={handleDrawingSubmit} isProcessing={isAiProcessing} />

      {showPermissionError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-amber-50 p-8 flex items-center gap-4 border-b border-amber-100">
              <Lock size={32} className="text-amber-600 animate-pulse" />
              <h3 className="text-2xl font-black text-slate-900">Lỗi phân quyền Firestore</h3>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                Ứng dụng cần quyền đọc/ghi các bộ sưu tập <b>'devices'</b>, <b>'statistics'</b>, <b>'users'</b>, <b>'guests'</b> trong Firestore. Hãy cập nhật <b>Security Rules</b> của bạn trong Firebase Console để xử lý lỗi này.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toàn bộ Security Rules mới (Đã sửa đổi công khai phần statistics):</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Kiểm tra quyền Admin
    function isAdmin() {
      return request.auth != null && (request.auth.token.email == "duyconghanh2017@gmail.com" || request.auth.token.email == "rongtiendatto@gmail.com");
    }

    // Kiểm tra người dùng đã đăng nhập
    function isSignedIn() {
      return request.auth != null;
    }

    // --- CẤU HÌNH QUYỀN TRUY CẬP ---

    // 1. Bộ sưu tập 'statistics' hoàn toàn công khai cho tất cả mọi người (đọc/ghi tự do không cần đăng nhập)
    match /statistics/{document=**} {
      allow read, write: if true;
    }

    // 2. Sử dụng wildcard động cho tất cả bộ sưu tập còn lại để hỗ trợ tên tiếng Việt có dấu trong Firestore Security Rules
    match /{collectionName}/{docId} {
      
      // Bộ sưu tập 'users' & 'người dùng': Cho phép chủ sở hữu (uid chính là docId) hoặc Admin truy cập
      allow read, write: if (collectionName == "users" || collectionName == "người dùng")
                          && (isAdmin() || (isSignedIn() && request.auth.uid == docId));
      allow list: if (collectionName == "users" || collectionName == "người dùng") && isAdmin();
      
      // Bộ sưu tập 'guests' & 'khách': Cho phép bất kỳ người dùng đã đăng nhập (vì docId là fingerprint thiết bị) hoặc Admin truy cập
      allow read, write: if (collectionName == "guests" || collectionName == "khách")
                          && (isAdmin() || isSignedIn());
      allow list: if (collectionName == "guests" || collectionName == "khách") && isAdmin();
      
      // Bộ sưu tập 'devices' & 'thiết bị': Cho phép bất kỳ người dùng đã đăng nhập (vì docId là fingerprint thiết bị) hoặc Admin truy cập
      allow read, write: if (collectionName == "devices" || collectionName == "thiết bị") && isSignedIn();
      allow list: if (collectionName == "devices" || collectionName == "thiết bị") && isAdmin();
    }
  }
}`);
                      setToast({ message: "Đã sao chép cấu hình Rules công khai statistics vào Clipboard!", type: 'success' });
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    📋 Sao chép cấu hình Rules mới nhất
                  </button>
                </div>
                <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-[11px] font-mono overflow-y-auto max-h-72 leading-relaxed border border-slate-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && (request.auth.token.email == "duyconghanh2017@gmail.com" || request.auth.token.email == "rongtiendatto@gmail.com");
    }
    function isSignedIn() {
      return request.auth != null;
    }

    match /statistics/{document=**} {
      allow read, write: if true;
    }

    match /{collectionName}/{docId} {
      allow read, write: if (collectionName == "users" || collectionName == "người dùng")
                          && (isAdmin() || (isSignedIn() && request.auth.uid == docId));
      allow list: if (collectionName == "users" || collectionName == "người dùng") && isAdmin();

      allow read, write: if (collectionName == "guests" || collectionName == "khách")
                          && (isAdmin() || isSignedIn());
      allow list: if (collectionName == "guests" || collectionName == "khách") && isAdmin();

      allow read, write: if (collectionName == "devices" || collectionName == "thiết bị") && isSignedIn();
      allow list: if (collectionName == "devices" || collectionName == "thiết bị") && isAdmin();
    }
  }
}`}
                </pre>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl text-xs space-y-2 border border-slate-100 text-slate-700">
                <div className="font-bold text-slate-800">🛠️ 3 bước kích hoạt cực kỳ đơn giản:</div>
                <ol className="list-decimal pl-4.5 space-y-1 leading-relaxed">
                  <li>Click nút <b>Mở Firebase Rules</b> ở dưới (hoặc vào Firebase Console dự án của bạn).</li>
                  <li>Dán đoạn mã trên vào bên trong block <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-slate-600">match /databases/&#123;database&#125;/documents</code>.</li>
                  <li>Click nút <b>Publish</b> (Xuất bản) màu xanh ở góc trên bên phải để áp dụng ngay.</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a 
                  href="https://console.firebase.google.com/project/okoko-807c1/firestore/rules" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-center font-bold text-sm transition-all shadow-md shadow-indigo-150 flex items-center justify-center gap-2"
                >
                  ⚙️ Mở Firebase Rules của bạn →
                </a>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowPermissionError(false)} 
                  className="py-4 px-6 rounded-2xl text-slate-700 font-bold border-slate-200"
                >
                  Đóng/Bỏ qua
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfigError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-8 flex items-center gap-4 border-b border-red-100">
              <ShieldAlert size={32} className="text-red-600 animate-pulse" />
              <h3 className="text-2xl font-black text-slate-900">Lỗi: Chưa bật đăng ký ẩn danh</h3>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-slate-600 text-sm leading-relaxed">
                Tính năng <b>Đăng ký / Vào nhanh bằng ID thiết bị</b> chưa được bật trong trang quản lý Firebase của dự án này. Vui lòng kích hoạt theo hướng dẫn dưới đây để khắc phục lỗi.
              </p>
              <div className="bg-slate-50 p-5 rounded-2xl space-y-2 border border-slate-100 text-xs text-slate-700">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-sm">
                  <span>⚙️ Cách kích hoạt trong 30 giây:</span>
                </div>
                <ol className="list-decimal pl-4.5 space-y-2 leading-relaxed">
                  <li>Mở <b>Firebase Console</b> của bạn.</li>
                  <li>Go to <b>Authentication</b> → tab <b>Sign-in method</b> (Phương thức đăng nhập).</li>
                  <li>Chọn <b>Add new provider</b> (hoặc dòng <b>Anonymous</b>).</li>
                  <li>Gạt công tắc sang <b>Enable</b> (Bật) và nhấn nút <b>Save</b> (Lưu) để hoàn tất.</li>
                </ol>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a 
                  href="https://console.firebase.google.com/project/okoko-807c1/authentication/providers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-center font-bold text-sm transition-all shadow-md shadow-indigo-150 flex items-center justify-center gap-2"
                >
                  ⚙️ Vào trang Firebase Console ngay →
                </a>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfigError(false)} 
                  className="py-4 px-6 rounded-2xl text-slate-700 font-bold border-slate-200"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
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
