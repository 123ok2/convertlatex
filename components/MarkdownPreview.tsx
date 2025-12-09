import React from 'react';
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
  return (
    <div id="markdown-preview-content" className="w-full prose prose-slate max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
          prose-h1:text-4xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-4 prose-h1:mb-8
          prose-h2:text-3xl prose-h2:text-indigo-700 prose-h2:mt-10
          prose-h3:text-2xl prose-h3:text-slate-800 prose-h3:mt-8
          prose-p:text-lg prose-p:text-slate-700 prose-p:leading-8 prose-p:mb-6
          prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
          prose-code:text-pink-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-slate-200 prose-code:text-base
          prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:shadow-sm prose-pre:text-slate-800
          prose-li:text-lg prose-li:text-slate-700 prose-li:leading-8
          prose-img:rounded-lg prose-img:shadow-md
          prose-table:border prose-table:border-slate-200 prose-table:rounded-lg prose-table:overflow-hidden prose-table:text-base
          prose-th:bg-slate-100 prose-th:p-4 prose-th:text-slate-800 prose-th:font-semibold
          prose-td:p-4 prose-td:border-b prose-td:border-slate-200 prose-td:text-slate-700
        ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }: MarkdownComponentProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="rounded-lg overflow-hidden my-8 shadow-sm border border-slate-200 bg-white">
                <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b border-slate-200">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                   </div>
                   <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={vs}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: '1.5rem', background: 'white', fontSize: '1rem', lineHeight: '1.6' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-slate-100 text-pink-600 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[0.9em]" {...props}>
                {children}
              </code>
            );
          },
          // Customize blockquote specifically
          blockquote: ({node, ...props}) => (
            <div className="flex gap-4 my-8 bg-slate-50 p-6 rounded-r-lg border-l-4 border-indigo-500 shadow-sm">
               <div className="text-indigo-400 text-3xl font-serif">"</div>
               <blockquote className="italic text-slate-600 flex-1 text-lg leading-8" {...props} />
            </div>
          )
        }}
        children={content}
      />
    </div>
  );
};