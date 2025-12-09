import React from 'react';
import { 
  Bold, Italic, Heading, List, Code, Sigma, 
  Mic, MicOff, PenTool, Upload, 
  Eye, Sparkles, Loader2, Copy, Printer, Download, Trash2
} from 'lucide-react';
import { Button } from './Button';

interface ToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onVoiceInput: () => void;
  isListening: boolean;
  onOpenDrawing: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onManualPreview: () => void;
  onAIEnhance: () => void;
  isAiProcessing: boolean;
  isDeducting: boolean;
  onCopyFormatted: () => void;
  onPrint: () => void;
  onExportWord: () => void;
  onClear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onInsert,
  onVoiceInput,
  isListening,
  onOpenDrawing,
  onFileUpload,
  fileInputRef,
  onManualPreview,
  onAIEnhance,
  isAiProcessing,
  isDeducting,
  onCopyFormatted,
  onPrint,
  onExportWord,
  onClear
}) => {
  
  const IconButton = ({ onClick, icon, title, active = false, className = '' }: any) => (
    <button 
      onClick={onClick} 
      className={`p-2 rounded-md transition-all hover:shadow-sm ${
        active 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-slate-600 hover:bg-white hover:text-indigo-600'
      } ${className}`}
      title={title}
    >
      {icon}
    </button>
  );

  const Separator = () => <div className="w-px h-5 bg-slate-200 mx-1 self-center"></div>;

  return (
    <div className="h-14 bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 flex items-center px-4 justify-between gap-4 shadow-sm z-10 overflow-x-auto no-scrollbar no-print">
      
      {/* Group 1: Formatting Tools */}
      <div className="flex items-center gap-1 bg-white/50 p-1 rounded-lg border border-slate-100 shadow-sm flex-shrink-0">
        <IconButton onClick={() => onInsert('**', '**')} icon={<Bold className="w-4 h-4" />} title="In đậm" />
        <IconButton onClick={() => onInsert('*', '*')} icon={<Italic className="w-4 h-4" />} title="In nghiêng" />
        <Separator />
        <IconButton onClick={() => onInsert('### ')} icon={<Heading className="w-4 h-4" />} title="Tiêu đề (H3)" />
        <IconButton onClick={() => onInsert('- ')} icon={<List className="w-4 h-4" />} title="Danh sách" />
        <Separator />
        <IconButton onClick={() => onInsert('```\n', '\n```')} icon={<Code className="w-4 h-4" />} title="Chèn Code" />
        <IconButton onClick={() => onInsert('$$ ', ' $$')} icon={<Sigma className="w-4 h-4" />} title="Công thức Toán (Block)" />
      </div>

      {/* Group 2: Input Methods */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <IconButton 
          onClick={onVoiceInput} 
          active={isListening}
          icon={isListening ? <MicOff className="w-4 h-4 animate-pulse text-red-500" /> : <Mic className="w-4 h-4" />} 
          title={isListening ? "Dừng ghi âm" : "Nhập bằng giọng nói"} 
        />
        <IconButton onClick={onOpenDrawing} icon={<PenTool className="w-4 h-4" />} title="Vẽ công thức (-1 Credit)" />
        
        <div className="relative">
          <input 
             type="file" 
             ref={fileInputRef}
             onChange={onFileUpload}
             className="hidden" 
             accept=".txt,.md"
          />
          <IconButton onClick={() => fileInputRef.current?.click()} icon={<Upload className="w-4 h-4" />} title="Tải file lên (.txt, .md)" />
        </div>
      </div>

      <Separator />

      {/* Group 3: Core Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button 
            variant="secondary" 
            onClick={onManualPreview}
            className="!py-1.5 !px-3 text-sm font-medium border-slate-200 text-slate-700 hover:text-indigo-600"
            title="Ctrl + Enter"
        >
            <Eye className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Xem trước</span>
        </Button>

        <Button 
          variant="primary"
          onClick={onAIEnhance}
          disabled={isAiProcessing || isDeducting}
          className="!py-1.5 !px-3 text-sm font-medium shadow-indigo-200"
          title="Tự động sửa lỗi & Format đẹp (-1 Credit)"
        >
          {isAiProcessing ? (
            <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Tối ưu hóa</span>
        </Button>
      </div>

      <Separator />

      {/* Group 4: Export Tools */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton onClick={onCopyFormatted} icon={<Copy className="w-4 h-4" />} title="Sao chép định dạng (Word/Email)" />
        <IconButton onClick={onPrint} icon={<Printer className="w-4 h-4" />} title="In / Xuất PDF" />
        <IconButton onClick={onExportWord} icon={<Download className="w-4 h-4" />} title="Tải file Word (.doc)" />
        <Separator />
        <IconButton 
          onClick={onClear} 
          icon={<Trash2 className="w-4 h-4" />} 
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          title="Xóa toàn bộ" 
        />
      </div>
    </div>
  );
};