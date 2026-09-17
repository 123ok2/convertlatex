import React, { useState } from 'react';
import { Github, Download, ExternalLink, Copy, Check, Heart, Sparkles } from 'lucide-react';
import { DIRECT_ZIP_URL, GITHUB_REPO_URL, GITHUB_ZIP_URL } from '../data/guideData';

export const Footer: React.FC = () => {
  const [copiedClone, setCopiedClone] = useState(false);

  const handleCopyClone = () => {
    navigator.clipboard.writeText('git clone https://github.com/123ok2/extentiongemini.git');
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-800">
          {/* Brand & Mission */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✨</span>
              <span className="font-bold text-white text-base">
                Gemini Study Exporter
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm mb-4">
              Tiện ích mở rộng chuyên biệt cho học sinh, sinh viên và nhà nghiên cứu, giúp lưu trọn vẹn mọi tài liệu học tập từ Google Gemini với độ chuẩn xác LaTeX 100%.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Mã nguồn mở tại:</span>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1 font-semibold"
              >
                <span>github.com/123ok2/extentiongemini</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Liên Kết Hữu Ích</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={DIRECT_ZIP_URL}
                  download="extentiongemini.zip"
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tải file ZIP trực tiếp (108 KB)</span>
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_ZIP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Tải ZIP từ GitHub Releases</span>
                </a>
              </li>
              <li>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mở Google Gemini (gemini.google.com)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Developer Git Box */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Dành Cho Nhà Phát Triển</h4>
            <p className="text-slate-400 text-xs mb-2">
              Sao chép kho mã nguồn tiện ích bằng dòng lệnh Git:
            </p>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="text-slate-300 truncate">
                git clone {GITHUB_REPO_URL}.git
              </span>
              <button
                id="footer-copy-clone-btn"
                onClick={handleCopyClone}
                className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
                title="Sao chép lệnh git clone"
              >
                {copiedClone ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Được phát triển bởi tác giả <strong className="text-slate-400">123ok2</strong> trên GitHub.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            Trang hướng dẫn tải, cài đặt và sử dụng tiện ích mở rộng Gemini Study Exporter.
          </div>
          <div className="flex items-center gap-1">
            <span>Hoàn toàn miễn phí & 100% bảo mật ngoại tuyến (Offline)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
