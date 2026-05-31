
import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Pen, Calculator, Check, Eraser, Keyboard, Grid3X3, Delete, Undo, Redo } from 'lucide-react';
import { Button } from './Button';
import { MarkdownPreview } from './MarkdownPreview';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: string) => void;
  isProcessing: boolean;
}

type Mode = 'draw' | 'type';

// --- CONSOLIDATED MATH, PHYSICS & CHEMISTRY SHORTCUTS ---
// Danh sách phân loại khoa học cho Giáo viên & Sinh viên
const CATEGORIZED_ITEMS = {
  basic: {
    name: "Số học & Đại số",
    items: [
      { label: "x/y", latex: "\\frac{#0}{#?}", desc: "Phân số" },
      { label: "x²", latex: "#0^{2}", desc: "Bình phương" },
      { label: "xⁿ", latex: "#0^{#?}", desc: "Mũ số" },
      { label: "xₙ", latex: "#0_{#?}", desc: "Chỉ số dưới" },
      { label: "√x", latex: "\\sqrt{#0}", desc: "Căn bậc 2" },
      { label: "ⁿ√x", latex: "\\sqrt[#?]{#0}", desc: "Căn bậc n" },
      { label: "|x|", latex: "\\left|#0\\right|", desc: "Trị tuyệt đối" },
      { label: "( )", latex: "\\left(#0\\right)", desc: "Ngoặc tròn" },
      { label: "[ ]", latex: "\\left[#0\\right]", desc: "Ngoặc vuông" },
      { label: "{ }", latex: "\\left\\{#0\\right\\}", desc: "Ngoặc nhọn" },
      { label: "+", latex: "+", desc: "Cộng" },
      { label: "-", latex: "-", desc: "Trừ" },
      { label: "×", latex: "\\times", desc: "Nhân" },
      { label: "÷", latex: "\\div", desc: "Chia" },
      { label: "=", latex: "=", desc: "Bằng" },
      { label: "≠", latex: "\\neq", desc: "Khác" },
      { label: "≈", latex: "\\approx", desc: "Xấp xỉ" },
      { label: "±", latex: "\\pm", desc: "Cộng trừ" },
      { label: "<", latex: "<", desc: "Nhỏ hơn" },
      { label: ">", latex: ">", desc: "Lớn hơn" },
      { label: "≤", latex: "\\leq", desc: "Nhỏ hơn hoặc bằng" },
      { label: "≥", latex: "\\geq", desc: "Lớn hơn hoặc bằng" },
      { label: "∞", latex: "\\infty", desc: "Vô cùng" },
      { label: "%", latex: "\\%", desc: "Phần trăm" },
      { label: "°C", latex: "^{\\circ}\\text{C}", desc: "Độ C" },
      { label: "π", latex: "\\pi", desc: "Số Pi" },
      { label: "Δ", latex: "\\Delta", desc: "Delta" },
      { label: "α", latex: "\\alpha", desc: "Alpha" },
      { label: "β", latex: "\\beta", desc: "Beta" },
    ]
  },
  calculus: {
    name: "Giải tích & Hình học",
    items: [
      { label: "lim", latex: "\\lim_{x \\to \\infty}", desc: "Giới hạn" },
      { label: "log", latex: "\\log_{#?}(#0)", desc: "Logarit" },
      { label: "ln", latex: "\\ln(#0)", desc: "Logarit tự nhiên" },
      { label: "sin", latex: "\\sin(#0)", desc: "Sin" },
      { label: "cos", latex: "\\cos(#0)", desc: "Cos" },
      { label: "tan", latex: "\\tan(#0)", desc: "Tan" },
      { label: "∫", latex: "\\int", desc: "Nguyên hàm" },
      { label: "∫ₐᵇ", latex: "\\int_{#?}^{#?}", desc: "Tích phân" },
      { label: "∑", latex: "\\sum_{#?}^{#?}", desc: "Tổng Sigma" },
      { label: "∂", latex: "\\partial", desc: "Đạo hàm riêng" },
      { label: "Matrix", latex: "\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}", desc: "Ma trận 2x2" },
      { label: "HePT", latex: "\\begin{cases} #? \\\\ #? \\end{cases}", desc: "Hệ phương trình" },
      { label: "v⃗", latex: "\\vec{#0}", desc: "Vector" },
      { label: "x̄", latex: "\\bar{#0}", desc: "Giá trị trung bình" },
      { label: "π", latex: "\\pi", desc: "Pi" },
    ]
  },
  logic_sets: {
    name: "Logic & Tập hợp",
    items: [
      { label: "∀", latex: "\\forall", desc: "Với mọi" },
      { label: "∃", latex: "\\exists", desc: "Tồn tại" },
      { label: "∈", latex: "\\in", desc: "Thuộc" },
      { label: "⊂", latex: "\\subset", desc: "Con của" },
      { label: "∪", latex: "\\cup", desc: "Hợp" },
      { label: "∩", latex: "\\cap", desc: "Giao" },
      { label: "R", latex: "\\mathbb{R}", desc: "Tập số thực ℝ" },
      { label: "⇒", latex: "\\Rightarrow", desc: "Suy ra" },
      { label: "⇔", latex: "\\Leftrightarrow", desc: "Tương đương" },
    ]
  },
  physics: {
    name: "Vật lý",
    items: [
      { label: "Δ", latex: "\\Delta", desc: "Delta (Độ biến thiên)" },
      { label: "Ω", latex: "\\Omega", desc: "Ohm (Điện trở)" },
      { label: "λ", latex: "\\lambda", desc: "Lambda (Bước sóng)" },
      { label: "μ", latex: "\\mu", desc: "Micro" },
      { label: "ω", latex: "\\omega", desc: "Tần số góc" },
      { label: "θ", latex: "\\theta", desc: "Góc Theta" },
      { label: "α", latex: "\\alpha", desc: "Alpha" },
      { label: "β", latex: "\\beta", desc: "Beta" },
      { label: "ρ", latex: "\\rho", desc: "Khối lượng riêng" },
      { label: "°", latex: "^\\circ", desc: "Độ" },
      { label: "Å", latex: "\\mathring{A}", desc: "Angstrom" },
      { label: "ℏ", latex: "\\hbar", desc: "Hằng số Planck" },
    ]
  },
  chemistry: {
    name: "Hóa học",
    items: [
      { label: "→", latex: "\\rightarrow", desc: "Mũi tên phản ứng" },
      { label: "⇌", latex: "\\rightleftharpoons", desc: "Phản ứng thuận nghịch" },
      { label: "→(xt)", latex: "\\xrightarrow[#?]{#?}", desc: "Phản ứng có xúc tác" },
      { label: "↑", latex: "\\uparrow", desc: "Bay hơi" },
      { label: "↓", latex: "\\downarrow", desc: "Kết tủa" },
      { label: "Isotop", latex: "_{#?}^{#?}\\text{#0}", desc: "Đồng vị (Z, A, X)" },
      { label: "Ion+", latex: "\\text{#0}^{#?+}", desc: "Cation" },
      { label: "Ion-", latex: "\\text{#0}^{#?-}", desc: "Anion" },
      { label: "—", latex: "-", desc: "Liên kết đơn" },
      { label: "═", latex: "=", desc: "Liên kết đôi" },
      { label: "≡", latex: "\\equiv", desc: "Liên kết ba" },
      { label: "Text", latex: "\\text{#0}", desc: "Văn bản thường" },
    ]
  }
};

const cleanLatexForPreview = (latex: string) => {
  if (!latex) return '';
  return latex
    .replace(/#\?/g, '\\square')
    .replace(/#\d/g, '{}')
    .replace(/#/g, '');
};

export const DrawingModal: React.FC<DrawingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  isProcessing 
}) => {
  const [mode, setMode] = useState<Mode>('type');
  const [activeTab, setActiveTab] = useState<keyof typeof CATEGORIZED_ITEMS>('basic');
  
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // MathLive State
  const mfRef = useRef<any>(null);
  const [latexValue, setLatexValue] = useState('');

  // Undo/Redo multi-step state
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const historyRef = useRef<string[]>(['']);
  const historyIndexRef = useRef<number>(0);

  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  const syncValueWithHistory = (newValue: string) => {
    setLatexValue(newValue);
    
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentHistory[currentIndex] === newValue) {
        return;
    }

    const nextHistory = currentHistory.slice(0, currentIndex + 1);
    nextHistory.push(newValue);
    
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    if (currentIndex > 0) {
        const nextIndex = currentIndex - 1;
        const previousValue = currentHistory[nextIndex];
        
        setHistoryIndex(nextIndex);
        setLatexValue(previousValue);
        
        // Apply to math-field element directly so its UI updates
        const mf = mfRef.current || document.querySelector('math-field');
        if (mf) {
            (mf as any).value = previousValue;
            if (typeof mf.focus === 'function') mf.focus();
        }
    }
  };

  const handleRedo = () => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    if (currentIndex < currentHistory.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextValue = currentHistory[nextIndex];
        
        setHistoryIndex(nextIndex);
        setLatexValue(nextValue);
        
        // Apply to math-field element directly so its UI updates
        const mf = mfRef.current || document.querySelector('math-field');
        if (mf) {
            (mf as any).value = nextValue;
            if (typeof mf.focus === 'function') mf.focus();
        }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initialVal = mfRef.current ? (mfRef.current.value || '') : '';
      setHistory([initialVal]);
      setHistoryIndex(0);
      setLatexValue(initialVal);
    }
  }, [isOpen]);

  // --- INITIALIZATION ---

  useEffect(() => {
    if (isOpen) {
      if (mode === 'draw') {
        const timer = setTimeout(() => initializeCanvas(), 50);
        return () => clearTimeout(timer);
      } else {
        // Focus MathField when switching to Type mode or opening
        const timer = setTimeout(() => {
            if (mfRef.current) {
                if (typeof mfRef.current.focus === 'function') {
                    mfRef.current.focus();
                }
                // Sync internal value to state if it exists
                setLatexValue(mfRef.current.value || '');
            }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, mode]);

  // Handle Resize for Canvas
  useEffect(() => {
    if (mode === 'draw') {
        window.addEventListener('resize', initializeCanvas);
        return () => window.removeEventListener('resize', initializeCanvas);
    }
  }, [mode]);

  // Handle MathLive Input
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf || mode !== 'type') return;

    const handleInput = (evt: any) => syncValueWithHistory(evt.target.value || '');
    const handleKeyDown = (evt: KeyboardEvent) => {
        if (evt.code === 'Space') {
            evt.preventDefault();
            handleSpace();
        }
    };

    mf.addEventListener('input', handleInput);
    mf.addEventListener('keydown', handleKeyDown as any);
    
    return () => {
        mf.removeEventListener('input', handleInput);
        mf.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [isOpen, mode]);

  // --- CANVAS LOGIC ---

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Resize only if dimensions mismatch to avoid clearing content
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;

        const context = canvas.getContext('2d');
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = 'black';
            context.lineWidth = 3;
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            setCtx(context);
        }
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    const { x, y } = getCoordinates(e);
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // --- SUBMISSION & MATH LOGIC ---
  const insertMath = (latex: string) => {
      const mf = mfRef.current || document.querySelector('math-field');
      if (mf) {
          if (typeof mf.focus === 'function') mf.focus();
          if (typeof (mf as any).insert === 'function') {
              (mf as any).insert(latex);
              syncValueWithHistory((mf as any).value || '');
          } else if (typeof (mf as any).executeCommand === 'function') {
              (mf as any).executeCommand(['insert', latex]);
              syncValueWithHistory((mf as any).value || '');
          } else {
              const currentVal = (mf as any).value || '';
              (mf as any).value = currentVal + latex;
              syncValueWithHistory((mf as any).value);
              const event = new Event('input', { bubbles: true });
              mf.dispatchEvent(event);
          }
      }
  };

  const toggleVirtualKeyboard = () => {
      const mf = mfRef.current || document.querySelector('math-field');
      if (mf) {
          if (typeof mf.focus === 'function') mf.focus();
          if (typeof (mf as any).executeCommand === 'function') {
              (mf as any).executeCommand('toggleVirtualKeyboard');
          }
      }
  };

  const handleSubmit = () => {
    if (mode === 'draw') {
        if (canvasRef.current) {
            const imageData = canvasRef.current.toDataURL('image/png');
            onSubmit(imageData);
        }
    } else {
        // Direct extraction from DOM for absolute reliability
        const mf = mfRef.current || document.querySelector('math-field');
        const value = mf ? (mf as any).value : latexValue;
        
        console.log('Submitting LaTeX:', value); // Debug log (internal)

        if (!value || !value.trim()) {
            onClose();
            return;
        }
        
        onSubmit("LATEX_RAW:" + value.trim());
    }
  };

  const handleSpace = () => {
      const mf = mfRef.current || document.querySelector('math-field');
      if (mf) {
          if (typeof mf.focus === 'function') mf.focus();
          if (typeof (mf as any).insert === 'function') {
              (mf as any).insert('~');
              syncValueWithHistory((mf as any).value || '');
          } else if (typeof (mf as any).executeCommand === 'function') {
              (mf as any).executeCommand(['insert', '~']); 
              syncValueWithHistory((mf as any).value || '');
          } else {
              const currentVal = (mf as any).value || '';
              (mf as any).value = currentVal + ' ';
              syncValueWithHistory((mf as any).value);
              const event = new Event('input', { bubbles: true });
              mf.dispatchEvent(event);
          }
      }
  };

  const handleBackspace = () => {
    const mf = mfRef.current || document.querySelector('math-field');
    if (mf) {
        if (typeof mf.focus === 'function') mf.focus();
        if (typeof (mf as any).executeCommand === 'function') {
            (mf as any).executeCommand('deleteBackward');
            syncValueWithHistory((mf as any).value || '');
        } else {
            const currentVal = (mf as any).value || '';
            if (currentVal.length > 0) {
                (mf as any).value = currentVal.slice(0, -1);
                syncValueWithHistory((mf as any).value);
                const event = new Event('input', { bubbles: true });
                mf.dispatchEvent(event);
            }
        }
    }
  };

  const clearMathField = () => {
    const mf = mfRef.current || document.querySelector('math-field');
    if (mf) {
        if (typeof mf.focus === 'function') mf.focus();
        (mf as any).value = "";
        syncValueWithHistory("");
    }
  };

  if (!isOpen) return null;

  return (
    // Increased max-width to 7xl and height to fit large screens better
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-[95vh] md:h-[90vh]">
        
        {/* Header & Tabs */}
        <div className="flex flex-col border-b border-slate-200 bg-slate-50 flex-none">
            <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" /> MathType Online (Toán - Lý - Hóa)
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 hover:bg-slate-100"><X className="w-6 h-6" /></button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative flex flex-col">
            
            {/* MODE: DRAW */}
            {mode === 'draw' && (
                <div className="flex-1 flex flex-col h-full">
                    <div className="relative w-full flex-1 shadow-inner rounded-lg overflow-hidden border border-slate-300 bg-white">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full cursor-crosshair touch-none block"
                            style={{ minHeight: '450px' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200 p-1">
                             <button 
                                onClick={clearCanvas}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Xóa tất cả"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">
                        Vẽ công thức vào khung trắng. Hệ thống sẽ tự động nhận diện và chuyển thành LaTeX.
                    </p>
                </div>
            )}

            {/* MODE: TYPE */}
            {mode === 'type' && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden h-full">
                    
                    {/* LEFT PANEL: SCIENTIFIC SYMBOLS GRID (col-span-1 md:col-span-5) */}
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 md:col-span-5 flex flex-col overflow-hidden h-full">
                        {/* Section Header & Scientific Tabs */}
                        <div className="flex flex-col gap-2 pb-2 mr-1 flex-none">
                            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                 <Grid3X3 className="w-4 h-4 text-indigo-600" />
                                 <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Ký hiệu khoa học</span>
                            </div>
                            
                            {/* Horizontal Tab List */}
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(Object.keys(CATEGORIZED_ITEMS) as Array<keyof typeof CATEGORIZED_ITEMS>).map((key) => {
                                    const category = CATEGORIZED_ITEMS[key];
                                    const isActive = activeTab === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => setActiveTab(key)}
                                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                                                isActive 
                                                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                                            }`}
                                        >
                                            {category.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Scrollable symbols */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-1 border-t border-slate-100 pt-3">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-1.5">
                                {CATEGORIZED_ITEMS[activeTab].items.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => insertMath(item.latex)}
                                        className="h-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-400 rounded-lg text-slate-800 hover:text-indigo-700 transition-all duration-150 active:scale-95 group relative cursor-pointer"
                                        title={item.desc}
                                    >
                                        <span className="font-serif text-[13px] font-bold tracking-wide leading-none">{item.label}</span>
                                        {/* Brief label hint */}
                                        <span className="text-[9px] text-slate-400 font-sans mt-0.5 max-w-[90%] truncate group-hover:text-indigo-500 transition-colors leading-none">
                                            {item.desc}
                                        </span>
                                        {/* Rich Tooltip on Hover */}
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                                            {item.desc} ({item.latex})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: FORMULA INPUT */}
                    <div className="md:col-span-7 flex flex-col gap-4 overflow-hidden h-full">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between flex-1 h-full">
                            <div className="flex justify-between items-center mb-2 flex-none">
                                <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
                                    <span>✍️</span> Khung soạn thảo công thức:
                                </span>
                            </div>
                            
                            <div className="border border-indigo-150 focus-within:border-indigo-500 rounded-xl overflow-hidden bg-slate-50 p-2 transition-all shadow-inner flex-1 flex items-center">
                                 {React.createElement('math-field', {
                                    ref: mfRef,
                                    'virtual-keyboard-mode': 'off',
                                    onInput: (evt: any) => {
                                        syncValueWithHistory(evt.target.value || '');
                                    },
                                    style: { 
                                        width: '100%', 
                                        display: 'block', 
                                        fontSize: '24px',
                                        padding: '12px 16px',
                                        minHeight: '120px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        outline: 'none'
                                    }
                                 })}
                             </div>

                             <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar flex-none animate-in fade-in">
                                <Button variant="ghost" type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleSpace} className="text-slate-600 hover:bg-slate-100 text-xs px-3.5 py-1.5 h-9 whitespace-nowrap bg-slate-50 border border-slate-200 cursor-pointer">
                                    Cách (Space)
                                </Button>
                                <Button variant="ghost" type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleBackspace} className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 text-xs px-3.5 py-1.5 h-9 whitespace-nowrap bg-slate-50 border border-slate-200 cursor-pointer">
                                    <Delete className="w-3.5 h-3.5 mr-1" /> Xóa 1 ký tự
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    type="button" 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={handleUndo} 
                                    disabled={historyIndex === 0}
                                    className={`text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs px-3.5 py-1.5 h-9 whitespace-nowrap bg-slate-50 border border-slate-200 cursor-pointer ${historyIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <Undo className="w-3.5 h-3.5 mr-1" /> Hoàn tác
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    type="button" 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={handleRedo} 
                                    disabled={historyIndex >= history.length - 1}
                                    className={`text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs px-3.5 py-1.5 h-9 whitespace-nowrap bg-slate-50 border border-slate-200 cursor-pointer ${historyIndex >= history.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <Redo className="w-3.5 h-3.5 mr-1" /> Làm lại
                                </Button>
                                <Button variant="ghost" type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearMathField} className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs px-3.5 py-1.5 h-9 whitespace-nowrap bg-slate-50 border border-slate-200 cursor-pointer">
                                    <Eraser className="w-3.5 h-3.5 mr-1" /> Xóa tất cả
                                </Button>
                             </div>
                        </div>

                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center flex-none">
           <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
             {mode === 'draw' ? (
                <>
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span>Sử dụng nhận diện (-1 Credit)</span>
                </>
             ) : (
                <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Chế độ Offline (Miễn phí)</span>
                </>
             )}
           </div>
           
           <div className="flex gap-3 ml-auto w-full sm:w-auto">
             <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="flex-1 sm:flex-none justify-center">
               Hủy
             </Button>
             <Button 
               variant="primary" 
               onClick={handleSubmit} 
               disabled={isProcessing}
               className="min-w-[150px] flex-1 sm:flex-none justify-center"
               
             >
               {isProcessing ? (
                  <>
                    <Calculator className="w-4 h-4 animate-spin mr-2" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    <span>{mode === 'draw' ? 'Dịch sang LaTeX' : 'Chèn công thức'}</span>
                  </>
                )}
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};
