import React, { useState } from 'react';
import { CheckCircle2, Circle, Sparkles, PartyPopper } from 'lucide-react';

export const ChecklistTracker: React.FC = () => {
  const [completed, setCompleted] = useState<number[]>([1]);

  const steps = [
    { id: 1, text: 'Đã tải file extentiongemini.zip về máy tính và giải nén' },
    { id: 2, text: 'Đã mở trang tiện ích trình duyệt và gạt nút Developer Mode (BẬT)' },
    { id: 3, text: 'Đã bấm "Tải tiện ích đã giải nén" và chọn thư mục extentiongemini-main' },
    { id: 4, text: 'Đã vào gemini.google.com và thấy thanh công cụ "⚡ Tải Tất Cả"' },
  ];

  const toggleStep = (id: number) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const progressPercent = Math.round((completed.length / steps.length) * 100);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Bảng Kiểm Tra Tiến Độ (Dành Cho Người Mới)
          </h3>
        </div>
        <div className="text-xs font-semibold text-slate-600">
          Tiến độ: <span className="text-blue-600 font-bold">{progressPercent}%</span> ({completed.length}/{steps.length} bước)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step items */}
      <div className="space-y-2 pt-1">
        {steps.map((s) => {
          const isDone = completed.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleStep(s.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition-colors ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={isDone ? 'line-through opacity-80' : ''}>
                {s.text}
              </span>
            </button>
          );
        })}
      </div>

      {progressPercent === 100 && (
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 animate-bounce-short">
          <PartyPopper className="w-4 h-4 text-emerald-700" />
          <span>Tuyệt vời! Bạn đã cài đặt thành công và sẵn sàng xuất tài liệu trên Google Gemini!</span>
        </div>
      )}
    </div>
  );
};
