import React, { useState } from 'react';
import { Download, ExternalLink, Github, Check, Copy } from 'lucide-react';
import { DIRECT_ZIP_URL, GITHUB_REPO_URL } from '../data/guideData';

export const Navbar: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform overflow-hidden">
            <img 
              src="/extension-icon.png" 
              alt="Extension Icon" 
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback emoji if image not yet loaded
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-xl -mt-0.5">📐</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">
                AI Study Exporter
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                v2.5.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Google Gemini Export with LaTeX
            </p>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#huong-dan-cai-dat" className="hover:text-blue-600 transition-colors">
            Cài đặt 1 phút
          </a>
          <a href="#mo-phong-su-dung" className="hover:text-blue-600 transition-colors">
            Dùng thử tương tác
          </a>
          <a href="#dinh-dang-xuat" className="hover:text-blue-600 transition-colors">
            Định dạng xuất
          </a>
          <a href="#bao-mat" className="hover:text-blue-600 transition-colors">
            Ưu điểm & Bảo mật
          </a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">
            Hỏi đáp (FAQ)
          </a>
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="nav-copy-chrome-btn"
            onClick={handleCopyChromeUrl}
            title="Sao chép đường dẫn chrome://extensions"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Đã chép link</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>chrome://extensions</span>
              </>
            )}
          </button>

          <a
            id="nav-github-link"
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Xem mã nguồn trên GitHub"
          >
            <Github className="w-5 h-5" />
          </a>

          <a
            id="nav-download-zip-btn"
            href={DIRECT_ZIP_URL}
            download="extentiongemini.zip"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tải .ZIP</span>
          </a>
        </div>
      </div>
    </header>
  );
};
