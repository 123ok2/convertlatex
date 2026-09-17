import React, { useState } from 'react';
import { Download, Github, ShieldCheck, Sparkles, Zap, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';
import { DIRECT_ZIP_URL, EXTENSION_VERSION, GITHUB_REPO_URL, GITHUB_ZIP_URL } from '../data/guideData';

export const Hero: React.FC = () => {
  const [copiedClone, setCopiedClone] = useState(false);

  const handleCopyClone = () => {
    navigator.clipboard.writeText('git clone https://github.com/123ok2/extentiongemini.git');
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-200 bg-linear-to-b from-blue-50/50 via-white to-slate-50">
      {/* Decorative subtle background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-6 shadow-xs border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Tiện ích Chrome & Edge • Phiên bản {EXTENSION_VERSION} • Miễn phí 100%</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Hướng Dẫn Tải & Cài Đặt <br className="hidden sm:inline" />
            <span className="text-blue-600">Gemini Study Exporter</span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Lưu trọn vẹn toàn bộ hoặc từng đoạn chat trên Google Gemini —{' '}
            <strong className="text-slate-800 font-semibold">
              giữ nguyên 100% công thức toán học LaTeX, bảng dữ liệu và code lập trình
            </strong>
            . Xuất ngay sang PDF, Word (.doc), Markdown (.md) và HTML.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              id="hero-download-btn"
              href={DIRECT_ZIP_URL}
              download="extentiongemini.zip"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              <span>Tải Trọn Bộ Extension (.ZIP)</span>
              <span className="text-blue-200 text-xs font-normal">(55 KB)</span>
            </a>

            <a
              id="hero-guide-btn"
              href="#huong-dan-cai-dat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-colors"
            >
              <span>Xem Hướng Dẫn Cài Đặt 1 Phút</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>

            <a
              id="hero-github-btn"
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
          </div>

          {/* Git Clone quick copy */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Dành cho lập trình viên:</span>
            <button
              id="hero-copy-git-btn"
              onClick={handleCopyClone}
              className="inline-flex items-center gap-1.5 font-mono bg-white px-2.5 py-1 rounded border border-slate-200 hover:border-slate-400 text-slate-700 transition-colors"
            >
              <span>git clone {GITHUB_REPO_URL}.git</span>
              {copiedClone ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>

          {/* 4 Key Pillar Highlights */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-900">100% Offline Bảo Mật</h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Không gửi dữ liệu lên bất kỳ máy chủ nào. Xử lý trực tiếp trên trình duyệt.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <span className="font-mono text-xs font-bold">LaTeX</span>
              </div>
              <h2 className="text-xs font-bold text-slate-900">Chuẩn Công Thức Toán</h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Bảo lưu trọn vẹn tích phân, đạo hàm, ma trận, căn thức chuẩn LaTeX & MathJax.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-900">Không Lỗi "Failed to fetch"</h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Khắc phục triệt để lỗi mạng thường gặp ở các tiện ích trung gian khác.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-900">Chọn Lọc Từng Tin Nhắn</h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Tick chọn câu trả lời cần thiết hoặc xuất toàn bộ cuộc hội thoại chỉ với 1 click.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
