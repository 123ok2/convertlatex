import React from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  List, 
  Sigma,
  Plus,
  Upload,
  Calculator,
  Copy,
  Printer,
  FileDown,
  Trash2
} from 'lucide-react';

interface ToolbarProps {
  onInsert: (textBefore: string, textAfter?: string) => void;
  onOpenDrawing: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCopyFormatted: () => Promise<void>;
  onPrint: () => Promise<void>;
  onExportWord: () => Promise<void>;
  onClear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onInsert,
  onOpenDrawing,
  onFileUpload,
  fileInputRef,
  onCopyFormatted,
  onPrint,
  onExportWord,
  onClear
}) => {
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-10 no-print select-none">
      <div className="flex items-center gap-0">
        {/* Nhóm Cột 1: TỆP */}
        <div className="flex flex-col items-center px-6 border-r border-slate-200">
          <div className="flex items-center gap-5 mt-1 mb-2.5">
            <button
              type="button"
              onClick={triggerFileInput}
              className="group p-1 text-slate-500 hover:text-indigo-600 transition-all rounded-md hover:bg-slate-50 active:scale-95 cursor-pointer"
              title="Tải tệp văn bản (.txt, .md)"
            >
              <Upload size={18} className="stroke-[2.2]" />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileUpload} 
                accept=".txt,.md,.markdown,text/plain" 
                className="hidden" 
              />
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none select-none">
            Tệp
          </span>
        </div>

        {/* Nhóm Cột 2: ĐỊNH DẠNG */}
        <div className="flex flex-col items-center px-6 border-r border-slate-200">
          <div className="flex items-center gap-5 mt-1 mb-2.5">
            <button
              type="button"
              onClick={() => onInsert('**', '**')}
              className="group p-1 text-slate-500 hover:text-indigo-600 transition-all rounded-md hover:bg-slate-50 active:scale-95 cursor-pointer font-bold text-[17px] leading-none"
              title="Chữ đậm"
            >
              <Bold size={17} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => onInsert('## ', '')}
              className="group p-1 text-slate-500 hover:text-indigo-600 transition-all rounded-md hover:bg-slate-50 active:scale-95 cursor-pointer font-semibold text-[17px] leading-none"
              title="Tiêu đề"
            >
              <span className="font-sans font-bold text-base -mt-[1px]">H</span>
            </button>
            <button
              type="button"
              onClick={() => onInsert('- ', '')}
              className="group p-1 text-slate-500 hover:text-indigo-600 transition-all rounded-md hover:bg-slate-50 active:scale-95 cursor-pointer"
              title="Danh sách"
            >
              <List size={18} className="stroke-[2.2]" />
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none select-none">
            Định dạng
          </span>
        </div>

        {/* Nhóm Cột 3: NHẬP LIỆU */}
        <div className="flex flex-col items-center px-6">
          <div className="flex items-center gap-5 mt-1 mb-2.5">
            <button
              type="button"
              onClick={onOpenDrawing}
              className="group p-1 text-slate-500 hover:text-indigo-600 transition-all rounded-md hover:bg-slate-50 active:scale-95 cursor-pointer"
              title="Vẽ tay / Bàn phím Toán"
            >
              <Calculator size={18} className="stroke-[2.2]" />
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none select-none">
            Nhập liệu
          </span>
        </div>
      </div>

      {/* Các hành động chính ở góc bên phải */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onCopyFormatted}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer active:scale-95"
          title="Sao chép chuẩn Word"
        >
          <Copy size={19} className="stroke-[2.0]" />
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer active:scale-95"
          title="In tài liệu"
        >
          <Printer size={19} className="stroke-[2.0]" />
        </button>
        <button
          type="button"
          onClick={onExportWord}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer active:scale-95"
          title="Tải file Word (.doc)"
        >
          <FileDown size={19} className="stroke-[2.0]" />
        </button>
        <button
          type="button"
          onClick={() => { if (confirm('Xóa toàn bộ nội dung?')) onClear(); }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer active:scale-95"
          title="Dọn dẹp"
        >
          <Trash2 size={19} className="stroke-[2.0]" />
        </button>
      </div>
    </div>
  );
};
