import React from 'react';
import { X, CheckCircle2, Sparkles, FileText, Keyboard, Settings, Download, Copy } from 'lucide-react';

interface WordGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordGuideModal: React.FC<WordGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Mẹo ép Word tự động hiển thị công thức chuẩn 2D
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tối ưu cho Microsoft Word 2016, 2019, 2021 và Microsoft 365
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed">
          {/* Cách 1: Ưu tiên số 1 - Tải file docx */}
          <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 relative">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                <Download size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-base">Cách 1: Tải file Word (.docx)</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-600 text-white">Khuyên dùng 100%</span>
                </div>
                <p className="text-slate-600 mt-1 text-[13px]">
                  Bấm biểu tượng <strong>Tải file Word (.docx)</strong> trên thanh công cụ. Khi mở file, toàn bộ công thức đều <strong>tự động chuyển thành Equation bản quyền chuẩn đẹp 2D</strong> (font Cambria Math, phân số xếp trên dưới, căn bậc hai kéo dài), không cần thao tác thêm bất kỳ phím nào!
                </p>
              </div>
            </div>
          </div>

          {/* Cách 2: Phím tắt Alt + = khi dán từng công thức */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                <Keyboard size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950 text-base">Cách 2: Phím tắt ép hiển thị 2D (Alt + =)</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-700">Nhanh nhất</span>
                </div>
                <p className="text-slate-600 mt-1 text-[13px]">
                  Khi bạn nhấp chuột vào công thức bất kỳ trên trang web để chép:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1 text-slate-700 text-[13px] font-medium">
                  <li>Trong Word, nhấn tổ hợp phím <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md font-mono text-xs shadow-xs text-indigo-700 font-bold">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md font-mono text-xs shadow-xs text-indigo-700 font-bold">=</kbd> để mở khung công thức.</li>
                  <li>Nhấn <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md font-mono text-xs shadow-xs text-indigo-700 font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md font-mono text-xs shadow-xs text-indigo-700 font-bold">V</kbd> để dán.</li>
                  <li>Word sẽ <strong>tức thì ép công thức chuyển sang dạng 2D chuyên nghiệp (Professional)</strong> sắc nét tuyệt đối!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Cách 3: Bật tự động nhận dạng trong Word Options */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-700 text-white shrink-0 mt-0.5">
                <Settings size={18} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-slate-900 text-base">Cách 3: Cài đặt Word tự động chuyển khi bấm Ctrl+V</span>
                <p className="text-slate-600 mt-1 text-[13px]">
                  Chỉ cần cài đặt 1 lần duy nhất trong Microsoft Word:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700 text-[13px]">
                  <li>Vào <strong>File</strong> &gt; <strong>Options</strong> &gt; chọn mục <strong>Advanced</strong>.</li>
                  <li>Cuộn xuống phần <strong>Cut, copy, and paste</strong>.</li>
                  <li>Tích chọn vào dòng: <span className="font-semibold text-slate-800">"When copying MathML to the clipboard as plain text, paste it into Word as an equation"</span>.</li>
                  <li>Bấm <strong>OK</strong>. Từ nay về sau, cứ nhấn <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-md font-mono text-xs">Ctrl + V</kbd> là Word tự động ép thành công thức chuẩn.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cách 4: Chuyển đổi thủ công nếu lỡ dán dạng 1 dòng (Linear) */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
                <FileText size={18} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-amber-950 text-base">Nếu công thức bị hiển thị dạng một dòng (Linear)?</span>
                <p className="text-slate-600 mt-1 text-[13px]">
                  Nhấp chuột vào khung công thức trong Word &gt; trên thanh ribbon vào thẻ <strong>Equation (Công thức)</strong> &gt; bấm nút <strong>Professional (Chuyên nghiệp)</strong> hoặc bấm mũi tên góc phải của khung công thức và chọn <strong>Professional</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Hỗ trợ đầy đủ LaTeX, MathType &amp; Office Math</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
