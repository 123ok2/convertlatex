import { mml2omml } from 'mathml2omml';
import katex from 'katex';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImportedXmlComponent
} from 'docx';

/**
 * Chuyển đổi mã LaTeX thành component OMML của thư viện docx
 */
export function latexToOmmlComponent(latex: string, isBlock = false): any {
  try {
    let mml = katex.renderToString(latex, { output: 'mathml', displayMode: isBlock });
    // Loại bỏ hoàn toàn annotation và semantics để Word không bị lặp văn bản
    mml = mml.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/gi, '').replace(/<\/?semantics>/gi, '');
    const match = mml.match(/<math[\s\S]*?<\/math>/i);
    if (!match) {
      return new TextRun({ text: latex, font: 'Cambria Math' });
    }
    const omml = mml2omml(match[0]);
    const comp = ImportedXmlComponent.fromXmlString(omml) as any;
    return comp.root && comp.root[0] ? comp.root[0] : comp;
  } catch (e) {
    return new TextRun({ text: latex, font: 'Cambria Math' });
  }
}

/**
 * Chuyển đổi mã LaTeX thành chuỗi OMML XML trực tiếp (dùng cho HTML xuất bản/clipboard Word)
 */
export function latexToOmmlXml(latex: string, isBlock = false): string {
  try {
    let mml = katex.renderToString(latex, { output: 'mathml', displayMode: isBlock });
    mml = mml.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/gi, '').replace(/<\/?semantics>/gi, '');
    const match = mml.match(/<math[\s\S]*?<\/math>/i);
    if (!match) return latex;
    let omml = mml2omml(match[0]);
    if (isBlock) {
      return `<p align="center" style="text-align:center;margin:12pt 0;"><m:oMathPara>${omml}</m:oMathPara></p>`;
    }
    return omml;
  } catch (e) {
    return latex;
  }
}

/**
 * Trích xuất và chuẩn hóa MathML từ KaTeX math element để dán vào Word
 */
export function cleanMathMlFromElement(mathEl: Element): string {
  const clone = mathEl.cloneNode(true) as Element;
  clone.querySelectorAll('annotation').forEach(el => el.remove());
  clone.querySelectorAll('semantics').forEach(el => {
    // Di chuyển các phần tử con ra ngoài semantics
    while (el.firstChild) {
      el.parentNode?.insertBefore(el.firstChild, el);
    }
    el.remove();
  });
  return clone.outerHTML;
}

/**
 * Chuẩn hóa khoảng trắng quanh công thức để tránh dính chữ trong Word
 */
export function normalizeSpacesInClone(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue) {
      node.nodeValue = node.nodeValue.replace(/[^\S\r\n]{2,}/g, ' ');
    }
  }

  root.querySelectorAll('.katex, m\\:oMath, m\\:oMathPara, math').forEach(el => {
    const prev = el.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE) {
      const txt = prev.nodeValue || '';
      if (txt.endsWith(' ')) {
        prev.nodeValue = txt.slice(0, -1) + '\u00A0';
      }
    }
    const next = el.nextSibling;
    if (next && next.nodeType === Node.TEXT_NODE) {
      const txt = next.nodeValue || '';
      if (txt.startsWith(' ')) {
        next.nodeValue = '\u00A0' + txt.slice(1);
      }
    }
  });
}

/**
 * Tạo tài liệu HTML tối ưu tuyệt đối cho Microsoft Word
 * - Xóa sạch lớp bảo vệ / nút bấm / katex-html
 * - Loại bỏ toàn bộ thẻ <annotation> (nguyên nhân gây lặp chữ 50 g50\text{ g})
 * - Thay thế công thức bằng OMML chuẩn (<m:oMath>)
 * - Tích hợp đầy đủ namespace Office Word
 */
export function prepareHtmlForWord(sourceEl: HTMLElement): { fullHtml: string; cleanText: string } {
  const clone = sourceEl.cloneNode(true) as HTMLElement;

  // 1. Xóa các nút bấm thao tác và các lớp thừa
  clone.querySelectorAll('.copy-protection-decoy, button, .formula-action-btn, [data-copy-hidden="true"]').forEach(el => el.remove());

  // 2. Xóa các phần tử hiển thị SVG/HTML của KaTeX, chỉ giữ MathML/OMML
  clone.querySelectorAll('.katex-html').forEach(el => el.remove());

  // 3. XÓA BỎ TOÀN BỘ THẺ ANNOTATION (Nguyên nhân chính gây lỗi lặp chữ)
  clone.querySelectorAll('annotation').forEach(el => el.remove());

  // 4. Chuyển đổi các công thức .katex thành OMML chuẩn của Word với cơ chế Token để giữ nguyên chữ hoa/thường (m:oMath, m:fPr...)
  const mathReplacements: { token: string; omml: string }[] = [];
  const katexElements = Array.from(clone.querySelectorAll('.katex'));

  katexElements.forEach((el, index) => {
    const isBlock = el.closest('.katex-display') !== null;
    const mathEl = el.querySelector('math');
    const token = `__WORD_OMML_MATH_TOKEN_${index}__`;

    if (mathEl) {
      try {
        const cleanMml = cleanMathMlFromElement(mathEl);
        const rawOmml = mml2omml(cleanMml);
        const ommlStr = isBlock
          ? `<p align="center" style="text-align:center;margin:12pt 0;"><m:oMathPara>${rawOmml}</m:oMathPara></p>`
          : rawOmml;

        mathReplacements.push({ token, omml: ommlStr });
      } catch (e) {
        const cleanMml = cleanMathMlFromElement(mathEl);
        mathReplacements.push({ token, omml: cleanMml });
      }
    } else {
      mathReplacements.push({ token, omml: el.textContent || '' });
    }

    const tokenSpan = document.createElement('span');
    tokenSpan.textContent = token;
    if (isBlock) {
      const displayParent = el.closest('.katex-display');
      if (displayParent) {
        displayParent.replaceWith(tokenSpan);
      } else {
        el.replaceWith(tokenSpan);
      }
    } else {
      el.replaceWith(tokenSpan);
    }
  });

  // 5. Chuẩn hóa khoảng trắng để văn bản không bị dính chữ
  normalizeSpacesInClone(clone);

  // 6. Xử lý định dạng bảng biểu
  clone.querySelectorAll('table').forEach(table => {
    table.setAttribute('border', '1');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '6');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '12pt 0';
    table.style.border = '1px solid black';
  });
  clone.querySelectorAll('td, th').forEach(cell => {
    (cell as HTMLElement).style.border = '1px solid black';
    (cell as HTMLElement).style.padding = '6pt';
  });

  let bodyContent = clone.innerHTML;
  // Khôi phục chính xác các chuỗi OMML XML nguyên bản, bảo toàn 100% cú pháp PascalCase/camelCase của Office Word
  for (const { token, omml } of mathReplacements) {
    bodyContent = bodyContent.replace(token, omml);
  }

  const cleanText = clone.innerText || clone.textContent || '';

  const fullHtml = `<!DOCTYPE html>
<html xmlns:v='urn:schemas-microsoft-com:vml'
      xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns:m='http://schemas.openxmlformats.org/officeDocument/2006/math' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Tài liệu chuyển đổi</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
      margin: 20mm;
    }
    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }
    m\\:oMath {
      font-family: 'Cambria Math', serif;
    }
    m\\:oMathPara {
      text-align: center;
      margin: 12pt 0;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 12pt;
      margin-bottom: 5pt;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 8pt;
      padding-left: 24pt;
    }
    li {
      margin-bottom: 3pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
    }
    th, td {
      border: 1px solid black;
      padding: 6pt;
      text-align: left;
    }
    th {
      font-weight: bold;
      background-color: #f1f5f9;
    }
    blockquote {
      border-left: 3pt solid #94a3b8;
      padding-left: 10pt;
      margin: 8pt 0;
      color: #475569;
      font-style: italic;
    }
  </style>
</head>
<body>
<!--StartFragment-->
${bodyContent}
<!--EndFragment-->
</body>
</html>`;

  return { fullHtml, cleanText };
}

/**
 * Phân tích văn bản nội dòng chứa công thức toán ($...$) và in đậm/nghiêng thành các TextRun / MathRun của docx
 */
function parseInlineRuns(text: string): any[] {
  const runs: any[] = [];
  // Tách theo công thức toán inline $...$
  const mathTokens = text.split(/(\$[^\$]+?\$)/g);

  for (let i = 0; i < mathTokens.length; i++) {
    const token = mathTokens[i];
    if (!token) continue;

    if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
      const latex = token.slice(1, -1).trim();
      runs.push(latexToOmmlComponent(latex, false));
    } else {
      // Phân tách in đậm **...**
      const boldTokens = token.split(/(\*\*[^\*]+?\*\*)/g);
      for (const bToken of boldTokens) {
        if (!bToken) continue;

        if (bToken.startsWith('**') && bToken.endsWith('**') && bToken.length > 4) {
          const boldText = bToken.slice(2, -2);
          runs.push(
            new TextRun({
              text: boldText,
              bold: true,
              font: 'Times New Roman',
              size: 26, // 13pt
            })
          );
        } else {
          // Phân tách in nghiêng *...*
          const italicTokens = bToken.split(/(\*[^\*]+?\*)/g);
          for (const iToken of italicTokens) {
            if (!iToken) continue;
            if (iToken.startsWith('*') && iToken.endsWith('*') && iToken.length > 2) {
              runs.push(
                new TextRun({
                  text: iToken.slice(1, -1),
                  italics: true,
                  font: 'Times New Roman',
                  size: 26,
                })
              );
            } else {
              runs.push(
                new TextRun({
                  text: iToken,
                  font: 'Times New Roman',
                  size: 26,
                })
              );
            }
          }
        }
      }
    }
  }

  return runs;
}

/**
 * Tạo file Word (.docx) chuyên nghiệp với công thức OMML chuẩn gốc từ mã Markdown
 */
export async function exportMarkdownToDocx(markdown: string, title = 'TaiLieuToan'): Promise<Blob> {
  const lines = markdown.split(/\r?\n/);
  const docChildren: any[] = [];

  let inBlockMath = false;
  let blockMathBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Xử lý block math nhiều dòng $$ ... $$
    if (inBlockMath) {
      if (trimmed.endsWith('$$')) {
        blockMathBuffer.push(trimmed.slice(0, -2));
        const fullLatex = blockMathBuffer.join('\n').trim();
        const mathComp = latexToOmmlComponent(fullLatex, true);
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [mathComp],
          })
        );
        inBlockMath = false;
        blockMathBuffer = [];
      } else {
        blockMathBuffer.push(line);
      }
      continue;
    }

    if (trimmed.startsWith('$$')) {
      if (trimmed.endsWith('$$') && trimmed.length > 2 && trimmed.indexOf('$$', 2) !== -1) {
        // Block math 1 dòng
        const mathContent = trimmed.slice(2, -2).trim();
        const mathComp = latexToOmmlComponent(mathContent, true);
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [mathComp],
          })
        );
      } else {
        inBlockMath = true;
        blockMathBuffer = [trimmed.slice(2)];
      }
      continue;
    }

    // Dòng trống
    if (!trimmed) {
      continue;
    }

    // Tiêu đề
    if (trimmed.startsWith('# ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 120 },
          children: parseInlineRuns(trimmed.slice(2).trim()),
        })
      );
    } else if (trimmed.startsWith('## ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
          children: parseInlineRuns(trimmed.slice(3).trim()),
        })
      );
    } else if (trimmed.startsWith('### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
          children: parseInlineRuns(trimmed.slice(4).trim()),
        })
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      // Danh sách gạch đầu dòng
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          children: parseInlineRuns(trimmed.slice(2).trim()),
        })
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      // Danh sách có thứ tự
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      const content = match ? match[2] : trimmed;
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: (match ? match[1] + '. ' : ''),
              bold: true,
              font: 'Times New Roman',
              size: 26,
            }),
            ...parseInlineRuns(content),
          ],
        })
      );
    } else {
      // Đoạn văn thông thường
      const isMcq = /^\s*[A-Ea-e][\.\)\:\-]\s+/.test(trimmed);
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 120 },
          indent: isMcq ? { left: 720, hanging: 360 } : undefined,
          children: parseInlineRuns(trimmed),
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren.length > 0 ? docChildren : [new Paragraph({ text: '' })],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
