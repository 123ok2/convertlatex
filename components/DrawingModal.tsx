
import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Pen, Calculator, Check, Eraser, Keyboard, Grid3X3 } from 'lucide-react';
import { Button } from './Button';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: string) => void;
  isProcessing: boolean;
}

type Mode = 'draw' | 'type';

// --- CONSOLIDATED MATH, PHYSICS & CHEMISTRY SHORTCUTS ---
// Danh sách tổng hợp toàn diện cho Giáo viên & Sinh viên
const ALL_MATH_ITEMS = [
  // --- CẤU TRÚC CƠ BẢN ---
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

  // --- ĐẠI SỐ & GIẢI TÍCH ---
  { label: "+", latex: "+", desc: "Cộng" },
  { label: "-", latex: "-", desc: "Trừ" },
  { label: "×", latex: "\\times", desc: "Nhân" },
  { label: "÷", latex: "\\div", desc: "Chia" },
  { label: "=", latex: "=", desc: "Bằng" },
  { label: "≠", latex: "\\neq", desc: "Khác" },
  { label: "≈", latex: "\\approx", desc: "Xấp xỉ" },
  { label: "±", latex: "\\pm", desc: "Cộng trừ" },
  { label: "∞", latex: "\\infty", desc: "Vô cực" },
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

  // --- VẬT LÝ ---
  { label: "Δ", latex: "\\Delta", desc: "Delta (Độ biến thiên)" },
  { label: "Ω", latex: "\\Omega", desc: "Ohm (Điện trở)" },
  { label: "λ", latex: "\\lambda", desc: "Lambda (Bước sóng)" },
  { label: "μ", latex: "\\mu", desc: "Micro / Hệ số ma sát" },
  { label: "π", latex: "\\pi", desc: "Pi" },
  { label: "ω", latex: "\\omega", desc: "Tần số góc" },
  { label: "θ", latex: "\\theta", desc: "Góc Theta" },
  { label: "α", latex: "\\alpha", desc: "Alpha" },
  { label: "β", latex: "\\beta", desc: "Beta" },
  { label: "ρ", latex: "\\rho", desc: "Khối lượng riêng" },
  { label: "°", latex: "^\\circ", desc: "Độ (Góc/Nhiệt độ)" },
  { label: "Å", latex: "\\mathring{A}", desc: "Angstrom" },
  { label: "ℏ", latex: "\\hbar", desc: "Hằng số Planck" },
  { label: "v⃗", latex: "\\vec{#0}", desc: "Vector" },
  { label: "x̄", latex: "\\bar{#0}", desc: "Giá trị trung bình" },

  // --- HÓA HỌC ---
  { label: "→", latex: "\\rightarrow", desc: "Mũi tên phản ứng" },
  { label: "⇌", latex: "\\rightleftharpoons", desc: "Phản ứng thuận nghịch" },
  { label: "→(xt)", latex: "\\xrightarrow[#?]{#?}", desc: "Phản ứng có điều kiện/xúc tác" },
  { label: "↑", latex: "\\uparrow", desc: "Bay hơi" },
  { label: "↓", latex: "\\downarrow", desc: "Kết tủa" },
  { label: "Isotop", latex: "_{#?}^{#?}\\text{#0}", desc: "Đồng vị (Z, A, X)" },
  { label: "Ion+", latex: "\\text{#0}^{#?+}", desc: "Cation" },
  { label: "Ion-", latex: "\\text{#0}^{#?-}", desc: "Anion" },
  { label: "—", latex: "-", desc: "Liên kết đơn" },
  { label: "═", latex: "=", desc: "Liên kết đôi" },
  { label: "≡", latex: "\\equiv", desc: "Liên kết ba" },
  { label: "Text", latex: "\\text{#0}", desc: "Nhập văn bản thường" },

  // --- LOGIC & TẬP HỢP ---
  { label: "∀", latex: "\\forall", desc: "Với mọi" },
  { label: "∃", latex: "\\exists", desc: "Tồn tại" },
  { label: "∈", latex: "\\in", desc: "Thuộc" },
  { label: "⊂", latex: "\\subset", desc: "Con của" },
  { label: "∪", latex: "\\cup", desc: "Hợp" },
  { label: "∩", latex: "\\cap", desc: "Giao" },
  { label: "R", latex: "\\mathbb{R}", desc: "Số thực" },
  { label: "⇒", latex: "\\Rightarrow", desc: "Suy ra" },
  { label: "⇔", latex: "\\Leftrightarrow", desc: "Tương đương" },
];

export const DrawingModal: React.FC<DrawingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  isProcessing 
}) => {
  const [mode, setMode] = useState<Mode>('draw');
  
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // MathLive State
  const mfRef = useRef<any>(null);
  const [latexValue, setLatexValue] = useState('');

  // --- INITIALIZATION ---

  useEffect(() => {
    if (isOpen) {
      if (mode === 'draw') {
        const timer = setTimeout(() => initializeCanvas(), 50);
        return () => clearTimeout(timer);
      } else {
        // Focus MathField when switching to Type mode
        setTimeout(() => {
            if (mfRef.current) {
                mfRef.current.focus();
            }
        }, 100);
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

    const handleInput = (evt: any) => setLatexValue(evt.target.value);
    mf.addEventListener('input', handleInput);
    return () => mf.removeEventListener('input', handleInput);
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
      if (mfRef.current) {
          // #0 is selection, #? is placeholder
          // executeCommand performs the insertion and handles cursor placement
          mfRef.current.executeCommand('insert', latex);
          mfRef.current.focus();
      }
  };

  const toggleVirtualKeyboard = () => {
      if (mfRef.current) {
          mfRef.current.executeCommand('toggleVirtualKeyboard');
          mfRef.current.focus();
      }
  };

  const handleSubmit = () => {
    if (mode === 'draw') {
        if (canvasRef.current) {
            const imageData = canvasRef.current.toDataURL('image/png');
            onSubmit(imageData); // Send base64 image
        }
    } else {
        if (!latexValue.trim()) {
            onClose();
            return;
        }
        onSubmit("LATEX_RAW:" + latexValue); // Send raw LaTeX with prefix
    }
  };

  const clearMathField = () => {
      if (mfRef.current) {
          mfRef.current.value = '';
          setLatexValue('');
          mfRef.current.focus();
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
                    Công cụ nhập liệu (Toán - Lý - Hóa)
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 hover:bg-slate-100"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex px-4 gap-2">
                <button 
                    onClick={() => setMode('draw')}
                    className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${mode === 'draw' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                >
                    <Pen className="w-4 h-4" /> Vẽ tay
                </button>
                <button 
                    onClick={() => setMode('type')}
                    className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${mode === 'type' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                >
                    <Calculator className="w-4 h-4" /> Bàn phím (MathType)
                </button>
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
                <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                    
                    {/* INPUT FIELD AREA - Fixed height at top */}
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex-none flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hiển thị kết quả:</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={toggleVirtualKeyboard} className="text-indigo-600 hover:bg-indigo-50 text-xs px-2 py-1 h-7">
                                    <Keyboard className="w-3 h-3 mr-1" /> Bàn phím ảo
                                </Button>
                                <Button variant="ghost" onClick={clearMathField} className="text-red-500 hover:text-red-600 text-xs px-2 py-1 h-7">
                                    <Eraser className="w-3 h-3 mr-1" /> Xóa
                                </Button>
                            </div>
                        </div>
                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-inner">
                             {React.createElement('math-field', {
                                ref: mfRef,
                                'virtual-keyboard-mode': 'manual', // Only show when requested
                                style: { 
                                    width: '100%', 
                                    display: 'block', 
                                    fontSize: '32px', // Larger font
                                    padding: '20px',
                                    minHeight: '80px',
                                    backgroundColor: 'white'
                                }
                            }, latexValue)}
                        </div>
                    </div>

                    {/* EXPANDED SHORTCUTS GRID - Scrollable area */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                             <Grid3X3 className="w-4 h-4 text-indigo-600" />
                             <span className="text-sm font-bold text-slate-700">Ký hiệu nhanh (Toán - Lý - Hóa)</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                                {ALL_MATH_ITEMS.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => insertMath(item.latex)}
                                        className="h-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-lg text-slate-800 hover:text-indigo-700 transition-all active:scale-95 group relative"
                                        title={item.desc}
                                    >
                                        <span className="font-serif text-lg leading-none">{item.label}</span>
                                        {/* Tooltip nhỏ khi hover */}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            {item.desc}
                                        </span>
                                    </button>
                                ))}
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
               icon={isProcessing ? <Calculator className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
             >
               {isProcessing ? 'Đang xử lý...' : (mode === 'draw' ? 'Dịch sang LaTeX' : 'Chèn công thức')}
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};
