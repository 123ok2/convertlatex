import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Pen } from 'lucide-react';
import { Button } from './Button';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageData: string) => void;
  isProcessing: boolean;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  isProcessing 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size to match display size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        // White background for better AI recognition
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        setCtx(context);
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    const { x, y } = getCoordinates(e);
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
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

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSubmit = () => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      onSubmit(imageData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Pen className="w-5 h-5 text-indigo-600" />
            </div>
            Vẽ Công Thức
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 bg-slate-100 p-4 relative overflow-hidden flex flex-col justify-center">
          <div className="relative w-full h-full shadow-inner rounded-lg overflow-hidden border border-slate-300 bg-white">
            <canvas
                ref={canvasRef}
                className="w-full h-[300px] md:h-[400px] cursor-crosshair touch-none block"
                style={{ touchAction: 'none' }} 
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
          </div>
          
          <div className="absolute top-6 right-6 flex gap-2">
            <button 
              onClick={clearCanvas}
              className="p-2 bg-white rounded-full shadow-md text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200"
              title="Xóa tất cả"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
           <p className="text-xs text-slate-500 hidden sm:block italic">
             Mẹo: Vẽ to và rõ ràng để AI nhận diện tốt nhất.
           </p>
           <div className="flex gap-3 ml-auto w-full sm:w-auto">
             <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="flex-1 sm:flex-none justify-center">
               Hủy
             </Button>
             <Button 
               variant="primary" 
               onClick={handleSubmit} 
               disabled={isProcessing}
               className="min-w-[120px] flex-1 sm:flex-none justify-center"
             >
               {isProcessing ? 'Đang dịch...' : 'Chèn vào bài'}
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};