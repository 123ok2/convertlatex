import React from 'react';
import { ShieldCheck, XCircle, CheckCircle2, WifiOff, Cpu, Lock } from 'lucide-react';

export const SecurityComparison: React.FC = () => {
  return (
    <section id="bao-mat" className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bảo Mật & Độ Tin Cậy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Khắc Phục Triệt Để Lỗi "Failed to fetch" & Bảo Mật Tuyệt Đối
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Tại sao tiện ích này là sự lựa chọn an toàn và ổn định số 1 cho học sinh, sinh viên và giảng viên?
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Competitors / Common Extensions */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-rose-200 shadow-xs relative">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Các tiện ích xuất thông thường trên mạng
                </h3>
                <span className="text-xs text-rose-600 font-semibold">
                  Phụ thuộc Server trung gian (Cloud relay)
                </span>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Thường xuyên gặp lỗi "Failed to fetch":</strong> Vì server của bên thứ 3 bị sập, quá tải hoặc chặn IP Việt Nam, khiến bạn không thể tải được bài luận.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Nguy cơ lộ dữ liệu riêng tư:</strong> Cuộc trò chuyện của bạn bị gửi về server của lập trình viên không rõ danh tính trước khi xuất file.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tốc độ chậm chạp:</strong> Phải đợi upload dữ liệu lên server, đợi chuyển đổi và tải xuống lại.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Chèn quảng cáo / Thu phí ngầm:</strong> Bắt trả phí theo tháng sau khi dùng được vài ngày.
                </span>
              </li>
            </ul>
          </div>

          {/* AI Study Exporter */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-emerald-500/80 shadow-md relative">
            <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
              Tiêu chuẩn bảo mật
            </div>

            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gemini Study Exporter
                </h3>
                <span className="text-xs text-emerald-600 font-semibold">
                  100% Client-Side Pure Processing (Offline)
                </span>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Không bao giờ gặp lỗi "Failed to fetch":</strong> Cơ chế xuất tài liệu dựa trên DOM & API in ấn của chính Chrome, không cần kết nối tới bất kỳ máy chủ nào.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Bảo mật riêng tư 100%:</strong> Dữ liệu không bao giờ rời khỏi máy tính của bạn. Hoàn toàn an tâm cho đề tài nghiên cứu khoa học, mã nguồn bí mật hay bài thi.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tải ngay lập tức (0.2 giây):</strong> Tạo file và tải về máy tính gần như tức thì, ngay cả khi mạng yếu hay mất mạng Internet.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mã nguồn mở miễn phí vĩnh viễn:</strong> Toàn bộ code được công khai trên GitHub, không quảng cáo, không theo dõi người dùng.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
