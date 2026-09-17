import React, { useState } from 'react';
import { FileText, Download, Check, Sparkles, Eye, FileCode } from 'lucide-react';

export const OutputPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'word' | 'markdown'>('word');

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h3 className="font-bold text-slate-900 text-base">
              Xem Trước Kết Quả Xuất File Thực Tế
            </h3>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
              Chuẩn 100%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem tài liệu học tập & nghiên cứu trông sẽ chuẩn đẹp, ngăn nắp như thế nào sau khi tải từ Google Gemini về.
          </p>
        </div>

        {/* Tab chuyển đổi định dạng */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('word')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'word' 
                ? 'bg-white text-blue-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Microsoft Word (.doc)
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pdf' 
                ? 'bg-white text-red-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PDF (A4 Chuẩn)
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'markdown' 
                ? 'bg-white text-purple-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Markdown (.md)
          </button>
        </div>
      </div>

      {/* Khung tài liệu mẫu chuẩn A4 */}
      <div className="bg-[#f8f9fa] p-4 sm:p-6 rounded-xl border border-slate-200/80">
        <div className="bg-white max-w-xl mx-auto rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4 font-serif text-slate-800 text-xs sm:text-sm">
          {/* Header tài liệu */}
          <div className="border-b border-slate-200 pb-3 font-sans space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Google Gemini Conversation Export</span>
              <span>15/09/2026</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
              Chuyên Đề: Giải Tích & Tích Phân Từng Phần
            </h4>
          </div>

          {/* Câu hỏi người dùng */}
          <div className="bg-blue-50/50 p-3 rounded-lg border-l-3 border-blue-500 font-sans text-xs space-y-1">
            <span className="font-bold text-blue-900">Câu hỏi của bạn:</span>
            <p className="text-slate-700">Hãy tính tích phân bất định I = ∫ x · sin(x) dx và lập bảng giá trị tương ứng.</p>
          </div>

          {/* Lời giải Gemini */}
          <div className="space-y-3 font-sans text-xs">
            <span className="font-bold text-slate-900 text-sm block">Lời giải chi tiết:</span>
            
            <p className="text-slate-700 leading-relaxed">
              Áp dụng phương pháp tích phân từng phần: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-bold">∫ u dv = u·v - ∫ v du</span>
            </p>

            {/* Công thức toán LaTeX */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center font-mono text-xs sm:text-sm text-blue-950 font-bold space-y-1">
              <div>I = -x·cos(x) + ∫ cos(x) dx</div>
              <div className="text-emerald-700 font-extrabold">I = -x·cos(x) + sin(x) + C</div>
            </div>

            {/* Bảng dữ liệu */}
            <div>
              <span className="font-semibold text-slate-800 text-[11px] block mb-1.5">Bảng giá trị mẫu:</span>
              <table className="w-full border-collapse text-left text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2 border border-slate-200">Góc x (rad)</th>
                    <th className="p-2 border border-slate-200">sin(x)</th>
                    <th className="p-2 border border-slate-200">cos(x)</th>
                    <th className="p-2 border border-slate-200">Giá trị I (C=0)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-200 font-mono">0</td>
                    <td className="p-2 border border-slate-200">0.00</td>
                    <td className="p-2 border border-slate-200">1.00</td>
                    <td className="p-2 border border-slate-200 font-bold text-blue-700">0.00</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="p-2 border border-slate-200 font-mono">π/2</td>
                    <td className="p-2 border border-slate-200">1.00</td>
                    <td className="p-2 border border-slate-200">0.00</td>
                    <td className="p-2 border border-slate-200 font-bold text-blue-700">1.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
