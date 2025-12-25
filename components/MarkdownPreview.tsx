
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
    let text = content
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // Chuyển \[ \] thành $$ $$
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');   // Chuyển \( \) thành $ $

    // --- STEP 2: FIX ADJACENT MATH ---
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

  return (
    <div id="markdown-preview-content" className="w-full prose prose-slate max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
          prose-h1:text-4xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-4 prose-h1:mb-8
          prose-h2:text-3xl prose-h2:text-indigo-700 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2
          prose-h3:text-2xl prose-h3:text-slate-800 prose-h3:mt-8
          prose-p:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
          prose-table:border-collapse prose-table:border prose-table:border-slate-300 prose-table:shadow-sm prose-table:my-8 prose-table:w-full
          prose-thead:bg-slate-100
          prose-th:border prose-th:border-slate-300 prose-th:p-3 prose-th:text-slate-800 prose-th:font-bold prose-th:text-left
          prose-td:border prose-td:border-slate-300 prose-td:p-3 prose-td:text-slate-700 prose-td:align-top
          prose-tr:even:bg-slate-50
          prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto
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
