import React from 'react';

export interface MarkdownComponentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export type BrowserType = 'chrome' | 'edge' | 'coccoc' | 'brave';

export interface StepItem {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  actionText?: string;
  actionType?: 'download' | 'copy' | 'link';
  actionPayload?: string;
  tips?: string[];
  warning?: string;
}

export interface FaqItem {
  id: string;
  category: 'error' | 'security' | 'usage' | 'install';
  question: string;
  answer: string;
}

export interface MockChatMessage {
  id: string;
  sender: 'user' | 'ai';
  platform: 'gemini';
  content: string;
  mathSnippet?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  codeSnippet?: string;
  time: string;
}

export type ExportFormat = 'pdf' | 'word' | 'md' | 'html';
