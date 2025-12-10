
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MarkdownComponentProps } from '../types';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  
  const processedContent = useMemo(() => {
    if (!content) return '';

    // --- STEP 1: PRE-NORMALIZE MATH DELIMITERS ---
    // Nhiều LLM trả về \[ ... \] cho block math và \( ... \) cho inline.
    // Chúng ta chuyển hết về chuẩn $$ ... $$ và $ ... $ để remark-math xử lý tốt nhất.
    let text = content
      .replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$') // Chuyển \[ \] thành $$ $$
      .replace(/\\\((.*?)\\\)/gs, '$$$1$$');   // Chuyển \( \) thành $ $

    // --- STEP 2: FIX ADJACENT MATH (Vấn đề bạn gặp phải) ---
    // Khi copy paste: $\int...0$$\int...$
    // Regex tìm: một chuỗi inline math ($...$) ngay sau nó là một dấu $ bắt đầu chuỗi mới.
    // Thay thế: Chèn 2 dấu xuống dòng (\n\n) để tách thành đoạn riêng biệt.
    // FIX: Sử dụng regex cẩn thận để không phá vỡ Block Math ($$...$$)
    // Regex: Match $...$ where it is NOT preceded by another $ (to avoid $$ start)
    // and is followed by a $ (adjacent math).
    text = text.replace(/(^|[^\$])(\$[^\$\n]+\$)(?=\$)/g, '$1$2\n\n');


    // --- STEP 3: CSV TO MARKDOWN TABLE CONVERTER ---
    // Xử lý dữ liệu dạng phẩy (CSV) thành bảng Markdown
    
    // Hàm tách dòng CSV, tôn trọng dấu phẩy trong ngoặc kép
    const parseCSVLine = (line: string) => {
      const parts = [];
      let current = '';
      let inQuote = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuote = !inQuote;
          // Không thêm dấu quote vào data để hiển thị sạch hơn
        } else if (char === ',' && !inQuote) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      return parts;
    };

    const lines = text.split('\n');
    let resultLines: string[] = [];
    let tableBuffer: { original: string, cols: string[] }[] = [];
    let bufferColCount = 0;

    const flushTableBuffer = () => {
      if (tableBuffer.length === 0) return;

      // Logic xác định bảng:
      // 1. Có ít nhất 2 dòng VÀ ít nhất 2 cột
      // 2. HOẶC 1 dòng nhưng có >= 3 cột (dạng header)
      // 3. Các dòng phải có độ dài tương đối đồng đều
      if ((tableBuffer.length >= 2 && bufferColCount >= 2) || (tableBuffer.length === 1 && bufferColCount >= 3)) {
        
        // Tạo Header
        const headerRow = tableBuffer[0].cols;
        resultLines.push('| ' + headerRow.join(' | ') + ' |');
        
        // Tạo đường kẻ phân cách (Alignment row)
        // Thêm :--- để căn trái chuẩn đẹp
        const separator = headerRow.map(() => ':---');
        resultLines.push('| ' + separator.join(' | ') + ' |');
        
        // Tạo các dòng dữ liệu
        for (let i = 1; i < tableBuffer.length; i++) {
            let rowCols = tableBuffer[i].cols;
            
            // Xử lý lệch cột (pad hoặc merge)
            if (rowCols.length < bufferColCount) {
                rowCols = [...rowCols, ...Array(bufferColCount - rowCols.length).fill('')];
            } else if (rowCols.length > bufferColCount) {
                const extras = rowCols.slice(bufferColCount - 1).join(', ');
                rowCols = [...rowCols.slice(0, bufferColCount - 1), extras];
            }
            resultLines.push('| ' + rowCols.join(' | ') + ' |');
        }
        resultLines.push(''); // Dòng trống sau bảng
      } else {
        // Không phải bảng, trả về text gốc
        tableBuffer.forEach(row => resultLines.push(row.original));
      }

      tableBuffer = [];
      bufferColCount = 0;
    };

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // Bỏ qua dòng trống, dùng nó để ngắt bảng
      if (!trimmedLine) {
        flushTableBuffer();
        resultLines.push(line);
        continue;
      }

      // Kiểm tra xem dòng này có phải là một phần của công thức Block Math ($$...$$) không
      // Nếu là math block, không parse CSV
      if (trimmedLine.startsWith('$$') || trimmedLine.endsWith('$$')) {
          flushTableBuffer();
          resultLines.push(line);
          continue;
      }

      const cols = parseCSVLine(line);

      // Heuristic: Dòng CSV hợp lệ thường có > 1 cột
      if (cols.length > 1) {
        if (tableBuffer.length === 0) {
          // Bắt đầu bảng mới
          bufferColCount = cols.length;
          tableBuffer.push({ original: line, cols });
        } else {
          // Tiếp tục bảng nếu số cột khớp (chấp nhận sai số nhỏ do trailing comma)
          if (Math.abs(cols.length - bufferColCount) <= 1) {
             // Chuẩn hóa số cột nếu là trailing comma
             if (cols.length === bufferColCount + 1 && cols[cols.length-1] === '') {
                 cols.pop();
             }
             tableBuffer.push({ original: line, cols });
             // Update col count theo đa số (simple logic: keep initial header count as source of truth)
          } else {
             // Cấu trúc thay đổi đột ngột -> ngắt bảng cũ, bắt đầu bảng mới
             flushTableBuffer();
             bufferColCount = cols.length;
             tableBuffer.push({ original: line, cols });
          }
        }
      } else {
        // Dòng đơn -> ngắt bảng
        flushTableBuffer();
        resultLines.push(line);
      }
    }
    flushTableBuffer();

    return resultLines.join('\n');

  }, [content]);

  return (
    <div id="markdown-preview-content" className="w-full prose prose-slate max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
          prose-h1:text-4xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-4 prose-h1:mb-8
          prose-h2:text-3xl prose-h2:text-indigo-700 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2
          prose-h3:text-2xl prose-h3:text-slate-800 prose-h3:mt-8
          prose-p:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
          
          /* Table Styles - Giao diện bảng chuẩn */
          prose-table:border-collapse prose-table:border prose-table:border-slate-300 prose-table:shadow-sm prose-table:my-8 prose-table:w-full
          prose-thead:bg-slate-100
          prose-th:border prose-th:border-slate-300 prose-th:p-3 prose-th:text-slate-800 prose-th:font-bold prose-th:text-left
          prose-td:border prose-td:border-slate-300 prose-td:p-3 prose-td:text-slate-700 prose-td:align-top
          prose-tr:even:bg-slate-50

          /* Math Styles */
          prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto
          
          /* Code Block Styles */
          prose-code:text-pink-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-slate-200 prose-code:text-base
          prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:shadow-sm prose-pre:text-slate-800 prose-pre:rounded-lg
        ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }: MarkdownComponentProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="rounded-lg overflow-hidden my-6 shadow-sm border border-slate-200 bg-white">
                <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b border-slate-200">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                   </div>
                   <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={vs}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: '1.5rem', background: 'white', fontSize: '0.95rem', lineHeight: '1.6' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-slate-100 text-pink-600 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[0.9em] font-medium" {...props}>
                {children}
              </code>
            );
          },
          // Custom Blockquote styling
          blockquote: ({node, ...props}) => (
            <div className="flex gap-4 my-6 bg-indigo-50/50 p-6 rounded-r-lg border-l-4 border-indigo-500">
               <div className="text-indigo-300 text-4xl font-serif leading-none">"</div>
               <blockquote className="italic text-slate-700 flex-1 text-lg leading-8" {...props} />
            </div>
          )
        }}
        children={processedContent}
      />
    </div>
  );
};
