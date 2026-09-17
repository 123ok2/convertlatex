import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, Check, Copy } from 'lucide-react';
import { FAQ_LIST } from '../data/guideData';

export const FaqSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-3']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFaqs = FAQ_LIST.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="faq" className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Giải Đáp Thắc Mắc</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Câu Hỏi Thường Gặp & Xử Lý Sự Cố
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Tổng hợp câu trả lời chi tiết cho những vướng mắc phổ biến nhất khi cài đặt và sử dụng tiện ích.
          </p>

          {/* Search box */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi (ví dụ: lỗi manifest, PDF, cập nhật)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              const isCopied = copiedId === faq.id;

              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-colors"
                >
                  <button
                    id={`faq-btn-${faq.id}`}
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white/60">
                      <p className="pt-3">{faq.answer}</p>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleCopyAnswer(faq.id, faq.answer)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Đã chép câu trả lời</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Sao chép câu trả lời</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
              Không tìm thấy câu hỏi nào phù hợp với từ khóa "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
