import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  FolderArchive, 
  Upload, 
  Sparkles,
  AlertCircle,
  RotateCw,
  Github,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Zap,
  ArrowDown,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  StepOneVisual, 
  StepTwoVisual, 
  StepThreeVisual, 
  GeminiUsageVisual 
} from './components/VisualGuides';
import { OutputPreview } from './components/OutputPreview';

const REPO_URL = 'https://github.com/123ok2/extentiongemini';
const DIRECT_ZIP_URL = '/extentiongemini.zip';
const GITHUB_ZIP_URL = 'https://github.com/123ok2/extentiongemini/archive/refs/heads/main.zip';
const GEMINI_URL = 'https://gemini.google.com';
const CHATGPT_URL = 'https://chatgpt.com';

export default function App() {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setIsInIframe(true);
      }
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Trạng thái checklist từng bước
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
  });

  const toggleStep = (stepNumber: number) => {
    const nextState = !completedSteps[stepNumber];
    const newSteps = { ...completedSteps, [stepNumber]: nextState };
    setCompletedSteps(newSteps);

    if (newSteps[1] && newSteps[2] && newSteps[3]) {
      triggerConfetti();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback nếu browser chặn
    }
  };

  // Hàm tải file thông minh với Blob URL & Fallback tự động
  const handleSmartDownload = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setDownloading(true);
    setDownloadError(false);

    try {
      // Thử fetch file nhị phân và tạo Blob download URL
      const response = await fetch(DIRECT_ZIP_URL);
      if (!response.ok) throw new Error('Không thể fetch file nội bộ');
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'extentiongemini.zip';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objectUrl);
      }, 1000);

      triggerConfetti();
      setCompletedSteps(prev => ({ ...prev, 1: true }));
    } catch (err) {
      console.warn('Direct blob download failed or was sandboxed:', err);
      // Mở link dự phòng GitHub trực tiếp sang tab mới
      window.open(GITHUB_ZIP_URL, '_blank', 'noopener,noreferrer');
      setDownloadError(true);
      setShowDownloadOptions(true);
    } finally {
      setDownloading(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 3) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. THANH ĐIỀU HƯỚNG CỐ ĐỊNH CHUẨN FORM */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              ✨
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                Gemini &amp; ChatGPT Study Exporter
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded border border-blue-200/60">
                  v2.6.0
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#install-steps"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:inline-block"
            >
              3 Bước Cài Đặt
            </a>
            <a
              href="#usage-guide"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:inline-block"
            >
              Cách Dùng
            </a>
            <button
              onClick={handleSmartDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải File .ZIP</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* 2. HERO SECTION GỌN GÀNG, KHOA HỌC & RÕ RÀNG */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs text-center space-y-6 relative overflow-hidden">
          {/* Vệt sáng trang trí tinh tế */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-blue-50/80 via-emerald-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Huy hiệu tin cậy hỗ trợ cả Gemini và ChatGPT */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Tiện Ích Dùng Cho Cả Google Gemini &amp; ChatGPT (v2.6.0)</span>
          </div>

          <div className="space-y-2 max-w-xl mx-auto relative">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Hướng Dẫn Cài Đặt Ngắn Gọn &amp; Dễ Hiểu
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Xuất toàn bộ hoặc từng đoạn chat trên <strong className="text-blue-700 font-semibold">Google Gemini</strong> và <strong className="text-emerald-700 font-semibold">ChatGPT</strong> sang <strong>Word, PDF, Markdown</strong> — giữ nguyên 100% công thức Toán LaTeX, Bảng và Code.
            </p>
          </div>

          {/* Nút tải chính & Tải dự phòng */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <button
              id="download-btn-hero"
              onClick={handleSmartDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all transform active:scale-98 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{downloading ? 'Đang khởi tạo tải xuống...' : 'Tải Tiện Ích Về Máy (.ZIP)'}</span>
            </button>

            {/* Link tải dự phòng GitHub */}
            <a
              id="download-btn-github-zip"
              href={GITHUB_ZIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setCompletedSteps(prev => ({ ...prev, 1: true }))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/15 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Tải Dự Phòng (GitHub .ZIP)</span>
            </a>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Github className="w-4 h-4 text-slate-500" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Hộp chỉ dẫn phụ trợ khi bị sandbox chặn tải file */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left text-xs space-y-2 max-w-xl mx-auto">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span>💡</span> Nếu trình duyệt chặn tải tự động trong khung xem trước:
              </span>
              <button 
                onClick={openInNewTab}
                className="text-blue-600 hover:underline font-bold text-[11px] shrink-0"
              >
                Mở web trên Tab Mới ↗
              </button>
            </div>
          </div>

          {/* 4 Tiêu chí cốt lõi */}
          <div className="pt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Cài trong 60 giây</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Offline an toàn</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Giữ nguyên LaTeX</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Dùng Gemini &amp; ChatGPT</span>
            </div>
          </div>
        </section>

        {/* 3. CHECKLIST TIẾN TRÌNH 3 BƯỚC */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Tiến trình cài đặt:</span>
              <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 text-[11px]">
                {completedCount}/3 Bước ({progressPercent}%)
              </span>
            </div>
            {progressPercent === 100 && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                🎉 Xuất sắc! Bạn đã sẵn sàng sử dụng!
              </span>
            )}
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <button
              onClick={() => toggleStep(1)}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                completedSteps[1] 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium' 
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                completedSteps[1] ? 'bg-emerald-600 text-white' : 'border border-slate-400 bg-white'
              }`}>
                {completedSteps[1] ? '✓' : ''}
              </div>
              <span className="truncate">1. Giải nén file .zip</span>
            </button>

            <button
              onClick={() => toggleStep(2)}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                completedSteps[2] 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium' 
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                completedSteps[2] ? 'bg-emerald-600 text-white' : 'border border-slate-400 bg-white'
              }`}>
                {completedSteps[2] ? '✓' : ''}
              </div>
              <span className="truncate">2. Bật Developer Mode</span>
            </button>

            <button
              onClick={() => toggleStep(3)}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                completedSteps[3] 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium' 
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                completedSteps[3] ? 'bg-emerald-600 text-white' : 'border border-slate-400 bg-white'
              }`}>
                {completedSteps[3] ? '✓' : ''}
              </div>
              <span className="truncate">3. Nạp tiện ích vào Chrome</span>
            </button>
          </div>
        </section>

        {/* 4. 3 BƯỚC CÀI ĐẶT CHI TIẾT & KHOA HỌC */}
        <section id="install-steps" className="space-y-6 scroll-mt-20">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>🛠️</span>
                <span>3 Bước Thực Hiện Nhanh (60 Giây)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Làm theo 3 bước sau là tiện ích sẽ chạy vĩnh viễn trên trình duyệt của bạn.
              </p>
            </div>
          </div>

          {/* BƯỚC 1 */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </span>
                <div>
                  <h3 className="text-slate-900 text-base font-bold">
                    Bước 1: Giải nén file extentiongemini.zip
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Vào thư mục <strong>Downloads (Tải về)</strong> &rarr; Click chuột phải vào file <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-900 font-bold">extentiongemini.zip</code> &rarr; chọn <strong>"Extract All..."</strong> (hoặc <em>"Giải nén tại đây"</em>) để nhận thư mục <code className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">extentiongemini-main</code>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleStep(1)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold shrink-0 transition-colors ${
                  completedSteps[1] 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {completedSteps[1] ? '✓ Đã xong bước 1' : 'Đánh dấu đã xong'}
              </button>
            </div>

            {/* HÌNH ẢNH MINH HỌA BƯỚC 1 */}
            <StepOneVisual />
          </div>

          {/* BƯỚC 2 */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </span>
                <div className="space-y-2">
                  <h3 className="text-slate-900 text-base font-bold">
                    Bước 2: Mở trang Tiện ích &amp; Gạt BẬT Chế độ nhà phát triển
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Nhập địa chỉ <code className="bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded font-bold">chrome://extensions</code> vào thanh địa chỉ trình duyệt rồi bấm <strong>Enter</strong>.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      id="copy-address-btn"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors border border-blue-200 shadow-2xs cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã sao chép link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sao chép: chrome://extensions</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-500">
                      (Nhìn sang góc trên cùng bên phải &rarr; Gạt <strong>BẬT</strong> công tắc <em>"Chế độ dành cho nhà phát triển"</em>)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleStep(2)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold shrink-0 transition-colors ${
                  completedSteps[2] 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {completedSteps[2] ? '✓ Đã xong bước 2' : 'Đánh dấu đã xong'}
              </button>
            </div>

            {/* HÌNH ẢNH MINH HỌA BƯỚC 2 */}
            <StepTwoVisual />
          </div>

          {/* BƯỚC 3 */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </span>
                <div>
                  <h3 className="text-slate-900 text-base font-bold">
                    Bước 3: Bấm "Tải tiện ích đã giải nén" &amp; chọn thư mục
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Nhìn sang <strong>góc trên cùng bên trái</strong>, bấm nút <strong>"Tải tiện ích đã giải nén"</strong> (Load unpacked) &rarr; chọn thư mục <code className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">extentiongemini-main</code>. Thẻ tiện ích <strong>Gemini &amp; ChatGPT Study Exporter</strong> sẽ xuất hiện như ảnh chụp thực tế bên dưới!
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleStep(3)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold shrink-0 transition-colors ${
                  completedSteps[3] 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {completedSteps[3] ? '✓ Đã xong bước 3' : 'Đánh dấu đã xong'}
              </button>
            </div>

            {/* HÌNH ẢNH MINH HỌA BƯỚC 3 */}
            <StepThreeVisual />

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Lưu ý quan trọng:</strong> Luôn giữ công tắc trên thẻ tiện ích ở trạng thái <strong>BẬT (Màu xanh)</strong> như trong ảnh chụp thực tế của bạn, và không di chuyển thư mục mã nguồn sau khi cài.
              </div>
            </div>
          </div>
        </section>

        {/* 5. CÁCH SỬ DỤNG TRÊN CẢ GOOGLE GEMINI VÀ CHATGPT */}
        <section id="usage-guide" className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Cách Dùng Trên Cả Google Gemini &amp; ChatGPT
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sau khi cài, hãy mở Gemini hoặc ChatGPT và nhấn <strong>F5 (Làm mới trang)</strong> để kích hoạt thanh công cụ.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                id="open-gemini-btn"
                href={GEMINI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Mở Gemini</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                id="open-chatgpt-btn"
                href={CHATGPT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Mở ChatGPT</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* HÌNH ẢNH MINH HỌA TRỰC QUAN CẢ GEMINI VÀ CHATGPT */}
          <GeminiUsageVisual />

          {/* 2 Cách thao tác linh hoạt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
              <strong className="text-slate-900 text-sm block flex items-center gap-1.5">
                <span className="text-blue-600">⚡</span> Cách 1: Tải Toàn Bộ Cuộc Trò Chuyện
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Nhìn vào góc dưới bên phải màn hình Gemini hoặc ChatGPT, bấm thanh công cụ nổi <strong>"⚡ Tải Tất Cả"</strong> để lưu trọn vẹn toàn bộ đoạn hội thoại sang Word (.doc), PDF, Markdown (.md) hoặc HTML.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
              <strong className="text-slate-900 text-sm block flex items-center gap-1.5">
                <span className="text-emerald-600">☑</span> Cách 2: Tải Chọn Lọc Từng Đoạn Chat
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Ở góc mỗi câu trả lời của AI, tick vào ô <strong>"Chọn phần này"</strong> để chỉ xuất riêng những lời giải, công thức toán LaTeX hoặc đoạn code bạn cần nộp bài.
              </p>
            </div>
          </div>
        </section>

        {/* 6. XEM TRƯỚC TÀI LIỆU SAU KHI XUẤT */}
        <OutputPreview />

        {/* 7. GIẢI ĐÁP NHANH CÁC CÂU HỎI THƯỜNG GẶP (KHOA HỌC & NGẮN GỌN) */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              3 Câu Hỏi Người Dùng Thường Gặp
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-900 block font-semibold">
                ❓ Sau khi cài xong, vào Gemini hoặc ChatGPT chưa thấy nút tải?
              </strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                &rarr; Bạn chỉ cần nhấn phím <strong>F5 (Làm mới trang)</strong> trên tab Gemini hoặc ChatGPT. Ngoài ra, hãy kiểm tra tại <code>chrome://extensions</code> xem công tắc trên thẻ tiện ích đã được <strong>gạt sang BẬT (Màu xanh)</strong> chưa nhé.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-900 block font-semibold">
                ❓ Báo lỗi: "Không thể tải tệp kê khai" (Manifest file is missing)?
              </strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                &rarr; Bạn đã chọn nhầm thư mục bọc ngoài cùng. Hãy đảm bảo khi bấm <em>"Tải tiện ích đã giải nén"</em>, bạn chọn đúng thư mục <code className="bg-slate-200/70 font-mono px-1 rounded text-slate-800">extentiongemini-main</code> (nơi có chứa trực tiếp file <code>manifest.json</code>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-900 block font-semibold">
                ❓ Tiện ích có lấy cắp tài khoản hay dữ liệu riêng tư không?
              </strong>
              <p className="text-slate-600 leading-relaxed text-xs">
                &rarr; <strong>Tuyệt đối 100% an toàn!</strong> Tiện ích hoạt động thuần túy trên máy cá nhân của bạn (Client-Side), không kết nối tới bất kỳ máy chủ nào. Toàn bộ mã nguồn mở công khai tại GitHub: <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">123ok2/extentiongemini</a>.
              </p>
            </div>
          </div>
        </section>

        {/* 8. FOOTER KẾT TRANG */}
        <footer className="text-center space-y-2 py-6 text-xs text-slate-400">
          <p>
            Phát triển phục vụ cộng đồng học tập &amp; nghiên cứu Google Gemini &amp; OpenAI ChatGPT • 100% Mã nguồn mở
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-500 font-medium">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              GitHub Repository
            </a>
            <span>•</span>
            <a href={GEMINI_URL} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              Google Gemini
            </a>
            <span>•</span>
            <a href={CHATGPT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
              OpenAI ChatGPT
            </a>
            <span>•</span>
            <a href={GITHUB_ZIP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors font-bold text-slate-700">
              Tải file .zip
            </a>
          </div>
        </footer>

      </main>
    </div>
  );
}
