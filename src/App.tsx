import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  Plus, 
  Trash2, 
  Save 
} from 'lucide-react';

// Định nghĩa các kiểu dữ liệu cho Ma trận đề thi
interface MatrixRow {
  id: string;
  topic: string;
  knowledgeBlock: string;
  recognition: number; // Nhận biết
  comprehension: number; // Thông hiểu
  application: number; // Vận dụng
  highApplication: number; // Vận dụng cao
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | null;
}

export default function App() {
  // Khởi tạo trạng thái danh sách ma trận đề thi (Chương trình GDPT 2018)
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([
    { 
      id: '1', 
      topic: 'Chương 1: Chất có xung quanh ta', 
      knowledgeBlock: 'Khoa học tự nhiên', 
      recognition: 2, 
      comprehension: 1, 
      application: 0, 
      highApplication: 0 
    },
    { 
      id: '2', 
      topic: 'Chương 2: Lực và Chuyển động', 
      knowledgeBlock: 'Vật lí', 
      recognition: 1, 
      comprehension: 2, 
      application: 1, 
      highApplication: 0 
    }
  ]);

  const [credits, setCredits] = useState<number>(100);
  const [toast, setToast] = useState<ToastState>({ message: '', type: null });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Hàm hiển thị thông báo Toast nhanh
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    // Tự động đóng thông báo sau 3 giây không ảnh hưởng đến luồng xử lý chính
    setTimeout(() => {
      setToast(prev => prev.message === message ? { message: '', type: null } : prev);
    }, 3000);
  };

  // Hàm trừ credit giả định (kết nối cơ sở dữ liệu)
  const deductCredit = async (): Promise<boolean> => {
    if (credits <= 0) {
      showToast("❌ Tài khoản của bạn đã hết lượt credit để thực hiện xuất bản.", "error");
      return false;
    }
    // Thực hiện trừ điểm đồng bộ/bất đồng bộ nhanh không kèm delay chờ
    setCredits(prev => prev - 1);
    return true;
  };

  // Thêm dòng mới vào ma trận
  const handleAddRow = () => {
    const newRow: MatrixRow = {
      id: Date.now().toString(),
      topic: 'Chủ đề mới',
      knowledgeBlock: 'Chọn phân môn',
      recognition: 0,
      comprehension: 0,
      application: 0,
      highApplication: 0
    };
    setMatrixData([...matrixData, newRow]);
    showToast("🔹 Đã thêm một dòng chủ đề mới.", "info");
  };

  // Xóa dòng trong ma trận
  const handleDeleteRow = (id: string) => {
    setMatrixData(matrixData.filter(row => row.id !== id));
    showToast("🗑️ Đã xóa dòng khỏi ma trận.", "info");
  };

  // Cập nhật giá trị ô dữ liệu
  const handleUpdateValue = (id: string, field: keyof MatrixRow, value: string | number) => {
    setMatrixData(matrixData.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // Tính tổng số câu theo từng cấp độ nhận thức
  const getTotal = (field: 'recognition' | 'comprehension' | 'application' | 'highApplication') => {
    return matrixData.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  };

  // TỔNG HỢP HÀM EXPORT WORD TỐI ƯU - CHẠY NGAY LẬP TỨC
  const onExportWord = async () => {
    const previewEl = document.getElementById('markdown-preview-content');
    if (!previewEl) {
      showToast("❌ Không tìm thấy vùng dữ liệu hiển thị để xuất file.", "error");
      return;
    }

    try {
      // 1. Kiểm tra và trừ credit lập tức
      const hasCredit = await deductCredit();
      if (!hasCredit) return;

      // Đặt trạng thái xử lý ngắn hạn
      setIsExporting(true);

      // 2. Nhân bản DOM để xử lý và dọn dẹp các thẻ dư thừa
      const clone = previewEl.cloneNode(true) as HTMLElement;
      
      // Khử bỏ các cấu trúc hiển thị động của thư viện toán học (KaTeX/MathJax) nếu có
      clone.querySelectorAll('.katex-html').forEach(el => el.remove());
      clone.querySelectorAll('.katex-mathml').forEach(el => {
        const isBlock = el.closest('.katex-display') !== null;
        const style = (el as HTMLElement).style;
        style.display = isBlock ? 'block' : 'inline';
        style.clip = 'auto';
        style.height = 'auto';
        style.width = 'auto';
        style.overflow = 'visible';
        if (isBlock) {
          style.textAlign = 'center';
          style.margin = '12pt 0';
        }
      });

      // Xóa bỏ tất cả class của Tailwind CSS để tránh xung đột định dạng Word
      clone.querySelectorAll('[class]').forEach(el => {
        el.removeAttribute('class');
      });

      // Bổ sung thuộc tính thu gọn viền cho bảng dữ liệu
      clone.querySelectorAll('table').forEach(el => {
        (el as HTMLElement).style.borderCollapse = 'collapse';
        (el as HTMLElement).setAttribute('border', '1');
      });

      // 3. Xây dựng cấu trúc tài liệu Word XML/HTML đặc thù chuẩn Microsoft Office
      const fullHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <style>
            @page {
              size: 21cm 29.7cm;
              margin: 2cm 2cm 2cm 2cm;
            }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 13pt; 
              line-height: 1.4; 
              color: black; 
            }
            table { 
              border: 1px solid black; 
              border-collapse: collapse; 
              width: 100%; 
              margin: 12pt 0;
            }
            th { 
              border: 1px solid black; 
              padding: 6pt; 
              background-color: #f3f4f6;
              font-weight: bold;
              text-align: center;
            }
            td { 
              border: 1px solid black; 
              padding: 6pt; 
              vertical-align: middle;
            }
            h1, h2, h3 { 
              color: #1e40af; 
              font-weight: bold; 
              margin-top: 12pt;
              margin-bottom: 6pt;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          ${clone.innerHTML}
        </body>
        </html>
      `;

      // 4. Tạo Blob từ chuỗi dữ liệu kèm mã hóa UTF-8 BOM (\ufeff) giúp hiển thị tiếng Việt chuẩn xác
      const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // 5. Tạo thẻ neo ẩn và kích hoạt lệnh tải xuống ngay tức khắc
      const link = document.createElement('a');
      link.href = url;
      link.download = `MaTranDeThi_${Date.now()}.doc`;
      document.body.appendChild(link);
      link.click();
      
      // Giải phóng tài nguyên ngay lập tức sau khi hoàn tất lệnh click
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Hiển thị trạng thái thành công lập tức
      showToast("📁 Đã kết xuất và tải file Word thành công!", "success");
    } catch (error) {
      console.error('Export Word error:', error);
      showToast("❌ Gặp lỗi hệ thống trong quá trình kết xuất Word.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">
      {/* Thanh thông báo Toast */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header điều hướng ứng dụng */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-blue-600" /> Hệ thống Xây dựng Ma trận Đề kiểm tra
          </h1>
          <p className="text-sm text-gray-500 mt-1">Áp dụng chuẩn hóa theo chương trình Giáo dục phổ thông 2018</p>
        </div>
        
        <div className="flex items-center gap-4 self-start md:self-center">
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-sm">
            Tài khoản: <span className="font-bold text-blue-700">{credits}</span> Credits
          </div>
          <button
            onClick={onExportWord}
            disabled={isExporting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download size={18} />
            {isExporting ? "Đang xuất..." : "Xuất File Word Ngay"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Khối chỉnh sửa ma trận dữ liệu trực quan */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Cấu trúc dữ liệu đầu vào</h2>
            <button 
              onClick={handleAddRow}
              className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={16} /> Thêm chủ đề
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600">
                  <th className="p-3">Nội dung/Chủ đề</th>
                  <th className="p-3 w-20 text-center">Nhận biết</th>
                  <th className="p-3 w-20 text-center">Thông hiểu</th>
                  <th className="p-3 w-20 text-center">Vận dụng</th>
                  <th className="p-3 w-20 text-center">VD Cao</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {matrixData.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={row.topic}
                        onChange={(e) => handleUpdateValue(row.id, 'topic', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 p-0.5 text-gray-800 font-medium"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        value={row.recognition}
                        onChange={(e) => handleUpdateValue(row.id, 'recognition', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded text-center p-1"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        value={row.comprehension}
                        onChange={(e) => handleUpdateValue(row.id, 'comprehension', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded text-center p-1"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        value={row.application}
                        onChange={(e) => handleUpdateValue(row.id, 'application', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded text-center p-1"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        value={row.highApplication}
                        onChange={(e) => handleUpdateValue(row.id, 'highApplication', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded text-center p-1"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bản xem trước văn bản phục vụ trích xuất sang Word */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
            <FileText size={18} className="text-blue-600" />
            <span>Bản xem trước tài liệu xuất bản</span>
          </div>

          <div 
            id="markdown-preview-content" 
            className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex-1 text-sm overflow-y-auto max-h-[500px]"
          >
            <div className="text-center font-bold text-base mb-2 uppercase">
              MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ
            </div>
            <div className="text-center font-medium italic mb-6">
              Môn học: Khoa học tự nhiên / Vật lí (Chương trình phổ thông 2018)
            </div>

            <table className="w-full border-collapse border border-black text-xs my-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 font-bold text-center" style={{ width: '40%' }}>Nội dung đơn vị kiến thức</th>
                  <th className="border border-black p-2 font-bold text-center">Nhận biết</th>
                  <th className="border border-black p-2 font-bold text-center">Thông hiểu</th>
                  <th className="border border-black p-2 font-bold text-center">Vận dụng</th>
                  <th className="border border-black p-2 font-bold text-center">VD Cao</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-black p-2">{row.topic}</td>
                    <td className="border border-black p-2 text-center font-medium">{row.recognition} cẩu</td>
                    <td className="border border-black p-2 text-center font-medium">{row.comprehension} câu</td>
                    <td className="border border-black p-2 text-center font-medium">{row.application} câu</td>
                    <td className="border border-black p-2 text-center font-medium">{row.highApplication} câu</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-black p-2 text-center">Tổng số câu hỏi</td>
                  <td className="border border-black p-2 text-center text-blue-700">{getTotal('recognition')}</td>
                  <td className="border border-black p-2 text-center text-blue-700">{getTotal('comprehension')}</td>
                  <td className="border border-black p-2 text-center text-blue-700">{getTotal('application')}</td>
                  <td className="border border-black p-2 text-center text-blue-700">{getTotal('highApplication')}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 text-xs text-gray-500 italic">
              * Lưu ý: Số câu hỏi được phân bổ đồng đều dựa trên khung chương trình và cấu trúc phân phối năng lực của học sinh.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
