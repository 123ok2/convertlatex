import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  FolderCheck, 
  Layers, 
  ExternalLink, 
  AlertTriangle, 
  HelpCircle, 
  Pin, 
  ToggleRight, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BrowserType } from '../types';
import { BROWSER_DATA, DIRECT_ZIP_URL, INSTALL_STEPS } from '../data/guideData';

export const InstallSteps: React.FC = () => {
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>('chrome');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const activeBrowser = BROWSER_DATA[selectedBrowser];

  const handleCopyBrowserUrl = () => {
    navigator.clipboard.writeText(activeBrowser.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <section id="huong-dan-cai-dat" className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Quy Trình Cài Đặt Siêu Nhanh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Hướng Dẫn Cài Đặt Vào Trình Duyệt (Chỉ Mất 1 Phút)
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Tiện ích hỗ trợ tất cả trình duyệt nhân Chromium như Chrome, Edge, Cốc Cốc, Brave. Hãy chọn trình duyệt bạn đang sử dụng:
          </p>

          {/* Browser Selection Tabs */}
          <div className="mt-6 inline-flex p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto">
            {(Object.keys(BROWSER_DATA) as BrowserType[]).map((key) => {
              const b = BROWSER_DATA[key];
              const isActive = selectedBrowser === key;
              return (
                <button
                  key={key}
                  id={`browser-tab-${key}`}
                  onClick={() => setSelectedBrowser(key)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick URL helper banner for the selected browser */}
        <div className="mb-10 max-w-3xl mx-auto p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              URL
            </div>
            <div>
              <p className="text-xs text-blue-900 font-semibold">
                Đường dẫn trang tiện ích trên {activeBrowser.name}:
              </p>
              <code className="text-xs sm:text-sm font-mono text-blue-700 font-bold">
                {activeBrowser.url}
              </code>
            </div>
          </div>
          <button
            id="copy-active-browser-url-btn"
            onClick={handleCopyBrowserUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors shrink-0"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép đường dẫn</span>
              </>
            )}
          </button>
        </div>

        {/* Steps Grid */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 transition-all hover:border-slate-300">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                1
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Tải về và Giải nén file Extension
                  </h3>
                  <a
                    id="step1-download-btn"
                    href={DIRECT_ZIP_URL}
                    download="extentiongemini.zip"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file ZIP (55 KB)</span>
                  </a>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Bấm nút tải file <code className="bg-slate-200 px-1 py-0.5 rounded text-xs text-slate-800">extentiongemini.zip</code> về máy. Click chuột phải vào file và chọn <strong>"Extract All..."</strong> (hoặc giải nén bằng WinRAR/7-Zip).
                </p>

                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Lưu ý thư mục sau khi giải nén:</strong> Bạn sẽ thấy thư mục <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">extentiongemini-main</code>. Bên trong thư mục này phải có chứa file <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">manifest.json</code>. Hãy để thư mục này ở vị trí cố định (ví dụ trong ổ D: hoặc thư mục Documents).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 transition-all hover:border-slate-300">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                2
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Mở trang Quản lý Tiện ích của {activeBrowser.name}
                  </h3>
                  <button
                    id="step2-copy-url-btn"
                    onClick={handleCopyBrowserUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sao chép {activeBrowser.url}</span>
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Mở một tab mới trên trình duyệt, dán đường dẫn <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-blue-700">{activeBrowser.url}</code> vào thanh địa chỉ rồi nhấn <kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-xs shadow-xs font-mono">Enter</kbd>.
                </p>
                <div className="mt-2 text-xs text-slate-500 italic">
                  * Hoặc bấm vào biểu tượng 3 chấm ở góc trên phải trình duyệt &rarr; Tiện ích mở rộng &rarr; Quản lý tiện ích.
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 transition-all hover:border-slate-300">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Bật "Chế độ dành cho nhà phát triển" (Developer mode)
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {activeBrowser.devModeGuide}.
                </p>

                {/* Visual mockup of the Developer Mode toggle */}
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ToggleRight className="w-5 h-5 text-blue-600" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      Chế độ dành cho nhà phát triển (Developer mode)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    <span>BẬT (ON)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 transition-all hover:border-slate-300">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Nhấn "{activeBrowser.unpackedBtnText}"
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Sau khi bật Developer Mode, ở góc trên bên trái sẽ hiện các nút chức năng. Hãy nhấn nút <strong>"{activeBrowser.unpackedBtnText}"</strong> và chọn đúng thư mục <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">extentiongemini-main</code> mà bạn đã giải nén ở Bước 1.
                </p>

                {/* Visual confirmation card */}
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-emerald-950">
                    <strong className="font-semibold block">Cài đặt thành công!</strong>
                    Tiện ích <strong>"Gemini Study Exporter"</strong> phiên bản 2.6.0 sẽ xuất hiện ngay trong danh sách tiện ích của bạn.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 transition-all hover:border-slate-300">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                5
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Ghim Tiện Ích & Truy cập Google Gemini
                  </h3>
                  <div className="flex items-center gap-2">
                    <a
                      id="step5-open-gemini-btn"
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                    >
                      <span>Mở Google Gemini</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Nhấn vào biểu tượng mảnh ghép xếp hình 🧩 ở góc trên bên phải trình duyệt &rarr; tìm <strong>Gemini Study Exporter</strong> và bấm biểu tượng chiếc <strong>Ghim (Pin)</strong> để luôn hiển thị icon tiện ích trên thanh công cụ.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  💡 <em>Mẹo: Nếu bạn đang mở sẵn tab Gemini, hãy nhấn F5 để làm mới trang. Bạn sẽ thấy thanh công cụ nổi "⚡ Tải Tất Cả" xuất hiện ngay ở góc dưới bên phải màn hình!</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
