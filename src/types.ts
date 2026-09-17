export type BrowserType = 'chrome' | 'edge' | 'coccoc' | 'brave';

export type ExportFormat = 'pdf' | 'word' | 'md' | 'html';

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
  question: string;
  answer: string;
  category: 'install' | 'usage' | 'error' | 'security';
}

export interface MockChatMessage {
  id: string;
  sender: 'user' | 'ai';
  platform: 'gemini' | 'chatgpt';
  content: string;
  mathSnippet?: string;
  codeSnippet?: string;
  tableData?: { headers: string[]; rows: string[][] };
  time: string;
}
