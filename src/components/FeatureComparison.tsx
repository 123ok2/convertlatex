import React from 'react';
import { FileText, Check, FileDown, BookOpen, Layers } from 'lucide-react';
import { FORMAT_DETAILS } from '../data/guideData';

export const FeatureComparison: React.FC = () => {
  return (
    <section id="dinh-dang-xuat" className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đa Dạng Mục Đích Sử Dụng</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            So Sánh 4 Định Dạng Xuất Tài Liệu Phổ Biến
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Tiện ích hỗ trợ xuất tài liệu thành 4 chuẩn tệp tin khác nhau, phục vụ tối đa nhu cầu nộp bài, in ấn, nghiên cứu hoặc tích hợp vào hệ thống ghi chú cá nhân.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FORMAT_DETAILS.map((item) => (
            <div
              key={item.format}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div>
                <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-md mb-4 ${item.color}`}>
                  {item.name}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  {item.badge}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Thích hợp nhất khi:
                </span>
                <p className="text-xs font-medium text-slate-700 leading-normal">
                  {item.bestFor}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Math & Table Preservation Highlights */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-lg">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full mb-3">
              Tính Năng Độc Quyền
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">
              Bảo Toàn Tuyệt Đối Ký Hiệu Khoa Học & Công Thức Toán Học
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Khác với việc chụp màn hình (bị mờ và không thể sao chép chữ) hoặc bôi đen copy thông thường (làm vỡ công thức thành các ký tự rác vô nghĩa), tiện ích bóc tách trực tiếp cây phân tích DOM của MathJax, KaTeX và TeX:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="font-bold text-cyan-300 block mb-1">Toán & Vật Lý Cao Cấp</span>
                <p className="text-slate-300 text-[11px]">
                  Tích phân bội, vi phân, giới hạn, căn thức phân số bậc cao, ma trận chuyển vị.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="font-bold text-indigo-300 block mb-1">Hóa Học & Phương Trình</span>
                <p className="text-slate-300 text-[11px]">
                  Chỉ số trên dưới (H₂O, SO₄²⁻), mũi tên cân bằng hóa học và ký hiệu nguyên tử.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1">Bảng & Khối Code</span>
                <p className="text-slate-300 text-[11px]">
                  Bảng dữ liệu hàng cột thẳng thớm, khối code Python, C++, Java thụt lề chuẩn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
