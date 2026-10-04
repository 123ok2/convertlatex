import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  FileText, 
  FileDown, 
  Code, 
  Globe, 
  Sparkles, 
  RefreshCw, 
  Printer, 
  Download, 
  Eye, 
  Check, 
  ExternalLink,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ExportFormat } from '../types';
import { MOCK_CHAT_MESSAGES } from '../data/guideData';

export const InteractiveDemo: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['ai-1']);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('pdf');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showPopupSimulator, setShowPopupSimulator] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(MOCK_CHAT_MESSAGES.map((m) => m.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleExport = (fmt: ExportFormat) => {
    setActiveFormat(fmt);
    setPreviewOpen(true);
  };

  return (
    <section id="mo-phong-su-dung" className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Trải Nghiệm Trực Quan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Mô Phỏng Trực Tiếp Giao Diện Extension Khi Dùng Trên Google Gemini
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Sau khi cài extension, thanh công cụ nổi và các ô chọn sẽ tự động xuất hiện trên màn hình trò chuyện của bạn. Hãy thử tick chọn câu trả lời và bấm xuất file để xem kết quả!
          </p>
        </div>

        {/* Demo Stage Container */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Browser Bar Mockup */}
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="ml-3 bg-white px-3 py-1 rounded-md text-xs text-slate-600 font-mono flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                <span className="text-emerald-600">🔒</span>
                <span>https://gemini.google.com/app</span>
              </div>
            </div>

            {/* Simulated Extension Pin in Toolbar */}
            <div className="flex items-center gap-2">
              <button
                id="toggle-popup-sim-btn"
                onClick={() => setShowPopupSimulator(!showPopupSimulator)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                title="Bấm để xem giao diện cửa sổ Popup của Extension"
              >
                <span>📐</span>
                <span className="hidden sm:inline">AI Study Exporter</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">Popup</span>
              </button>
            </div>
          </div>

          {/* Interactive Chat Window */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[580px] overflow-y-auto bg-slate-50/50 relative">
            {/* Quick Action Selector within Chat */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-medium">Lựa chọn:</span>
                <button
                  id="demo-select-all-btn"
                  onClick={selectAll}
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">|</span>
                <button
                  id="demo-clear-selection-btn"
                  onClick={clearSelection}
                  className="font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Bỏ chọn
                </button>
              </div>
              <div className="text-slate-600">
                Đang tick chọn:{' '}
                <strong className="text-blue-600 font-bold">{selectedIds.length} mục</strong>
              </div>
            </div>

            {/* Chat Messages */}
            {MOCK_CHAT_MESSAGES.map((msg) => {
              const isSelected = selectedIds.includes(msg.id);
              const isAi = msg.sender === 'ai';

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAi
                      ? isSelected
                        ? 'bg-blue-50/40 border-blue-300 shadow-xs ring-1 ring-blue-300'
                        : 'bg-white border-slate-200'
                      : 'bg-slate-100/70 border-slate-200'
                  }`}
                >
                  {/* Message Top Bar with Selector */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        {isAi ? '✨ Google Gemini' : '👤 Bạn'}
                      </span>
                      <span className="text-[11px] text-slate-400">{msg.time}</span>
                    </div>

                    {/* Extension Injection Feature: Checkbox & Quick Export */}
                    <div className="flex items-center gap-2">
                      <button
                        id={`select-msg-btn-${msg.id}`}
                        onClick={() => toggleSelect(msg.id)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        <span>{isSelected ? 'Đã chọn phần này' : 'Chọn phần này'}</span>
                      </button>

                      {isAi && (
                        <button
                          id={`export-single-btn-${msg.id}`}
                          onClick={() => {
                            setSelectedIds([msg.id]);
                            handleExport('pdf');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors"
                          title="Tải riêng câu trả lời này"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>Tải đoạn này</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {msg.content}
                  </p>

                  {/* LaTeX Math Formula Render */}
                  {msg.mathSnippet && (
                    <div className="my-3 p-3 rounded-lg bg-slate-900 text-cyan-300 font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-sans tracking-wider mb-1">
                        Công thức LaTeX được bảo toàn 100%:
                      </div>
                      <div className="py-1">
                        $$\int_{'{'}0{'}'}^{'{\\infty}'} x \cdot e^{'{'}-x{'}'} dx = \left[ -x e^{'{'}-x{'}'} \right]_0^\infty + \int_0^\infty e^{'{'}-x{'}'} dx = 0 + 1 = 1$$
                      </div>
                    </div>
                  )}

                  {/* Table Render */}
                  {msg.tableData && (
                    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            {msg.tableData.headers.map((h: string, idx: number) => (
                              <th key={idx} className="p-2 border-r border-slate-200 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.tableData.rows.map((row: string[], rIdx: number) => (
                            <tr
                              key={rIdx}
                              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                            >
                              {row.map((cell: string, cIdx: number) => (
                                <td
                                  key={cIdx}
                                  className="p-2 border-r border-slate-100 last:border-r-0 font-mono text-slate-700"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Code snippet */}
                  {msg.codeSnippet && (
                    <div className="my-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono p-3 overflow-x-auto border border-slate-800">
                      <div className="text-[10px] text-slate-400 pb-1.5 border-b border-slate-800 mb-2 flex items-center justify-between">
                        <span>Python (SymPy Verification)</span>
                        <span>Định dạng giữ nguyên thụt đầu dòng</span>
                      </div>
                      <pre>{msg.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Simulated Floating Extension Bar (Injected bottom-right of page) */}
            <div className="sticky bottom-2 z-10 flex justify-end">
              <div className="p-3 rounded-xl bg-slate-900/95 backdrop-blur-md text-white shadow-xl border border-slate-700 flex flex-wrap items-center gap-2 animate-bounce-short">
                <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700 text-xs font-bold text-amber-300">
                  <span>⚡ Thanh Công Cụ Extension:</span>
                </div>

                {/* Direct Action Buttons */}
                <button
                  id="floating-export-all-btn"
                  onClick={() => {
                    selectAll();
                    handleExport('pdf');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  ⚡ Tải Tất Cả
                </button>

                <button
                  id="floating-export-selected-btn"
                  onClick={() => handleExport(activeFormat)}
                  disabled={selectedIds.length === 0}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedIds.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  ☑ Tải Đã Chọn ({selectedIds.length})
                </button>

                {/* Format selection pills */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="px-2 py-1 text-[11px] font-bold rounded bg-red-600 hover:bg-red-500 text-white"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('word')}
                    className="px-2 py-1 text-[11px] font-bold rounded bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Word
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="px-2 py-1 text-[11px] font-bold rounded bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="px-2 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    HTML
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom helper explanation */}
          <div className="bg-slate-100 p-3.5 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tiện ích tự động nhận diện giao diện Google Gemini khi bạn tải trang.</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              * Bấm các nút định dạng để xem bản xem trước khi xuất file.
            </div>
          </div>
        </div>

        {/* Modal Simulator: Export Preview */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">
                    {activeFormat === 'pdf' && '📄 Xem trước trang in PDF (Khổ A4)'}
                    {activeFormat === 'word' && '📝 Xem trước nội dung File Word (.doc)'}
                    {activeFormat === 'md' && '📜 Xem trước cú pháp Markdown (.md)'}
                    {activeFormat === 'html' && '🌐 Xem trước File HTML Tự Chứa'}
                  </span>
                  <span className="text-xs bg-blue-600 px-2 py-0.5 rounded font-mono">
                    {selectedIds.length} phần được chọn
                  </span>
                </div>
                <button
                  id="close-preview-modal-btn"
                  onClick={() => setPreviewOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Format Switcher inside Modal */}
              <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold">Chuyển định dạng:</span>
                {(['pdf', 'word', 'md', 'html'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setActiveFormat(fmt)}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors uppercase ${
                      activeFormat === fmt
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Content Preview */}
              <div className="p-6 overflow-y-auto flex-1 font-sans text-xs sm:text-sm text-slate-800 bg-slate-50">
                {activeFormat === 'pdf' && (
                  <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm max-w-xl mx-auto space-y-4">
                    <div className="border-b pb-3 flex justify-between items-center text-xs text-slate-400">
                      <span>Tài liệu học tập xuất từ Google Gemini</span>
                      <span>Ngày tạo: 16/09/2026</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      BÀI GIẢI TÍCH PHÂN VÀ MA TRẬN TỔNG HỢP
                    </h3>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>Công thức nghiệm:</strong>
                      <div className="text-blue-700 font-mono mt-1 text-sm">
                        ∫₀^∞ x·e⁻ˣ dx = [-x·e⁻ˣ]₀^∞ + ∫₀^∞ e⁻ˣ dx = 1
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Các ký hiệu tích phân, hàm lượng giác và bảng tra cứu đạo hàm đã được chuyển thành vector chất lượng cao, sẵn sàng xuất lệnh in và lưu dưới dạng PDF.
                    </p>
                  </div>
                )}

                {activeFormat === 'md' && (
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
                    <div className="text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                      # File: Gemini_Export_Study.md (Tương thích 100% Obsidian & Notion)
                    </div>
                    <pre className="text-slate-200">
{`# Bài giải tích phân và ma trận tổng hợp

> Nguồn: Google Gemini Study Exporter
> Thời gian: 16/09/2026

## Lời giải chi tiết:

Ta có công thức tích phân từng phần:
$$ \\int_{0}^{\\infty} x \\cdot e^{-x} \\, dx = \\left[ -x e^{-x} \\right]_0^\\infty + \\int_0^\\infty e^{-x} \\, dx = 1 $$

| Thông số | Ký hiệu | Giá trị tính toán |
|---|---|---|
| Tích phân | I_1 | 1.000 (Hội tụ) |
| Định thức ma trận A | |A| = a_{11}a_{22} - a_{12}a_{21} | 14.50 |`}
                    </pre>
                  </div>
                )}

                {activeFormat === 'word' && (
                  <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                      <span>📄 Word Document (.doc file format)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nội dung được cấu trúc dưới định dạng HTML-Word chuẩn hóa. Bạn chỉ cần tải file về và mở trực tiếp bằng Microsoft Word hoặc Google Docs để chỉnh sửa, thêm tên người làm bài và in ấn bài tập.
                    </p>
                  </div>
                )}

                {activeFormat === 'html' && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="text-xs font-semibold text-emerald-700">
                      🌐 Standalone Web Archive
                    </div>
                    <p className="text-xs text-slate-600">
                      Toàn bộ CSS, font chữ và các đoạn code được nén trong 1 file .html duy nhất. Bấm đúp chuột là mở được trên máy tính của giáo viên hoặc bạn bè mà không cần cài đặt thêm bất kỳ phần mềm nào.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  💡 Extension thực hiện việc xuất này trực tiếp tại máy tính của bạn trong 0.2 giây.
                </span>
                <button
                  id="confirm-close-preview-btn"
                  onClick={() => setPreviewOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Đã hiểu, đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Simulator: Popup Extension */}
        {showPopupSimulator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl w-[360px] shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                <span>Cửa sổ Popup Tiện Ích Trên Trình Duyệt</span>
                <button
                  onClick={() => setShowPopupSimulator(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Real extension popup UI rendered */}
              <div className="p-4 bg-slate-50 space-y-3 text-xs">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                  <span className="text-2xl">📐</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">AI Study Exporter</h4>
                    <p className="text-[11px] text-slate-500">Bảo toàn công thức Toán & Bảng biểu</p>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Nền tảng:</span>
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Google Gemini
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Số tin nhắn:</span>
                    <span className="font-bold text-slate-800">4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Đang tick chọn:</span>
                    <span className="font-bold text-blue-600">{selectedIds.length} mục</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowPopupSimulator(false);
                      handleExport('pdf');
                    }}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-center"
                  >
                    📄 Tải File PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowPopupSimulator(false);
                      handleExport('word');
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center"
                  >
                    📝 Tải File Word
                  </button>
                  <button
                    onClick={() => {
                      setShowPopupSimulator(false);
                      handleExport('md');
                    }}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center"
                  >
                    📜 Tải Markdown
                  </button>
                  <button
                    onClick={() => {
                      setShowPopupSimulator(false);
                      handleExport('html');
                    }}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-center"
                  >
                    🌐 Tải File HTML
                  </button>
                </div>

                <div className="text-[11px] text-center text-slate-400 pt-2 border-t border-slate-200">
                  Hỗ trợ 100% Google Gemini • Offline An Toàn
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
