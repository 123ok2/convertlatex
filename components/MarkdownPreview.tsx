
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

    let text = content;

    // --- STEP 1: CHUẨN HÓA KHOẢNG TRẮNG TOÁN HỌC ---
    // Đảm bảo $ formula $ và $$ formula $$ luôn có khoảng trắng để render tốt nhất
    
    // Tách các khối inline dính liền
    text = text.replace(/([^\s\$])\$\$([^\s\$])/g, '$1$ $ $2');
    
    // Thêm khoảng trắng vào Inline Math
    text = text.replace(/(^|[^\$])\$([^\$\n]+?)\$([^\$]|$)/g, (match, p1, p2, p3) => {
        return `${p1}$ ${p2.trim()} $${p3}`;
    });

    // Thêm khoảng trắng vào Block Math
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
        return `$$\n${p1.trim()}\n$$`;
    });

    // --- STEP 2: CSV TO MARKDOWN TABLE CONVERTER ---
    const parseCSVLine = (line: string) => {
      const parts = [];
      let current = '';
      let inQuote = false;
      let bracketDepth = 0;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuote = !inQuote;
        else if (['{', '[', '('].includes(char)) bracketDepth++;
        else if (['}', ']', ')'].includes(char)) bracketDepth = Math.max(0, bracketDepth - 1);
        else if (char === ',' && !inQuote && bracketDepth === 0) {
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
      if (tableBuffer.length < 2 || bufferColCount < 2) {
        tableBuffer.forEach(row => resultLines.push(row.original));
      } else {
        const headerRow = tableBuffer[0].cols;
        resultLines.push('| ' + headerRow.join(' | ') + ' |');
        resultLines.push('| ' + headerRow.map(() => ':---').join(' | ') + ' |');
        for (let i = 1; i < tableBuffer.length; i++) {
            let rowCols = tableBuffer[i].cols;
            if (rowCols.length < bufferColCount) rowCols = [...rowCols, ...Array(bufferColCount - rowCols.length).fill('')];
            resultLines.push('| ' + rowCols.join(' | ') + ' |');
        }
        resultLines.push('');
      }
      tableBuffer = [];
      bufferColCount = 0;
    };

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // QUAN TRỌNG: Nếu dòng là công thức toán học hoàn chỉnh (bắt đầu và kết thúc bằng $), 
      // TUYỆT ĐỐI không parse nó như một hàng trong bảng CSV.
      const isPureMath = (trimmedLine.startsWith('$') && trimmedLine.endsWith('$')) || 
                         trimmedLine.startsWith('\\begin') || 
                         trimmedLine.startsWith('\\[');

      if (!trimmedLine || trimmedLine.startsWith('|') || isPureMath) {
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
          if (Math.abs(cols.length - bufferColCount) <= 1) tableBuffer.push({ original: line, cols });
          else { flushTableBuffer(); bufferColCount = cols.length; tableBuffer.push({ original: line, cols }); }
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
          prose-headings:font-bold prose-p:text-lg prose-p:leading-relaxed 
          prose-table:border prose-table:border-slate-300 prose-th:bg-slate-100 prose-th:border prose-td:border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }: MarkdownComponentProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter style={vs} language={match[1]} PreTag="div" customStyle={{ padding: '1.5rem', background: '#f8fafc' }} {...props}>
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-slate-100 text-pink-600 px-1 rounded" {...props}>{children}</code>
            );
          }
        }}
        children={processedContent}
      />
    </div>
  );
};
