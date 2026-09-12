
import React, { useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MarkdownComponentProps } from '../types';

interface MarkdownPreviewProps {
  content: string;
  previewMode?: 'web' | 'word';
}

/**
 * Tách chuỗi và chèn các thẻ span tàng hình chứa ký tự chống copy đè dán (anti-scraping / copy prevention)
 * Phương pháp nâng cao: Cắt đôi các từ và chèn các ký tự rác cực kỳ nhỏ/tàng hình vào giữa. 
 * Khi người dùng bình thường đọc, mắt thường không thấy gì sai khác. 
 * Nhưng khi các tiện ích "bẻ khoá copy" lấy văn bản từ DOM, các ký tự rác này sẽ dính chặt vào văn bản, 
 * biến văn bản thành đống lộn xộn không thể sử dụng để tra cứu hoặc giải đề được nữa.
 */
const protectString = (str: string): React.ReactNode[] => {
  if (typeof str !== 'string' || !str) return [str];
  if (str.trim().length <= 1) return [str];

  const segments: React.ReactNode[] = [];
  // Phân tách thành các cụm từ và khoảng trắng
  const parts = str.split(/(\s+)/);
  
  // Danh sách ký tự rác ngẫu nhiên dạng chữ thường, ký hiệu toán học hoặc tiền tố gây nhiễu
  const decoys = ['x', 'z', 'q', 'y', 'w', 'b', '_', 'r', 'k', '9', '7', '@', 'p', 's'];
  let decoyIdx = Math.floor(Math.random() * decoys.length);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (/^\s+$/.test(part)) {
      // Giữ nguyên khoảng trắng và ngẫu nhiên chèn rác tàng hình sau khoảng trắng
      segments.push(part);
      if (Math.random() < 0.7) {
        const decoy = decoys[decoyIdx % decoys.length];
        decoyIdx++;
        segments.push(
          <span 
            key={`decoy-space-${i}`}
            className="copy-protection-decoy"
            data-copy-hidden="true"
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: '0px',
              height: '0px',
              opacity: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              fontSize: '0px',
              lineHeight: 0,
              display: 'inline-block',
              color: 'transparent'
            }}
          >
            {decoy}
          </span>
        );
      }
    } else {
      // Với mỗi từ có độ dài từ 3 ký tự trở lên (phù hợp với hầu hết từ tiếng Việt như "câu", "đáp", "án")
      // Ta bẻ đôi từ đó ra và nhét ký tự rác vào giữa
      if (part.length >= 3 && !part.startsWith('$')) {
        const mid = Math.floor(part.length / 2);
        const startPart = part.substring(0, mid);
        const endPart = part.substring(mid);
        const decoy = decoys[decoyIdx % decoys.length];
        decoyIdx++;

        segments.push(startPart);
        segments.push(
          <span 
            key={`decoy-mid-${i}`}
            className="copy-protection-decoy"
            data-copy-hidden="true"
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: '0px',
              height: '0px',
              opacity: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              fontSize: '0px',
              lineHeight: 0,
              display: 'inline-block',
              color: 'transparent'
            }}
          >
            {decoy}
          </span>
        );
        segments.push(endPart);
      } else {
        segments.push(part);
      }
    }
  }

  return segments;
};

/**
 * Hàm đệ quy duyệt qua component tree, bảo vệ text nodes, bỏ qua khối LaTeX và Code blocks
 */
const protectNode = (node: React.ReactNode): React.ReactNode => {
  if (!node) return null;

  if (typeof node === 'string') {
    return <React.Fragment>{protectString(node)}</React.Fragment>;
  }

  if (typeof node === 'number') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => <React.Fragment key={index}>{protectNode(child)}</React.Fragment>);
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    
    // Bỏ qua các khối toán học KaTeX, các cấu trúc SyntaxHighlighter hoặc code
    const className = element.props?.className || '';
    const typeStr = typeof element.type === 'string' ? element.type : (element.type as any)?.name || '';

    if (
      className.includes('katex') || 
      className.includes('prism') || 
      className.includes('code') ||
      typeStr === 'code' ||
      typeStr === 'pre' ||
      typeStr === 'SyntaxHighlighter'
    ) {
      return node; // Trả về nguyên bản
    }

    if (element.props && element.props.children) {
      return React.cloneElement(element, {
        ...element.props,
        children: protectNode(element.props.children)
      });
    }
  }

  return node;
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, previewMode = 'web' }) => {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const processedContent = useMemo(() => {
    if (!content) return '';

    // --- STEP 0: DETECT MULTIPLE CHOICE OPTIONS & ENSURE NEW LINES ---
    // Đảm bảo các phương án trắc nghiệm (A., B., C., D.) viết liền trên các dòng trong editor đều được tách thành các đoạn (paragraphs) riêng biệt
    const isOptionLine = (l: string) => /^\s*[A-Ea-e][\.\)\:\-]\s+/.test(l);
    let inCodeBlock = false;
    let inMathBlock = false;
    const rawLines = content.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      if (trimmed === '$$') {
        inMathBlock = !inMathBlock;
      }
      
      if (!inCodeBlock && !inMathBlock && isOptionLine(line)) {
        // Nếu dòng trước đó không phải dòng trống, tự động chèn thêm dòng trống để tạo paragraph riêng
        if (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== '') {
          processedLines.push('');
        }
      }
      processedLines.push(line);
    }
    const preProcessedContent = processedLines.join('\n');

    // --- STEP 1: PRE-NORMALIZE MATH DELIMITERS ---
    let text = preProcessedContent
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // Chuyển \[ \] thành $$ $$
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');   // Chuyển \( \) thành $ $

    // --- STEP 2: FIX ADJACENT MATH & MULTILINE SEPARATOR ---
    // Tách riêng các công thức nếu chúng ở các dòng khác nhau trong cùng một block $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
      // Nếu là môi trường có sẵn cấu trúc nhiều dòng (giữ nguyên)
      if (inner.includes('\\begin{')) return match;
      
      const lines = inner.split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length > 1) {
        // Mỗi dòng xuống dòng được coi là 1 công thức hoàn toàn mới và tách riêng
        return lines.map((l: string) => `\n\n$$ ${l.trim()} $$\n\n`).join('');
      }
      return match;
    });

    text = text.replace(/(^|[^\$])(\$[^\$\n]+\$)(?=\$)/g, '$1$2\n\n');

    // --- STEP 3: SMART CSV TO MARKDOWN TABLE CONVERTER ---
    const parseCSVLine = (line: string) => {
      const parts = [];
      let current = '';
      let inQuote = false;
      let braceDepth = 0;
      let bracketDepth = 0;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i - 1] : '';

        // Theo dõi độ sâu của ngoặc để tránh ngắt cột trong công thức phức tạp
        if (char === '{' && prevChar !== '\\') braceDepth++;
        if (char === '}' && prevChar !== '\\') braceDepth = Math.max(0, braceDepth - 1);
        if (char === '[' && prevChar !== '\\') bracketDepth++;
        if (char === ']' && prevChar !== '\\') bracketDepth = Math.max(0, bracketDepth - 1);

        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote && braceDepth === 0 && bracketDepth === 0 && prevChar !== '\\') {
          // Chỉ tách cột nếu không ở trong ngoặc kép, không ở trong ngoặc nhọn/vuông và không phải là \, (LaTeX space)
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

      // Điều kiện tạo bảng: ít nhất 2 dòng, >= 2 cột, và không có quá nhiều dấu gạch chéo ngược (dấu hiệu của LaTeX)
      const looksLikeMath = tableBuffer.some(row => 
        row.original.includes('\\') || 
        row.original.includes('$') || 
        /^[0-9\s\+\-\*\/\=\(\)\^\,]+$/.test(row.original)
      );

      if (!looksLikeMath && ((tableBuffer.length >= 2 && bufferColCount >= 2) || (tableBuffer.length === 1 && bufferColCount >= 3))) {
        const headerRow = tableBuffer[0].cols;
        resultLines.push('| ' + headerRow.join(' | ') + ' |');
        const separator = headerRow.map(() => ':---');
        resultLines.push('| ' + separator.join(' | ') + ' |');
        
        for (let i = 1; i < tableBuffer.length; i++) {
            let rowCols = tableBuffer[i].cols;
            if (rowCols.length < bufferColCount) {
                rowCols = [...rowCols, ...Array(bufferColCount - rowCols.length).fill('')];
            } else if (rowCols.length > bufferColCount) {
                const extras = rowCols.slice(bufferColCount - 1).join(', ');
                rowCols = [...rowCols.slice(0, bufferColCount - 1), extras];
            }
            resultLines.push('| ' + rowCols.join(' | ') + ' |');
        }
        resultLines.push(''); 
      } else {
        tableBuffer.forEach(row => resultLines.push(row.original));
      }

      tableBuffer = [];
      bufferColCount = 0;
    };

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // Kiểm tra xem dòng có chứa các ký hiệu toán học đặc trưng không
      const hasHeavyMath = /\\(int|frac|sum|sqrt|alpha|beta|gamma|delta|phi|omega|inf|theta|dx|dy)/.test(trimmedLine) || 
                          trimmedLine.startsWith('$') || 
                          trimmedLine.endsWith('$');

      if (!trimmedLine || trimmedLine.startsWith('|') || hasHeavyMath) {
        flushTableBuffer();
        resultLines.push(line);
        continue;
      }

      const cols = parseCSVLine(line);

      if (cols.length > 1) {
        if (tableBuffer.length === 0) {
          bufferColCount = cols.length;
          tableBuffer.push({ original: line, cols });
        } else {
          if (Math.abs(cols.length - bufferColCount) <= 1) {
             if (cols.length === bufferColCount + 1 && cols[cols.length-1] === '') {
                 cols.pop();
             }
             tableBuffer.push({ original: line, cols });
          } else {
             flushTableBuffer();
             bufferColCount = cols.length;
             tableBuffer.push({ original: line, cols });
          }
        }
      } else {
        flushTableBuffer();
        resultLines.push(line);
      }
    }
    flushTableBuffer();

    return resultLines.join('\n');

  }, [content]);

  // --- HÀM XÁO TRỘN VÀ CHÈN KÝ TỰ LẠ CHỐNG COPY TRÁI PHÉP ---
  const scrambleText = (text: string): string => {
    if (!text) return '';
    
    // Bản đồ thay thế homoglyphs (ký tự nhìn giống hệt nhau nhưng khác mã Unicode)
    // Giúp phá vỡ hoàn toàn khả năng search Google, tra cứu đáp án hoặc nạp vào AI (nhận diện sai từ)
    const homoglyphs: Record<string, string> = {
      'a': 'а', 'c': 'с', 'e': 'е', 'o': 'о', 'p': 'р', 'y': 'у', 'x': 'х', 's': 'ѕ', 'i': 'і',
      'A': 'А', 'C': 'С', 'E': 'Е', 'O': 'О', 'P': 'Р', 'Y': 'Ү', 'X': 'Х', 'S': 'Ѕ', 'I': 'І'
    };

    const lines = text.split('\n');
    const scrambledLines = lines.map(line => {
      let result = '';
      const parts = line.split(/(\s+)/);

      for (let part of parts) {
        if (/^\s+$/.test(part)) {
          result += part;
        } else {
          let newWord = '';
          for (let j = 0; j < part.length; j++) {
            const char = part[j];
            // Chèn ngẫu nhiên ký tự gây nhiễu vô hình hoặc ký hiệu lạ vào giữa từ đối với các từ dài hơn 3 chữ
            if (j > 0 && j === Math.floor(part.length / 2) && part.length >= 3 && Math.random() < 0.7) {
              const noises = ['\u200B', 'χ', 'ϕ', '¹', '₀', '`', '■', '▫', '†', '‡'];
              newWord += noises[Math.floor(Math.random() * noises.length)];
            }
            newWord += homoglyphs[char] || char;
          }
          
          // Tráo đổi ngẫu nhiên ký tự trong các từ dài để phá vỡ cấu trúc văn bản
          if (part.length > 4 && Math.random() < 0.4 && !part.includes('$') && !part.includes('\\')) {
            const chars = newWord.split('');
            const idx1 = 1 + Math.floor(Math.random() * (chars.length - 2));
            const idx2 = 1 + Math.floor(Math.random() * (chars.length - 2));
            const temp = chars[idx1];
            chars[idx1] = chars[idx2];
            chars[idx2] = temp;
            newWord = chars.join('');
          }
          result += newWord;
        }
      }
      return result;
    });

    const header = `========================================================\n` +
                   `⚠️ CẢNH BÁO BẢN QUYỀN - NỘI DUNG ĐÃ BỊ XÁO TRỘN TỰ ĐỘNG\n` +
                   `Bạn đang sao chép tài liệu bảo mật trên ứng dụng Markdown Pro.\n` +
                   `Hệ thống đã tự động mã hóa cấu trúc từ học và chèn ký tự gây nhiễu.\n` +
                   `Để lấy file Word hoặc sao chép văn bản đã định dạng chuẩn đẹp,\n` +
                   `vui lòng sử dụng các tính năng chính thức trên thanh công cụ.\n` +
                   `========================================================\n\n`;

    const footer = `\n\n========================================================\n` +
                   `MDP Copy-Protection Engine Active. [Secure Code: ${Math.floor(100000 + Math.random() * 900000)}]\n` +
                   `=================================================`;

    return header + scrambledLines.join('\n') + footer;
  };

  // Sử dụng capturing listener để bắt sự kiện copy ở cấp độ tài liệu sớm nhất trước khi các extension có thể tắt/hủy bỏ
  useEffect(() => {
    if (previewMode === 'word') return;

    const handleGlobalCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const container = document.getElementById('markdown-preview-content');
      if (!container) return;

      const range = selection.getRangeAt(0);
      // Nếu lựa chọn nằm trong khu vực preview của chúng ta
      if (container.contains(range.commonAncestorContainer) || container.contains(range.startContainer)) {
        e.preventDefault();
        const selectedText = selection.toString();
        const scrambledContent = scrambleText(selectedText);
        
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', scrambledContent);
        }
      }
    };

    const handleSelectStart = (e: Event) => {
      const container = document.getElementById('markdown-preview-content');
      if (container && (container.contains(e.target as Node) || e.target === container)) {
        e.preventDefault();
      }
    };

    // Đặt capture = true để ưu tiên bắt trước mọi listener khác kể cả extension phá chặn copy
    document.addEventListener('copy', handleGlobalCopy, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    return () => {
      document.removeEventListener('copy', handleGlobalCopy, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, [previewMode]);

  return (
    <div 
      id="markdown-preview-content" 
      onCopy={(e) => {
        if (previewMode !== 'word') {
          e.preventDefault();
          const selectedText = window.getSelection()?.toString() || '';
          e.clipboardData.setData('text/plain', scrambleText(selectedText));
        }
      }}
      className={
        previewMode === 'word'
          ? "w-full max-w-none bg-white p-12 text-black shadow-xs border border-slate-200 min-h-[400px] select-all leading-relaxed relative"
          : "w-full prose prose-slate max-w-none select-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 prose-h1:text-4xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-4 prose-h1:mb-8 prose-h2:text-3xl prose-h2:text-indigo-700 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h3:text-2xl prose-h3:text-slate-800 prose-h3:mt-8 prose-p:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6 prose-table:border-collapse prose-table:border prose-table:border-slate-300 prose-table:shadow-sm prose-table:my-8 prose-table:w-full prose-thead:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-th:p-3 prose-th:text-slate-800 prose-th:font-bold prose-th:text-left prose-td:border prose-td:border-slate-300 prose-td:p-3 prose-td:text-slate-700 prose-td:align-top prose-tr:even:bg-slate-50 prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto prose-code:text-pink-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-slate-200 prose-code:text-base prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:shadow-sm prose-pre:text-slate-800 prose-pre:rounded-lg relative"
      }
      style={previewMode === 'word' ? { fontFamily: "'Times New Roman', serif", fontSize: '13pt', color: 'black' } : undefined}
    >
      {previewMode !== 'word' && (
        <>
          {/* Lớp chắn cơ học chặn chuột bôi đen tiếp xúc với văn bản bên dưới, tích hợp hiệu ứng gương trượt phản chiếu */}
          <div 
            className="copy-protection-decoy absolute inset-0 z-[100] cursor-default select-none pointer-events-auto transition-all"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              msUserSelect: 'none',
              MozUserSelect: 'none',
              background: isHovering 
                ? `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0) 80%)`
                : 'transparent',
              mixBlendMode: 'screen',
              pointerEvents: 'auto'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
          {/* Lớp phản xạ siêu mỏng/mờ bổ trợ, chống các tiện ích/extension phá bẻ khóa CSS */}
          <div 
            className="copy-protection-decoy absolute inset-0 z-[101] bg-white/[0.002] cursor-default select-none pointer-events-none"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              msUserSelect: 'none',
              MozUserSelect: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return previewMode === 'word'
              ? <h1 className="text-[18pt] font-bold text-[#1e40af] mt-4 mb-4 text-left leading-tight" style={{ fontFamily: "'Times New Roman', serif" }}>{protectedChildren}</h1>
              : <h1 className="text-4xl font-extrabold border-b border-slate-200 pb-4 mb-8 text-slate-900 leading-tight">{protectedChildren}</h1>;
          },
          h2: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return previewMode === 'word'
              ? <h2 className="text-[16pt] font-bold text-[#1e40af] mt-4 mb-3 text-left leading-tight" style={{ fontFamily: "'Times New Roman', serif" }}>{protectedChildren}</h2>
              : <h2 className="text-3xl font-bold text-indigo-700 mt-10 border-b border-slate-100 pb-2 leading-tight">{protectedChildren}</h2>;
          },
          h3: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return previewMode === 'word'
              ? <h3 className="text-[14pt] font-bold text-[#1e40af] mt-4 mb-2 text-left leading-tight" style={{ fontFamily: "'Times New Roman', serif" }}>{protectedChildren}</h3>
              : <h3 className="text-2xl font-bold text-slate-800 mt-8 leading-tight">{protectedChildren}</h3>;
          },
          p: ({node, ...props}) => {
            const children = props.children;
            const protectedChildren = protectNode(children);
            // Trích xuất văn bản thuần để nhận diện câu hỏi trắc nghiệm
            const getInlineText = (n: any): string => {
              if (!n) return "";
              if (typeof n === "string") return n;
              if (typeof n === "number") return String(n);
              if (Array.isArray(n)) return n.map(getInlineText).join("");
              if (React.isValidElement(n)) {
                const element = n as React.ReactElement<any>;
                if (element.props && element.props.children) {
                    return getInlineText(element.props.children);
                }
              }
              return "";
            };
            
            const plainText = getInlineText(children);
            const isMcq = /^\s*[A-Ea-e][\.\)\:\-]\s+/.test(plainText);

            if (previewMode === 'word') {
              return (
                <p 
                  className={`text-[13pt] text-black leading-normal mb-[8pt] text-justify`}
                  style={{ 
                    fontFamily: "'Times New Roman', serif",
                    ...(isMcq ? { marginLeft: '24pt', textIndent: '-24pt' } : {})
                  }}
                >
                  {protectedChildren}
                </p>
              );
            }

            return isMcq ? (
              <p 
                className="text-lg text-slate-700 leading-relaxed mb-3" 
                style={{ marginLeft: '24pt', textIndent: '-24pt' }}
              >
                {protectedChildren}
              </p>
            ) : (
              <p className="text-lg text-slate-700 leading-relaxed mb-6">{protectedChildren}</p>
            );
          },
          table: ({node, ...props}) => (
            previewMode === 'word'
              ? <table className="w-full border-collapse my-4 text-[13pt]" style={{ fontFamily: "'Times New Roman', serif", border: "1px solid black", borderCollapse: "collapse" }} {...props} />
              : <table className="w-full border-collapse border border-slate-300 my-8 shadow-sm" {...props} />
          ),
          thead: ({node, ...props}) => <thead {...props} />,
          th: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return previewMode === 'word'
              ? <th className="p-[5pt] font-bold text-left" style={{ border: "1px solid black" }}>{protectedChildren}</th>
              : <th className="border border-slate-300 p-3 text-slate-800 font-bold bg-slate-100">{protectedChildren}</th>;
          },
          td: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return previewMode === 'word'
              ? <td className="p-[5pt] text-left" style={{ border: "1px solid black" }}>{protectedChildren}</td>
              : <td className="border border-slate-300 p-3 text-slate-700 align-top">{protectedChildren}</td>;
          },
          ul: ({node, ...props}) => (
            previewMode === 'word'
              ? <ul className="list-disc pl-8 mb-[10pt] text-[13pt] text-black" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <ul className="list-disc pl-8 mb-6 text-lg text-slate-700" {...props} />
          ),
          ol: ({node, ...props}) => (
            previewMode === 'word'
              ? <ol className="list-decimal pl-8 mb-[10pt] text-[13pt] text-black" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <ol className="list-decimal pl-8 mb-6 text-lg text-slate-700" {...props} />
          ),
          li: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return previewMode === 'word'
              ? <li className="mb-1 text-black" style={{ fontFamily: "'Times New Roman', serif" }}>{protectedChildren}</li>
              : <li className="mb-1 text-slate-700">{protectedChildren}</li>;
          },
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
              <code className={
                previewMode === 'word'
                  ? "bg-slate-50 text-indigo-700 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[0.9em]"
                  : "bg-slate-100 text-pink-600 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[0.9em] font-medium"
              } {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({node, ...props}) => {
            const protectedChildren = protectNode(props.children);
            return (
              <div className={
                previewMode === 'word'
                  ? "flex gap-4 my-4 bg-slate-50 p-4 rounded-r border-l-4 border-slate-300"
                  : "flex gap-4 my-6 bg-indigo-50/50 p-6 rounded-r-lg border-l-4 border-indigo-500"
              }>
                 <div className="text-slate-300 text-4xl font-serif leading-none">"</div>
                 <blockquote className="italic text-slate-700 flex-1 text-lg leading-8">
                   {protectedChildren}
                 </blockquote>
              </div>
            );
          }
        }}
        children={processedContent}
      />
    </div>
  );
};
