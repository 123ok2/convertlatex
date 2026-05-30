
import React from 'react';
import { 
  Bold, Italic, Heading, List, Code, Sigma, 
  Mic, Calculator, Upload, 
  Eye, Sparkles, Loader2, Copy, Printer, FileDown, Trash2, FileText, Plus
} from 'lucide-react';
import { Button } from './Button';

interface ToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onOpenDrawing: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCopyFormatted: () => void;
  onPrint: () => void;
  onExportWord: () => void;
  onClear: () => void;
  onOptimize: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onInsert,
  onOpenDrawing,
  onFileUpload,
  fileInputRef,
  onCopyFormatted,
  onPrint,
  onExportWord,
  onClear,
  onOptimize
}) => {
  
  // Fix: Set children to optional to resolve Property 'children' is missing error in strict environments
  const ToolGroup = ({ children, label }: { children?: React.ReactNode, label?: string }) => (
    <div className="flex flex-col gap-1 px-3 first:pl-0 border-r border-slate-200 last:border-0">
      <div className="flex items-center gap-1">{children}</div>
      {label && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">{label}</span>}
    </div>
  );

  const ToolButton = ({ onClick, icon, title, active = false, danger = false }: any) => (
    <button 
      onClick={onClick} 
      className={`p-2 rounded-lg transition-all ${
        active 
          ? 'bg-indigo-600 text-white' 
          : danger 
            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
            : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
      }`}
      title={title}
    >
      {React.cloneElement(icon, { size: 18 })}
    </button>
  );

  return (
    <div className="h-20 glass border-b border-slate-200 flex items-center px-6 justify-between shadow-sm z-30 no-print flex-shrink-0">
      
      <div className="flex items-center">
        {/* Tác vụ file */}
        <ToolGroup label="Tệp">
           <ToolButton onClick={onClear} icon={<Plus />} title="Tạo mới" />
           <input type="file" ref={fileInputRef} onChange={onFileUpload} className="hidden" accept=".txt,.md" />
           <ToolButton onClick={() => fileInputRef.current?.click()} icon={<Upload />} title="Mở tệp" />
        </ToolGroup>

        {/* Định dạng nhanh */}
        <ToolGroup label="Định dạng">
          <ToolButton onClick={() => onInsert('**', '**')} icon={<Bold />} title="In đậm" />
          <ToolButton onClick={() => onInsert('*', '*')} icon={<Italic />} title="In nghiêng" />
          <ToolButton onClick={() => onInsert('### ')} icon={<Heading />} title="Tiêu đề" />
          <ToolButton onClick={() => onInsert('- ')} icon={<List />} title="Danh sách" />
          <ToolButton onClick={() => onInsert('$$ ', ' $$')} icon={<Sigma />} title="Công thức Toán" />
        </ToolGroup>

        {/* Công cụ nhập liệu */}
        <ToolGroup label="Nhập liệu">
          <ToolButton onClick={onOpenDrawing} icon={<Calculator />} title="MathType Online" />
          <ToolButton onClick={onOptimize} icon={<Sparkles />} title="Tối ưu Toán học (Offline)" />
        </ToolGroup>
      </div>

      <div className="flex items-center gap-3">
        {/* Nhóm Xuất bản */}
        <div className="flex items-center gap-1">
          <ToolButton onClick={onCopyFormatted} icon={<Copy />} title="Sao chép (-1 Credit)" />
          <ToolButton onClick={onPrint} icon={<Printer />} title="In PDF (-1 Credit)" />
          <ToolButton onClick={onExportWord} icon={<FileDown />} title="Tải Word (-1 Credit)" />
          <ToolButton onClick={onClear} icon={<Trash2 />} title="Xóa tất cả" danger />
        </div>
      </div>

    </div>
  );
};
