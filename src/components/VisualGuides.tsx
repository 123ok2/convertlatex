import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Check, 
  MousePointer2, 
  Upload, 
  FolderOpen,
  RotateCw,
  Search,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ChromeLogo } from './ChromeLogo';

/** 
 * HÌNH MINH HỌA BƯỚC 1: Giải nén thư mục (Mô phỏng File Explorer sạch sẽ, chuẩn xác)
 */
export const StepOneVisual: React.FC<{ onComplete?: () => void; isDone?: boolean }> = ({ onComplete, isDone }) => {
  return (
    <div className="mt-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs font-sans text-xs">
      {/* Header thanh tiêu đề cửa sổ */}
      <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-slate-600 text-[11px]">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-slate-400 font-mono text-[10px] ml-1">📁 Downloads &gt; extentiongemini-main</span>
        </div>
        <span className="text-blue-700 bg-blue-50 font-semibold px-2 py-0.5 rounded-full border border-blue-200/60 text-[10px] flex items-center gap-1">
          <Zap className="w-3 h-3 text-blue-600" />
          Mô phỏng thao tác
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
        {/* File ZIP & Thao tác chuột */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5 shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
              1. File vừa tải về:
            </span>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/70">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shrink-0">
                📦
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono font-bold text-slate-900 text-xs truncate">extentiongemini.zip</div>
                <div className="text-[10px] text-slate-500">Kích thước: 108 KB • File nén</div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] flex items-start gap-2">
            <MousePointer2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Click chuột phải &rarr; chọn <strong>"Extract All..."</strong> (hoặc <em>"Giải nén tại đây"</em>)</span>
          </div>
        </div>

        {/* Thư mục kết quả */}
        <div className="bg-white p-3.5 rounded-xl border-2 border-emerald-500/80 flex flex-col justify-between space-y-2.5 shadow-2xs relative">
          <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs flex items-center gap-1">
            <Check className="w-3 h-3" /> CHỌN MỤC NÀY
          </div>

          <div>
            <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block mb-1.5">
              2. Thư mục thu được sau khi giải nén:
            </span>

            <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 font-mono space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>extentiongemini-main</span>
              </div>
              <div className="pl-6 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200/50">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>manifest.json</span>
                  <span className="text-[9px] text-emerald-700 ml-auto font-sans font-bold">Quan trọng nhất</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>content.js, background.js...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓ Mẹo:</span>
            <span>Chỉ cần bấm chọn cả thư mục này, không cần mở sâu vào trong.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 
 * HÌNH MINH HỌA BƯỚC 2: Mô phỏng thanh Chrome Tiện ích & Có thể tương tác gạt công tắc
 */
export const StepTwoVisual: React.FC = () => {
  const [devMode, setDevMode] = useState(true);

  return (
    <div className="mt-3.5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs font-sans text-xs">
      {/* Thanh địa chỉ URL Chrome */}
      <div className="bg-[#dee2e6] px-4 py-2 border-b border-slate-200 flex items-center gap-2.5 text-[11px]">
        <div className="flex items-center gap-2 bg-white px-3.5 py-1 rounded-full text-slate-800 font-mono flex-1 max-w-sm shadow-2xs">
          <span className="text-slate-400 text-xs">🔒</span>
          <span className="font-bold text-blue-700">chrome://extensions</span>
        </div>
        <span className="text-slate-500 text-[11px] hidden sm:inline">&larr; Dán địa chỉ này lên thanh duyệt web</span>
      </div>

      {/* Thanh tiêu đề Tiện ích Chrome */}
      <div className="p-3 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <ChromeLogo className="w-6 h-6 shrink-0" />
          <span className="text-base font-semibold text-slate-800 tracking-tight">Tiện ích</span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#edf2fa] rounded-full text-slate-500 text-[11px] ml-3">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Tìm tiện ích</span>
          </div>
        </div>

        {/* CÔNG TẮC BẬT CHẾ ĐỘ NHÀ PHÁT TRIỂN (Có thể bấm thử trực tiếp) */}
        <div 
          onClick={() => setDevMode(!devMode)}
          className={`cursor-pointer transition-all duration-200 flex items-center gap-3 p-2.5 rounded-xl border-2 select-none relative ${
            devMode 
              ? 'bg-blue-50/70 border-blue-500 shadow-sm' 
              : 'bg-slate-50 border-slate-300'
          }`}
          title="Bạn có thể bấm thử gạt công tắc này"
        >
          <div className="flex flex-col text-left">
            <span className="text-slate-800 text-xs font-bold flex items-center gap-1">
              <span>Chế độ dành cho nhà phát triển</span>
              <span className="text-[10px] text-blue-600 bg-blue-100 px-1 py-0.2 rounded font-normal hidden sm:inline">
                Click thử
              </span>
            </span>
            <span className="text-[10px] text-slate-500">Developer mode (góc trên bên phải)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors duration-200 ${
              devMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
            }`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-xs transition-transform duration-200" />
            </div>

            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border transition-colors ${
              devMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-200 text-slate-600 border-slate-300'
            }`}>
              {devMode ? 'BẬT' : 'TẮT'}
            </span>
          </div>

          {/* Mũi tên chỉ dẫn */}
          <div className="absolute -top-3 right-4 bg-amber-400 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <span>👉 BƯỚC 1: BẬT NÚT NÀY</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
        <span>💡 Khi gạt sang <strong>BẬT</strong>, 3 nút chức năng góc trái sẽ lập tức xuất hiện.</span>
        <span className="text-blue-600 font-medium">Thử click công tắc trên để xem!</span>
      </div>
    </div>
  );
};

/** 
 * HÌNH MINH HỌA BƯỚC 3: Nút Load Unpacked & Thẻ Gemini Study Exporter (Chuẩn 100% như ảnh chụp của người dùng)
 */
export const StepThreeVisual: React.FC = () => {
  return (
    <div className="mt-3.5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs font-sans text-xs space-y-3.5 p-4 sm:p-5">
      
      {/* 1. Hàng nút thao tác (Load unpacked) */}
      <div className="flex flex-wrap items-center gap-2.5 pb-3.5 border-b border-slate-100">
        <div className="relative">
          <div className="px-4 py-2 rounded-full border-2 border-blue-600 text-blue-700 bg-blue-50/90 font-bold text-xs flex items-center gap-2 shadow-xs ring-4 ring-blue-400/20">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Tải tiện ích đã giải nén</span>
          </div>
          <div className="absolute -top-3.5 left-4 bg-blue-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <span>👉 BƯỚC 2: BẤM VÀO ĐÂY</span>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-full border border-slate-200 text-slate-400 text-xs bg-slate-50 hidden sm:inline-block">
          Đóng gói tiện ích
        </div>
        <div className="px-3.5 py-1.5 rounded-full border border-slate-200 text-slate-400 text-xs bg-slate-50 hidden sm:inline-block">
          Cập nhật
        </div>
        
        <div className="text-[11px] text-slate-500 ml-auto font-medium hidden md:flex items-center gap-1">
          <span>&rarr; Chọn thư mục</span>
          <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">extentiongemini-main</code>
        </div>
      </div>

      {/* 2. Thẻ tiện ích Gemini Study Exporter mô phỏng chính xác từ ảnh của bạn */}
      <div className="bg-white rounded-2xl p-4 sm:p-4.5 border-2 border-teal-500 shadow-sm space-y-3 relative">
        <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <Check className="w-3 h-3" /> Đã cài đặt thành công!
        </div>

        <div className="flex items-start gap-3.5">
          {/* Biểu tượng tích phân ∫ màu xanh ngọc */}
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-serif font-bold text-2xl relative shrink-0 shadow-md shadow-teal-600/20">
            <span>∫</span>
            <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] shadow-xs border-2 border-white" title="Tiện ích đã giải nén">
              📷
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <strong className="text-slate-900 text-sm font-bold">
                Gemini Study Exporter
              </strong>
              <span className="text-[11px] text-slate-400 font-mono font-medium">2.6.0</span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Tải cuộc trò chuyện hoặc chọn 1 phần đoạn chat trên Google Gemini (giữ nguyên 100% công thức toán LaTeX, bảng biểu, code)
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono pt-0.5">
              <span>Mã: dfchkgpghclipflbaolicinaapfaahdo</span>
              <span className="text-teal-600 font-semibold">• Tương thích: gemini.google.com</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full border border-slate-200 text-blue-600 text-[11px] font-semibold hover:bg-blue-50 transition-colors">
              Chi tiết
            </span>
            <span className="px-3.5 py-1.5 rounded-full border border-slate-200 text-blue-600 text-[11px] font-semibold hover:bg-blue-50 transition-colors">
              Xoá
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full hover:bg-slate-100 text-slate-400" title="Tải lại tiện ích">
              <RotateCw className="w-4 h-4" />
            </div>
            <div className="w-10 h-5 bg-blue-600 rounded-full p-0.5 flex items-center justify-end shadow-inner">
              <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              Đang BẬT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 
 * HÌNH MINH HỌA BƯỚC 4: Sử dụng trên Google Gemini (Chuẩn giao diện Google Gemini)
 */
export const GeminiUsageVisual: React.FC = () => {
  return (
    <div className="mt-3.5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs font-sans text-xs space-y-3.5 p-4 sm:p-5">
      {/* Header thanh địa chỉ Google Gemini */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs flex items-center gap-1.5">
            <span className="text-sm">✨</span>
            <span>gemini.google.com</span>
          </div>
          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">Google Workspace & Gemini AI</span>
        </div>

        <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold border border-blue-200/60 text-[10px] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-600" />
          Tiện ích tự động tích hợp trên Gemini
        </span>
      </div>

      {/* Khung mô phỏng câu hỏi và trả lời trên Gemini */}
      <div className="space-y-3">
        {/* Câu hỏi của người dùng */}
        <div className="flex items-start gap-2.5 justify-end">
          <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tr-sm px-4 py-2 text-xs max-w-md">
            Tính tích phân và tìm nghiệm vi phân cho phương trình sau...
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
            Bạn
          </div>
        </div>

        {/* Tin nhắn câu trả lời Gemini kèm ô checkbox chọn phần xuất */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/40 via-white to-slate-50/50 border border-blue-100/80 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                ✨
              </div>
              <span className="font-bold text-slate-900 text-xs">
                Google Gemini
              </span>
            </div>

            {/* Ô checkbox do Extension chèn tự động trên mỗi câu trả lời */}
            <div className="flex items-center gap-1.5 bg-white border border-blue-400 hover:border-blue-600 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 shadow-2xs transition-colors">
              <div className="w-3.5 h-3.5 bg-blue-600 text-white rounded flex items-center justify-center text-[9px] font-bold">
                ✓
              </div>
              <span>Chọn phần này để xuất riêng</span>
            </div>
          </div>

          <p className="text-slate-700 text-xs leading-relaxed">
            Dưới đây là lời giải chi tiết và công thức vi phân từng phần đã được tối ưu:
          </p>

          {/* Khối công thức Toán LaTeX */}
          <div className="p-3 rounded-xl bg-white border border-slate-200/90 font-mono text-slate-900 text-xs shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-blue-900 font-bold">∫ x·e⁻ˣ dx = -e⁻ˣ·(x + 1) + C</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-sans font-bold px-2 py-0.5 rounded border border-emerald-200/60">
              Giữ nguyên LaTeX 100%
            </span>
          </div>

          {/* Khối code Python mẫu */}
          <div className="rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 text-slate-200 text-[11px] font-mono">
            <div className="bg-slate-800/90 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span>python</span>
              <span className="text-slate-400 font-sans">Đầy đủ thụt đầu dòng</span>
            </div>
            <div className="p-3 space-y-1">
              <div><span className="text-purple-400">import</span> sympy <span className="text-purple-400">as</span> sp</div>
              <div>x = sp.Symbol(<span className="text-emerald-300">'x'</span>)</div>
              <div>result = sp.integrate(x * sp.exp(-x), x)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh công cụ nổi ở góc dưới bên phải màn hình Gemini */}
      <div className="p-3.5 rounded-2xl bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-slate-950/20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <div className="text-xs text-amber-300 font-bold flex items-center gap-1">
              <span>⚡ Thanh Nút Nổi Tự Động Góc Dưới Google Gemini:</span>
            </div>
            <div className="text-[10px] text-slate-400">Xuất toàn bộ hoặc chỉ xuất các phần đã tick chọn</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold shrink-0">
          <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs flex items-center gap-1">
            <span>⚡</span>
            <span>Tải Tất Cả</span>
          </span>
          <span className="px-2.5 py-1.5 rounded-lg bg-blue-700/80 text-white text-[11px]">Word</span>
          <span className="px-2.5 py-1.5 rounded-lg bg-red-600/80 text-white text-[11px]">PDF</span>
          <span className="px-2.5 py-1.5 rounded-lg bg-purple-600/80 text-white text-[11px]">Markdown</span>
          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-600/80 text-white text-[11px]">HTML</span>
        </div>
      </div>
    </div>
  );
};
