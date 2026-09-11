import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileText, Code2, Sparkles } from 'lucide-react';
import { mml2omml } from 'mathml2omml';
import { sanitizeOmml, decodeHtmlEntities } from '../utils/wordExport';
import { copyHtmlAndText, copyPlainText } from '../utils/clipboard';
import { MarkdownComponentProps } from '../types';

interface MarkdownPreviewProps {
  content: string;
  previewMode?: 'web' | 'word';
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, previewMode = 'web' }) => {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const processedContent = useMemo(() => {
    if (!content) return '';

    // --- STEP 0: DETECT MULTIPLE CHOICE OPTIONS & ENSURE NEW LINES ---
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
        if (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== '') {
          processedLines.push('');
        }
      }
      processedLines.push(line);
    }
    const preProcessedContent = decodeHtmlEntities(processedLines.join('\n'));

    // --- STEP 1: PRE-NORMALIZE MATH DELIMITERS & INTEGRAL LIMIT BARS ---
    let text = preProcessedContent
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // Chuyển \[ \] thành $$ $$
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')     // Chuyển \( \) thành $ $
      .replace(/(\||\\vert|\\mid|\\Big\||\\big\||\\Bigg\||\\bigg\|)\s*\\?\s*([_\^])/g, '|$2'); // Chuẩn hóa cận tích phân Newton-Leibniz

    // --- STEP 2: FIX ADJACENT MATH & MULTILINE SEPARATOR ---
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
      if (inner.includes('\\begin{')) return match;

      const lines = inner.split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length > 1) {
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

        if (char === '{' && prevChar !== '\\') braceDepth++;
        if (char === '}' && prevChar !== '\\') braceDepth = Math.max(0, braceDepth - 1);
        if (char === '[' && prevChar !== '\\') bracketDepth++;
        if (char === ']' && prevChar !== '\\') bracketDepth = Math.max(0, bracketDepth - 1);

        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote && braceDepth === 0 && bracketDepth === 0 && prevChar !== '\\') {
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
    let tableBuffer: { original: string; cols: string[] }[] = [];
    let bufferColCount = 0;

    const flushTableBuffer = () => {
      if (tableBuffer.length === 0) return;

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
            if (cols.length === bufferColCount + 1 && cols[cols.length - 1] === '') {
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

  // Xử lý sao chép công thức toán khi click trực tiếp
  const handleFormulaClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const katexEl = target.closest('.katex');
    if (!katexEl) return;

    // Tìm mã MathML sạch hoặc annotation tex
    const annotationEl = katexEl.querySelector('annotation[encoding="application/x-tex"]');
    const mathEl = katexEl.querySelector('math');

    if (mathEl) {
      // Chuẩn hóa MathML: bỏ annotation để Word không lặp chữ
      const cloneMath = mathEl.cloneNode(true) as Element;
      cloneMath.querySelectorAll('annotation').forEach(el => el.remove());
      const cleanMml = cloneMath.outerHTML;
      const xmlMml = `<?xml version="1.0"?>\n${cleanMml}`;

      try {
        const rawOmml = mml2omml(cleanMml);
        const ommlStr = sanitizeOmml(rawOmml);
        const htmlDoc = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><head><meta charset="utf-8"></head><body><!--StartFragment-->${ommlStr}<!--EndFragment--></body></html>`;

        const success = await copyHtmlAndText(htmlDoc, xmlMml);
        if (success) {
          setCopyFeedback('Đã chép công thức! Trong Word: bấm Alt + = rồi bấm Ctrl + V để hiển thị 2D chuẩn đẹp nhất.');
          setTimeout(() => setCopyFeedback(null), 4500);
        } else {
          setCopyFeedback('Không thể chép công thức. Vui lòng thử lại.');
          setTimeout(() => setCopyFeedback(null), 3000);
        }
      } catch (err) {
        const textSuccess = await copyPlainText(xmlMml);
        if (textSuccess) {
          setCopyFeedback('Đã chép công thức! Trong Word bấm Alt + = rồi Ctrl + V.');
          setTimeout(() => setCopyFeedback(null), 4500);
        }
      }
    } else if (annotationEl && annotationEl.textContent) {
      const success = await copyPlainText(annotationEl.textContent);
      if (success) {
        setCopyFeedback(`Đã chép mã LaTeX: ${annotationEl.textContent}. Trong Word: Mở Equation > chọn LaTeX > dán > nhấn Enter!`);
        setTimeout(() => setCopyFeedback(null), 4500);
      }
    }
  };

  return (
    <div
      id="markdown-preview-content"
      onClick={handleFormulaClick}
      className={
        previewMode === 'word'
          ? "w-full max-w-none bg-white p-12 text-black shadow-xs border border-slate-200 min-h-[400px] select-text leading-relaxed relative"
          : "w-full prose prose-slate max-w-none select-text prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 prose-h1:text-4xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-4 prose-h1:mb-8 prose-h2:text-3xl prose-h2:text-indigo-700 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h3:text-2xl prose-h3:text-slate-800 prose-h3:mt-8 prose-p:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6 prose-table:border-collapse prose-table:border prose-table:border-slate-300 prose-table:shadow-sm prose-table:my-8 prose-table:w-full prose-thead:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-th:p-3 prose-th:text-slate-800 prose-th:font-bold prose-th:text-left prose-td:border prose-td:border-slate-300 prose-td:p-3 prose-td:text-slate-700 prose-td:align-top prose-tr:even:bg-slate-50 prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto prose-code:text-pink-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-slate-200 prose-code:text-base prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:shadow-sm prose-pre:text-slate-800 prose-pre:rounded-lg relative"
      }
      style={previewMode === 'word' ? { fontFamily: "'Times New Roman', serif", fontSize: '13pt', color: 'black' } : undefined}
    >
      {/* Thông báo sao chép công thức nhanh */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => {
            return previewMode === 'word'
              ? <h1 className="text-[18pt] font-bold text-[#1e40af] mt-4 mb-4 text-left leading-tight" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <h1 className="text-4xl font-extrabold border-b border-slate-200 pb-4 mb-8 text-slate-900 leading-tight" {...props} />;
          },
          h2: ({ node, ...props }) => {
            return previewMode === 'word'
              ? <h2 className="text-[16pt] font-bold text-[#1e40af] mt-4 mb-3 text-left leading-tight" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <h2 className="text-3xl font-bold text-indigo-700 mt-10 border-b border-slate-100 pb-2 leading-tight" {...props} />;
          },
          h3: ({ node, ...props }) => {
            return previewMode === 'word'
              ? <h3 className="text-[14pt] font-bold text-[#1e40af] mt-4 mb-2 text-left leading-tight" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <h3 className="text-2xl font-bold text-slate-800 mt-8 leading-tight" {...props} />;
          },
          p: ({ node, ...props }) => {
            const children = props.children;
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
                  {...props}
                />
              );
            }

            return isMcq ? (
              <p
                className="text-lg text-slate-700 leading-relaxed mb-3"
                style={{ marginLeft: '24pt', textIndent: '-24pt' }}
                {...props}
              />
            ) : (
              <p className="text-lg text-slate-700 leading-relaxed mb-6" {...props} />
            );
          },
          table: ({ node, ...props }) => (
            previewMode === 'word'
              ? <table className="w-full border-collapse my-4 text-[13pt]" style={{ fontFamily: "'Times New Roman', serif", border: "1px solid black", borderCollapse: "collapse" }} {...props} />
              : <table className="w-full border-collapse border border-slate-300 my-8 shadow-sm" {...props} />
          ),
          thead: ({ node, ...props }) => <thead {...props} />,
          th: ({ node, ...props }) => {
            return previewMode === 'word'
              ? <th className="p-[5pt] font-bold text-left" style={{ border: "1px solid black" }} {...props} />
              : <th className="border border-slate-300 p-3 text-slate-800 font-bold bg-slate-100" {...props} />;
          },
          td: ({ node, ...props }) => {
            return previewMode === 'word'
              ? <td className="p-[5pt] text-left" style={{ border: "1px solid black" }} {...props} />
              : <td className="border border-slate-300 p-3 text-slate-700 align-top" {...props} />;
          },
          ul: ({ node, ...props }) => (
            previewMode === 'word'
              ? <ul className="list-disc pl-8 mb-[10pt] text-[13pt] text-black" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <ul className="list-disc pl-8 mb-6 text-lg text-slate-700" {...props} />
          ),
          ol: ({ node, ...props }) => (
            previewMode === 'word'
              ? <ol className="list-decimal pl-8 mb-[10pt] text-[13pt] text-black" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <ol className="list-decimal pl-8 mb-6 text-lg text-slate-700" {...props} />
          ),
          li: ({ node, ...props }) => {
            return previewMode === 'word'
              ? <li className="mb-1 text-black" style={{ fontFamily: "'Times New Roman', serif" }} {...props} />
              : <li className="mb-1 text-slate-700" {...props} />;
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
          blockquote: ({ node, ...props }) => {
            return (
              <div className={
                previewMode === 'word'
                  ? "flex gap-4 my-4 bg-slate-50 p-4 rounded-r border-l-4 border-slate-300"
                  : "flex gap-4 my-6 bg-indigo-50/50 p-6 rounded-r-lg border-l-4 border-indigo-500"
              }>
                <div className="text-slate-300 text-4xl font-serif leading-none">"</div>
                <blockquote className="italic text-slate-700 flex-1 text-lg leading-8" {...props} />
              </div>
            );
          }
        }}
        children={processedContent}
      />
    </div>
  );
};
