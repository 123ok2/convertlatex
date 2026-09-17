import React, { useState } from 'react';
import { 
  Search, 
  RotateCw, 
  ExternalLink, 
  FolderOpen, 
  Check, 
  Download, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Puzzle,
  Keyboard,
  Compass,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ChromeLogo } from './ChromeLogo';

const REPO_URL = 'https://github.com/123ok2/extentiongemini';

interface ChromeMockupProps {
  onDownloadZip: () => void;
  onOpenGemini: () => void;
}

export const ChromeExtensionsMockup: React.FC<ChromeMockupProps> = ({ 
  onDownloadZip,
  onOpenGemini
}) => {
  const [devMode, setDevMode] = useState<boolean>(true);
  const [geminiActive, setGeminiActive] = useState<boolean>(true);
  const [showGuidePointers, setShowGuidePointers] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'extensions' | 'gemini'>('extensions');

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden font-sans">
      
      {/* 1. KHUNG TRÌNH DUYỆT CHROME (Tab Bar & Address Bar) */}
      <div className="bg-[#dfe3e7] border-b border-[#cfd4d9] select-none">
        
        {/* Hàng Tab */}
        <div className="flex items-center px-2 pt-2 gap-1 overflow-x-auto text-xs">
          {/* Tab 1: Hướng dẫn */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-[#dfe3e7] text-slate-700 text-[11px] max-w-[130px] truncate border-r border-slate-300/60 opacity-80">
            <span>✨</span>
            <span className="truncate">Hướng Dẫn Cài Đ...</span>
          </div>

          {/* Tab 2: Github repo */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-[#dfe3e7] text-slate-700 text-[11px] max-w-[130px] truncate border-r border-slate-300/60 opacity-80">
            <span>🐙</span>
            <span className="truncate">123ok2/extention...</span>
          </div>

          {/* Tab 3: TIỆN ÍCH (Active Tab như trong hình) */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg bg-white text-slate-900 font-medium text-xs shadow-xs border-t-2 border-t-blue-600 relative">
            <span className="text-blue-600 text-sm">🧩</span>
            <span className="font-semibold">Tiện ích</span>
            <span className="text-slate-400 hover:text-slate-700 text-xs ml-1 cursor-pointer">×</span>
          </div>

          {/* Tab 4: Gemini tab shortcut */}
          <button 
            onClick={onOpenGemini}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg bg-[#dfe3e7] hover:bg-slate-200 text-slate-700 text-[11px] max-w-[130px] truncate transition-colors ml-1"
          >
            <span>✨</span>
            <span className="truncate text-blue-700 font-semibold">Hỏi Gemini</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </button>
        </div>

        {/* Thanh điều hướng & Địa chỉ (Omnibox) */}
        <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-slate-200 text-slate-600 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="cursor-not-allowed">←</span>
            <span className="cursor-not-allowed">→</span>
            <span className="cursor-pointer hover:text-slate-700">↻</span>
          </div>

          {/* Thanh URL chrome://extensions */}
          <div className="flex-1 bg-[#f1f3f4] rounded-full px-4 py-1.5 flex items-center justify-between text-xs text-slate-800 border border-transparent focus-within:border-blue-500 focus-within:bg-white shadow-2xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400 text-xs">🔒</span>
              <span className="font-semibold text-slate-900">chrome://extensions</span>
            </div>
            <span className="text-[11px] text-slate-400">☆</span>
          </div>

          {/* Nút bật/tắt chế độ hướng dẫn */}
          <button
            onClick={() => setShowGuidePointers(!showGuidePointers)}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showGuidePointers 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showGuidePointers ? 'Đang bật hướng dẫn trực quan' : 'Bật chỉ dẫn từng bước'}</span>
          </button>
        </div>

        {/* Thanh Dấu Trang (Bookmarks Bar) */}
        <div className="bg-white px-3 py-1 flex items-center gap-3 border-t border-slate-100 text-[11px] text-slate-600 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center gap-1 hover:text-slate-900 cursor-pointer">
            <span>🌐</span> Ứng dụng
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 hover:text-slate-900 cursor-pointer">
            <span>📁</span> 5. KHTN - OneDrive
          </span>
          <span className="flex items-center gap-1 hover:text-slate-900 cursor-pointer">
            <span>📄</span> Bản xem trước hình...
          </span>
          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 font-semibold hover:underline"
          >
            <span>✨</span> Mở Google Gemini
          </a>
        </div>
      </div>

      {/* 2. NỘI DUNG CHÍNH: GIAO DIỆN CHROME://EXTENSIONS */}
      <div className="bg-[#f8f9fa] min-h-[600px] flex flex-col">
        
        {/* Header của trang chrome://extensions */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
          
          {/* Logo Chrome + Tiêu đề Tiện ích */}
          <div className="flex items-center gap-3">
            <ChromeLogo className="w-8 h-8" />
            <h1 className="text-xl font-normal text-slate-800 tracking-tight">
              Tiện ích
            </h1>
          </div>

          {/* Ô Tìm Kiếm hình viên thuốc */}
          <div className="w-full sm:w-96 relative">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#edf2fa] rounded-full text-slate-600 text-xs border border-transparent focus-within:border-blue-500 focus-within:bg-white shadow-2xs">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Tìm tiện ích"
                className="bg-transparent outline-none w-full text-slate-800 text-xs"
                readOnly
                value=""
              />
            </div>
          </div>

          {/* Công tắc: Chế độ dành cho nhà phát triển (GÓC PHẢI) */}
          <div className="relative flex items-center gap-3">
            {/* Mũi tên hướng dẫn Bước 1 */}
            {showGuidePointers && (
              <div className="absolute -left-4 sm:-left-44 top-10 sm:top-1/2 sm:-translate-y-1/2 bg-amber-400 text-slate-950 font-bold text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-30 whitespace-nowrap">
                <span>👉 BƯỚC 1: Bật nút này</span>
                <span className="hidden sm:inline">&rarr;</span>
              </div>
            )}

            <label 
              htmlFor="dev-mode-toggle"
              className="text-xs text-slate-700 font-normal cursor-pointer select-none"
            >
              Chế độ dành cho nhà phát triển
            </label>

            <button
              id="dev-mode-toggle"
              type="button"
              onClick={() => setDevMode(!devMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                devMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>
        </div>

        {/* Thanh Nút Thao Tác (Hiện khi Chế độ nhà phát triển BẬT) */}
        {devMode && (
          <div className="bg-white px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center gap-3">
            
            {/* Nút 1: Tải tiện ích đã giải nén (Load Unpacked) */}
            <div className="relative">
              {showGuidePointers && (
                <div className="absolute -top-9 left-2 bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse z-30 whitespace-nowrap">
                  <span>👇 BƯỚC 2: Bấm vào đây</span>
                </div>
              )}

              <button
                onClick={onDownloadZip}
                className="px-4 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải tiện ích đã giải nén</span>
              </button>
            </div>

            {/* Nút 2: Đóng gói tiện ích */}
            <button className="px-4 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs transition-colors shadow-2xs">
              Đóng gói tiện ích
            </button>

            {/* Nút 3: Cập nhật */}
            <button className="px-4 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs transition-colors shadow-2xs">
              Cập nhật
            </button>

            <span className="text-[11px] text-slate-400 italic ml-auto hidden md:inline">
              (Bấm "Tải tiện ích đã giải nén" &rarr; Chọn thư mục extentiongemini-main)
            </span>
          </div>
        )}

        {/* Khung Nội Dung: Cột Trái + Lưới Tiện Ích */}
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* CỘT TRÁI (SIDEBAR) */}
          <div className="w-full md:w-64 p-4 border-r border-slate-200/80 bg-white/70 flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#d3e3fd] text-blue-900 font-semibold text-xs shadow-2xs">
                <Puzzle className="w-4 h-4 text-blue-700" />
                <span>Tiện ích của tôi</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full text-slate-700 hover:bg-slate-100 text-xs cursor-pointer">
                <Keyboard className="w-4 h-4 text-slate-500" />
                <span>Phím tắt</span>
              </div>
            </div>

            {/* Thông tin hỗ trợ ở góc dưới cột trái */}
            <div className="space-y-4 pt-4 border-t border-slate-200/80 text-[11px] text-slate-500">
              <p className="leading-relaxed">
                Bạn đang phát triển tiện ích? Hãy nắm bắt kịp thời{' '}
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Thông tin mới
                </a>{' '}
                với tài liệu dành cho nhà phát triển Tiện ích của Chrome.
              </p>

              <div className="pt-2">
                <a 
                  href={REPO_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                  <ChromeLogo className="w-4 h-4" />
                  <span>Cửa hàng Chrome trực tuyến</span>
                </a>
              </div>
            </div>
          </div>

          {/* KHU VỰC CHÍNH: LƯỚI TIỆN ÍCH (Y HỆT HÌNH CHỤP CỦA BẠN) */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Tất cả tiện ích (4)
              </h2>
              {showGuidePointers && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                  ✅ Tiện ích số 4 (Gemini Study Exporter) là tiện ích của bạn!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              
              {/* Thẻ 1: AAI NOMAHOA 3.2 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3 relative opacity-85">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5f6368] text-white flex items-center justify-center font-bold text-lg relative shrink-0">
                    <span>A</span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]">
                      📷
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">AAI NOMAHOA</span>
                      <span className="text-[11px] text-slate-500">3.2</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      Mã nhận dạng: bpbokhbjikdbgniogpdeddoemm...
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50">
                      Chi tiết
                    </button>
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50">
                      Xoá
                    </button>
                  </div>
                  <div className="w-8 h-4 rounded-full bg-slate-300 p-0.5">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Thẻ 2: AuraDrive Pro 1.9 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3 relative opacity-85">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5f6368] text-white flex items-center justify-center font-bold text-lg relative shrink-0">
                    <span>A</span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]">
                      📷
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">AuraDrive Pro</span>
                      <span className="text-[11px] text-slate-500">1.9</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      Tải tài liệu Google Drive bị chặn download (Docs, PDF, Slides, Sheets)
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      Mã nhận dạng: odaggegokodghfgedhogjgoabp...
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50">
                      Chi tiết
                    </button>
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50">
                      Xoá
                    </button>
                  </div>
                  <div className="w-8 h-4 rounded-full bg-slate-300 p-0.5">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Thẻ 3: Duy Hạnh 1.0 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3 relative opacity-85">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5f6368] text-white flex items-center justify-center font-bold text-lg relative shrink-0">
                    <span>D</span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]">
                      📷
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">Duy Hạnh</span>
                      <span className="text-[11px] text-slate-500">1.0</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Dịch vụ tải tài liệu Duy Hạnh 0868640898
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      Mã nhận dạng: pdcmcgjpapmbnmgimojfnlffn...
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50">
                      Chi tiết
                    </button>
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50">
                      Xoá
                    </button>
                  </div>
                  <div className="w-8 h-4 rounded-full bg-slate-300 p-0.5">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* THẺ 4: GEMINI STUDY EXPORTER (ĐÃ TẢI THÀNH CÔNG VÀ HOẠT ĐỘNG) */}
              <div className="bg-white rounded-xl p-4 border-2 border-blue-500 shadow-md space-y-3 relative ring-2 ring-blue-400/20">
                {/* Huy hiệu nổi bật */}
                <div className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <span>✓ Tiện Ích Đã Cài Đặt Xong</span>
                </div>

                <div className="flex items-start gap-3">
                  {/* Icon Toán LaTeX xanh tích phân chuẩn */}
                  <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xl relative shrink-0 shadow-xs">
                    <span>∫</span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]" title="Chế độ tải từ thư mục giải nén">
                      📷
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        Gemini Study Exporter
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">2.5.0</span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Tải cuộc trò chuyện hoặc 1 phần đoạn chat trên Gemini (giữ nguyên công thức toán LaTeX, bảng biểu, code và ký hiệu đặc biệt)
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Mã nhận dạng: dfchkgpghclipflbaolicinaapfaahdo
                    </p>

                    <p className="text-[10px] text-blue-600 mt-0.5">
                      Kiểm tra giao diện: <span className="underline cursor-pointer">trình chạy dịch vụ (Không ho...</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50 font-medium">
                      Chi tiết
                    </button>
                    <button className="px-3 py-1 rounded-full border border-slate-300 text-blue-600 text-xs hover:bg-slate-50 font-medium">
                      Xoá
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Nút Reload xoay tròn */}
                    <button 
                      title="Tải lại tiện ích"
                      className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Công tắc BẬT của tiện ích */}
                    <button
                      type="button"
                      onClick={() => setGeminiActive(!geminiActive)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        geminiActive ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Thanh thông báo kết quả dưới chân */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Sau khi thấy thẻ <strong>Gemini Study Exporter</strong> xuất hiện và công tắc màu xanh như trên, bạn chỉ cần mở <strong>gemini.google.com</strong> là dùng được ngay!
                </span>
              </div>
              <button
                onClick={onOpenGemini}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 transition-colors"
              >
                <span>Mở Gemini</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
